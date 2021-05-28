// SPDX-License-Identifier: MIT

pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "./CToken.sol";
import "./ErrorReporter.sol";
import "./PriceOracle.sol";
import "./ComptrollerInterface.sol";
import "./ComptrollerStorage.sol";
import "./Unitroller.sol";
import "./Governance/Comp.sol";
import 'hardhat/console.sol';
import "./SafeMath.sol";
import "./interface/Breeder.sol";

/**
 * @title Compound's Comptroller Contract
 * @author Compound
 */
contract ClaimContract is ComptrollerV6Storage, ComptrollerErrorReporter, ExponentialNoError {
    using SafeMath for uint;

    /// @notice Emitted when a new COMP speed is calculated for a market
    event CompSpeedUpdated(CToken indexed cToken, uint newSpeed);

    /// @notice Emitted when a new COMP speed is set for a contributor
    event ContributorCompSpeedUpdated(address indexed contributor, uint newSpeed);

    /// @notice Emitted when COMP is distributed to a supplier
    event DistributedSupplierComp(CToken indexed cToken, address indexed supplier, uint compDelta, uint compSupplyIndex);

    event DistributedSupplierClaimComp(address key, CToken indexed cToken, address indexed supplier, uint compDelta, uint compSupplyIndex);

    /// @notice Emitted when COMP is distributed to a borrower
    event DistributedBorrowerComp(CToken indexed cToken, address indexed borrower, uint compDelta, uint compBorrowIndex);

    event DistributedBorrowerClaimComp(address key, CToken indexed cToken, address indexed borrower, uint compDelta, uint compBorrowIndex);

    /// @notice Emitted when COMP is granted by admin
    event CompGranted(address recipient, uint amount);

    uint224 public constant compInitialIndex = 1e36;
    
    /**
     * @notice Checks caller is admin, or this contract is becoming the new implementation
     */
    function adminOrInitializing() internal view returns (bool) {
        return msg.sender == admin || msg.sender == comptrollerImplementation;
    }

    function _addClaimInfo(address key_, address token_, address pool_, bytes memory method_) public returns (uint) {
        ClaimInfo storage claimInfo = claimInfos[key_];
        require(claimInfo.token == address(0), "already added");
        claimInfo.token = token_;
        claimInfo.pool = pool_;
        claimInfo.method = method_;
        claimInfo.index = claimInfoKeys.length;
        claimInfoKeys.push(key_);
    }

    function _delClaimInfo(address key_) public returns (uint) {
        uint index = claimInfos[key_].index;
        if (index == claimInfoKeys.length - 1) {
            delete claimInfoKeys[claimInfoKeys.length - 1];
        } else {
            claimInfos[claimInfoKeys[claimInfoKeys.length - 1]].index =  claimInfos[key_].index;
            claimInfoKeys[claimInfos[key_].index] = claimInfoKeys[claimInfoKeys.length - 1];
            delete claimInfoKeys[claimInfoKeys.length - 1];
        }
        delete claimInfos[key_]; 
    }

    function _addMarketToClaimInfo(address key_, address[] memory markets_, uint[] memory allocPoint_, uint[] memory borrowRate_) public returns (uint) {
        require(markets_.length == borrowRate_.length, "illegal num of markets");
        ClaimInfo storage claimInfo = claimInfos[key_];
        uint256 totalAllocPoint = 0;
        for (uint i = 0; i < markets_.length; i ++) {
            require(borrowRate_[i] <= 10 ** 4, "illegal borrowRate");
            claimInfo.markets[markets_[i]] = true;
            claimInfo.borrowRate[markets_[i]] = borrowRate_[i];
            totalAllocPoint = totalAllocPoint.add(allocPoint_[i]);
            claimInfo.marketAllocPoint[markets_[i]] = allocPoint_[i];
        }
        claimInfo.totalAllocPoint = claimInfo.totalAllocPoint.add(totalAllocPoint);
    }

    function _delMarketToClaimInfo(address key_, address[] memory markets_) public returns (uint) {
        ClaimInfo storage claimInfo = claimInfos[key_];
        for (uint i = 0; i < markets_.length; i ++) {
            delete claimInfo.markets[markets_[i]];
            delete claimInfo.borrowRate[markets_[i]];
            claimInfo.totalAllocPoint = claimInfo.totalAllocPoint.sub(claimInfo.marketAllocPoint[markets_[i]]);
            delete claimInfo.marketAllocPoint[markets_[i]];
        }
    }

    /*** Comp Distribution ***/

    /**
     * @notice Set COMP speed for a single market
     * @param cToken The market whose COMP speed to update
     * @param compSpeed New COMP speed for market
     */
    function setCompSpeedInternal(CToken cToken, uint compSpeed) internal {
        uint currentCompSpeed = compSpeeds[address(cToken)];
        if (currentCompSpeed != 0) {
            // note that COMP speed could be set to 0 to halt liquidity rewards for a market
            updateCompSupplyIndex(address(cToken));
            updateClaimIndex();
        } else if (compSpeed != 0) {
            // Add the COMP market
            Market storage market = markets[address(cToken)];
            require(market.isListed == true, "comp market is not listed");

            if (compSupplyState[address(cToken)].index == 0 && compSupplyState[address(cToken)].block == 0) {
                compSupplyState[address(cToken)] = CompMarketState({
                    index: compInitialIndex,
                    block: safe32(getBlockNumber(), "block number exceeds 32 bits")
                });
            }

            if (compBorrowState[address(cToken)].index == 0 && compBorrowState[address(cToken)].block == 0) {
                compBorrowState[address(cToken)] = CompMarketState({
                    index: compInitialIndex,
                    block: safe32(getBlockNumber(), "block number exceeds 32 bits")
                });
            }
        }

        if (currentCompSpeed != compSpeed) {
            compSpeeds[address(cToken)] = compSpeed;
            emit CompSpeedUpdated(cToken, compSpeed);
        }
    }

    /**
     * @notice Accrue COMP to the market by updating the supply index
     * @param cToken The market whose supply index to update
     */
    function updateCompSupplyIndex(address cToken) public {
        CompMarketState storage supplyState = compSupplyState[cToken];
        uint supplySpeed = compSpeeds[cToken];
        uint blockNumber = getBlockNumber();
        uint deltaBlocks = sub_(blockNumber, uint(supplyState.block));
        if (deltaBlocks > 0 && supplySpeed > 0) {
            uint supplyTokens = CToken(cToken).totalSupply();
            uint compAccrued = mul_(deltaBlocks, supplySpeed);
            Double memory ratio = supplyTokens > 0 ? fraction(compAccrued, supplyTokens) : Double({mantissa: 0});
            Double memory index = add_(Double({mantissa: supplyState.index}), ratio);
            compSupplyState[cToken] = CompMarketState({
                index: safe224(index.mantissa, "new index exceeds 224 bits"),
                block: safe32(blockNumber, "block number exceeds 32 bits")
            });
        } else if (deltaBlocks > 0) {
            supplyState.block = safe32(blockNumber, "block number exceeds 32 bits");
        }
    }

    /**
     * @notice Accrue COMP to the market by updating the borrow index
     * @param cToken The market whose borrow index to update
     */
    function updateCompBorrowIndex(address cToken, uint256 marketBorrowIndex_) public {
        Exp memory marketBorrowIndex = Exp({mantissa: marketBorrowIndex_});
        CompMarketState storage borrowState = compBorrowState[cToken];
        uint borrowSpeed = compSpeeds[cToken];
        uint blockNumber = getBlockNumber();
        uint deltaBlocks = sub_(blockNumber, uint(borrowState.block));
        if (deltaBlocks > 0 && borrowSpeed > 0) {
            uint borrowAmount = div_(CToken(cToken).totalBorrows(), marketBorrowIndex);
            uint compAccrued = mul_(deltaBlocks, borrowSpeed);
            Double memory ratio = borrowAmount > 0 ? fraction(compAccrued, borrowAmount) : Double({mantissa: 0});
            Double memory index = add_(Double({mantissa: borrowState.index}), ratio);
            compBorrowState[cToken] = CompMarketState({
                index: safe224(index.mantissa, "new index exceeds 224 bits"),
                block: safe32(blockNumber, "block number exceeds 32 bits")
            });
        } else if (deltaBlocks > 0) {
            borrowState.block = safe32(blockNumber, "block number exceeds 32 bits");
        }
    }

    function updateClaimIndex() public {
        for (uint j = 0; j < claimInfoKeys.length; j ++) {
            address key = claimInfoKeys[j];
            ClaimInfo storage claimInfo = claimInfos[key];
            uint balanceBefore = CToken(claimInfo.token).balanceOf(address(this));
            //console.log("balanceBefore", balanceBefore);
            //console.log("pool address: ", claimInfo.pool);
            (bool success, ) = claimInfo.pool.call(claimInfo.method);
            assembly {
                if eq(success, 0) {
                    revert(0, 0)
                }
            }
            uint balanceAfter = CToken(claimInfo.token).balanceOf(address(this));
            //console.log("balanceAfter", balanceAfter);
            uint blockNumber = getBlockNumber();
            /*
            console.log("updateClaimIndex blockNumber: ", blockNumber);
            (uint256 p1, uint256 p2, uint256 p3, bool p4) = PiggyBreeder(claimInfo.pool).userInfo(1, address(this));
            console.log("amount: ", p1);
            console.log("rewardDebt: ", p2);
            console.log("pendingReward: ", p3);
            console.log("unStakeBeforeEnableClaim: ", p4);
            (address token, uint256 allocPoint, uint256 lastRewardBlock, uint256 accPiggyPerShare, uint256 totalDeposit, ) = PiggyBreeder(claimInfo.pool).poolInfo(1);
            console.log("token: ", token);
            console.log("allocPoint: ", allocPoint);
            console.log("lastRewardBlock: ", lastRewardBlock);
            console.log("accPiggyPerShare: ", accPiggyPerShare);
            console.log("totalDeposit: ", totalDeposit);
            */
            if (balanceBefore >= balanceAfter) {
                continue;
            }
            if (claimInfo.totalAllocPoint == 0) {
                continue;
            }
            console.log("balanceAfter - balanceBefor: ", balanceAfter.sub(balanceBefore));
            //console.log("allMarkets length: ", allMarkets.length);
            for (uint i = 0; i < allMarkets.length; i ++) {
                //console.log(address(allMarkets[i]));
                if (!claimInfo.markets[address(allMarkets[i])]) {
                    continue;
                }
                console.log("abc");
                console.log(claimInfo.totalAllocPoint);
                uint balance = balanceAfter.sub(balanceBefore).mul(10**18).mul(claimInfo.marketAllocPoint[address(allMarkets[i])]).div(claimInfo.totalAllocPoint);
                uint borrowBalance = balance.mul(claimInfo.borrowRate[address(allMarkets[i])]).div(10 ** 4);
                console.log("borrowBalance: ", borrowBalance);
                CompMarketState storage borrowState = claimInfo.borrowState[address(allMarkets[i])];
                if (borrowBalance > 0) {
                    Exp memory borrowIndex = Exp({mantissa: allMarkets[i].borrowIndex()});
                    uint borrowAmount = div_(allMarkets[i].totalBorrows(), borrowIndex);
                    Double memory ratio = borrowAmount > 0 ? fraction(borrowBalance.div(10**18), borrowAmount) : Double({mantissa: 0});
                    Double memory index = add_(Double({mantissa: borrowState.index}), ratio);
                    claimInfo.borrowState[address(allMarkets[i])] = CompMarketState({
                        index: safe224(index.mantissa, "new index exceeds 224 bits"),
                        block: safe32(blockNumber, "block number exceeds 32 bits")
                    });
                } else {
                    borrowState.block = safe32(blockNumber, "block number exceeds 32 bits");
                }
                console.log("borrowState index: ", borrowState.index);
                uint supplyBalance = balance.sub(borrowBalance);
                console.log("supplyBalance: ", supplyBalance);
                CompMarketState storage supplyState = claimInfo.supplyState[address(allMarkets[i])];
                if (supplyBalance > 0) {
                    uint supplyTokens = allMarkets[i].totalSupply();
                    Double memory ratio = supplyTokens > 0 ? fraction(borrowBalance.div(10**18), supplyTokens) : Double({mantissa: 0});
                    Double memory index = add_(Double({mantissa: supplyState.index}), ratio);
                    claimInfo.supplyState[address(allMarkets[i])] = CompMarketState({
                        index: safe224(index.mantissa, "new index exceeds 224 bits"),
                        block: safe32(blockNumber, "block number exceeds 32 bits")
                    });
                } else {
                    supplyState.block = safe32(blockNumber, "block number exceeds 32 bits");
                }
                console.log("supplyState index: ", supplyState.index);
            }
        }
    }

    /**
     * @notice Calculate COMP accrued by a supplier and possibly transfer it to them
     * @param cToken The market in which the supplier is interacting
     * @param supplier The address of the supplier to distribute COMP to
     */
    function distributeSupplierComp(address cToken, address supplier) public {
        CompMarketState storage supplyState = compSupplyState[cToken];
        Double memory supplyIndex = Double({mantissa: supplyState.index});
        Double memory supplierIndex = Double({mantissa: compSupplierIndex[cToken][supplier]});
        compSupplierIndex[cToken][supplier] = supplyIndex.mantissa;

        if (supplierIndex.mantissa == 0 && supplyIndex.mantissa > 0) {
            supplierIndex.mantissa = compInitialIndex;
        }

        Double memory deltaIndex = sub_(supplyIndex, supplierIndex);
        uint supplierTokens = CToken(cToken).balanceOf(supplier);
        uint supplierDelta = mul_(supplierTokens, deltaIndex);
        uint supplierAccrued = add_(compAccrued[supplier], supplierDelta);
        compAccrued[supplier] = supplierAccrued;
        emit DistributedSupplierComp(CToken(cToken), supplier, supplierDelta, supplyIndex.mantissa);
    }

    function distributeSupplierClaim(address key, address cToken, address supplier) public {
        ClaimInfo storage claimInfo = claimInfos[key];
        CompMarketState storage supplyState = claimInfo.supplyState[cToken];
        Double memory supplyIndex = Double({mantissa: supplyState.index});
        Double memory supplierIndex = Double({mantissa: claimInfo.supplierIndex[cToken][supplier]});
        claimInfo.supplierIndex[cToken][supplier] = supplyIndex.mantissa;

        if (supplierIndex.mantissa == 0 && supplyIndex.mantissa > 0) {
            supplierIndex.mantissa = compInitialIndex;
        }

        Double memory deltaIndex = sub_(supplyIndex, supplierIndex);
        uint supplierTokens = CToken(cToken).balanceOf(supplier);
        uint supplierDelta = mul_(supplierTokens, deltaIndex);
        uint supplierAccrued = add_(claimAccrued[claimInfo.token][supplier], supplierDelta);
        claimAccrued[claimInfo.token][supplier] = supplierAccrued;
        emit DistributedSupplierClaimComp(key, CToken(cToken), supplier, supplierDelta, supplyIndex.mantissa);
    }

    /**
     * @notice Calculate COMP accrued by a borrower and possibly transfer it to them
     * @dev Borrowers will not begin to accrue until after the first interaction with the protocol.
     * @param cToken The market in which the borrower is interacting
     * @param borrower The address of the borrower to distribute COMP to
     */
    function distributeBorrowerComp(address cToken, address borrower, uint256 marketBorrowIndex_) public {
        console.log("test123sdfafjeawifjaewifji");
        Exp memory marketBorrowIndex = Exp({mantissa: marketBorrowIndex_});
        CompMarketState storage borrowState = compBorrowState[cToken];
        Double memory borrowIndex = Double({mantissa: borrowState.index});
        Double memory borrowerIndex = Double({mantissa: compBorrowerIndex[cToken][borrower]});
        compBorrowerIndex[cToken][borrower] = borrowIndex.mantissa;

        if (borrowerIndex.mantissa > 0) {
            Double memory deltaIndex = sub_(borrowIndex, borrowerIndex);
            uint borrowerAmount = div_(CToken(cToken).borrowBalanceStored(borrower), marketBorrowIndex);
            uint borrowerDelta = mul_(borrowerAmount, deltaIndex);
            uint borrowerAccrued = add_(compAccrued[borrower], borrowerDelta);
            compAccrued[borrower] = borrowerAccrued;
            emit DistributedBorrowerComp(CToken(cToken), borrower, borrowerDelta, borrowIndex.mantissa);
        }
    }

    function distributeBorrowerClaim(address key, address cToken, address borrower) public {
        Exp memory marketBorrowIndex = Exp({mantissa: CToken(cToken).borrowIndex()});
        ClaimInfo storage claimInfo = claimInfos[key];
        CompMarketState storage borrowState = claimInfo.borrowState[cToken];
        Double memory borrowIndex = Double({mantissa: borrowState.index});
        Double memory borrowerIndex = Double({mantissa: claimInfo.borrowerIndex[cToken][borrower]});
        claimInfo.borrowerIndex[cToken][borrower] = borrowIndex.mantissa;
        if (borrowerIndex.mantissa > 0) {
            Double memory deltaIndex = sub_(borrowIndex, borrowerIndex);
            uint borrowerAmount = div_(CToken(cToken).borrowBalanceStored(borrower), marketBorrowIndex);
            uint borrowerDelta = mul_(borrowerAmount, deltaIndex);
            uint borrowerAccrued = add_(claimAccrued[claimInfo.token][borrower], borrowerDelta);
            claimAccrued[claimInfo.token][borrower] = borrowerAccrued;
            emit DistributedBorrowerClaimComp(key, CToken(cToken), borrower, borrowerDelta, borrowIndex.mantissa);
        }
    }

    function claim(address holder) public {
        updateClaimIndex();
        for (uint i = 0; i < allMarkets.length; i++) {
            for (uint j = 0; j < claimInfoKeys.length; j ++) {
                if (!claimInfos[claimInfoKeys[j]].markets[address(allMarkets[i])]) {
                    continue;
                }
                distributeBorrowerClaim(claimInfoKeys[j], address(allMarkets[i]), holder);
                distributeSupplierClaim(claimInfoKeys[j], address(allMarkets[i]), holder);
            }
        }
        for (uint i = 0; i < claimInfoKeys.length; i ++) {
            address token = claimInfos[claimInfoKeys[i]].token; 
            console.log("claim token: ", token, " amount: ", claimAccrued[token][holder]);
            claimAccrued[token][holder] = grantTokenInternal(token, holder, claimAccrued[token][holder]);

        }
    }

    /*
    function claim(address key, address holder) public {
        return claimAll(holder, key, allMarkets);
    }

    function claimAll(address key, address holder, CToken[] memory cTokens) public {
        address[] memory holders = new address[](1);
        holders[0] = holder;
        claimAllUserAll(key, holders, cTokens, true, true);
    }

    function claimAllUserAll(address key, address[] memory holders, CToken[] memory cTokens, bool borrowers, bool suppliers) public {
    }
    */

    /**
     * @notice Claim all the comp accrued by holder in all markets
     * @param holder The address to claim COMP for
     */
    function claimComp(address holder) public {
        return claimAllComp(holder, allMarkets);
    }

    /**
     * @notice Claim all the comp accrued by holder in the specified markets
     * @param holder The address to claim COMP for
     * @param cTokens The list of markets to claim COMP in
     */
    function claimAllComp(address holder, CToken[] memory cTokens) public {
        address[] memory holders = new address[](1);
        holders[0] = holder;
        claimAllUserAllComp(holders, cTokens, true, true);
    }

    /**
     * @notice Claim all comp accrued by the holders
     * @param holders The addresses to claim COMP for
     * @param cTokens The list of markets to claim COMP in
     * @param borrowers Whether or not to claim COMP earned by borrowing
     * @param suppliers Whether or not to claim COMP earned by supplying
     */
    function claimAllUserAllComp(address[] memory holders, CToken[] memory cTokens, bool borrowers, bool suppliers) public {
        for (uint i = 0; i < cTokens.length; i++) {
            CToken cToken = cTokens[i];
            require(markets[address(cToken)].isListed, "market must be listed");
            if (borrowers == true) {
                Exp memory borrowIndex = Exp({mantissa: cToken.borrowIndex()});
                updateCompBorrowIndex(address(cToken), borrowIndex.mantissa);
                updateClaimIndex();
                for (uint j = 0; j < holders.length; j++) {
                    distributeBorrowerComp(address(cToken), holders[j], borrowIndex.mantissa);
                    for (uint m = 0; m < claimInfoKeys.length; m ++) {
                        distributeBorrowerClaim(claimInfoKeys[m], address(cToken), holders[j]);
                    }
                    compAccrued[holders[j]] = grantCompInternal(holders[j], compAccrued[holders[j]]);
                }
            }
            if (suppliers == true) {
                updateCompSupplyIndex(address(cToken));
                updateClaimIndex();
                for (uint j = 0; j < holders.length; j++) {
                    distributeSupplierComp(address(cToken), holders[j]);
                    for (uint m = 0; m < claimInfoKeys.length; m ++) {
                        distributeSupplierClaim(claimInfoKeys[m], address(cToken), holders[j]);
                    }
                    compAccrued[holders[j]] = grantCompInternal(holders[j], compAccrued[holders[j]]);
                }
            }
        }
    }

    function grantTokenInternal(address token, address user, uint amount) internal returns (uint) {
        uint remaining = CToken(token).balanceOf(address(this));
        if (amount > 0 && amount <= remaining) {
            CToken(token).transfer(user, amount);
            return 0;
        }
        return amount;
    }

    /**
     * @notice Transfer COMP to the user
     * @dev Note: If there is not enough COMP, we do not perform the transfer all.
     * @param user The address of the user to transfer COMP to
     * @param amount The amount of COMP to (possibly) transfer
     * @return The amount of COMP which was NOT transferred to the user
     */
    function grantCompInternal(address user, uint amount) internal returns (uint) {
        Comp comp = Comp(getCompAddress());
        uint compRemaining = comp.balanceOf(address(this));
        if (amount > 0 && amount <= compRemaining) {
            comp.transfer(user, amount);
            return 0;
        }
        return amount;
    }

    /*** Comp Distribution Admin ***/

    function stake(address key, address lpToken, uint amount, bytes memory data) public returns (uint) {
        ClaimInfo storage claimInfo = claimInfos[key];
        if (amount > 0) {
            CToken(lpToken).approve(claimInfo.pool, amount);
        }
        (bool success, ) = claimInfo.pool.call(data);
        assembly {
            if eq(success, 0) {
                revert(0, 0)
            }
        }
        if (amount > 0) {
            CToken(lpToken).approve(claimInfo.pool, 0);
        }
    }

    /**
     * @notice Transfer COMP to the recipient
     * @dev Note: If there is not enough COMP, we do not perform the transfer all.
     * @param recipient The address of the recipient to transfer COMP to
     * @param amount The amount of COMP to (possibly) transfer
     */
    function _grantComp(address recipient, uint amount) public {
        require(adminOrInitializing(), "only admin can grant comp");
        uint amountLeft = grantCompInternal(recipient, amount);
        require(amountLeft == 0, "insufficient comp for grant");
        emit CompGranted(recipient, amount);
    }

    /**
     * @notice Set COMP speed for a single market
     * @param cToken The market whose COMP speed to update
     * @param compSpeed New COMP speed for market
     */
    function _setCompSpeed(CToken cToken, uint compSpeed) public {
        require(adminOrInitializing(), "only admin can set comp speed");
        setCompSpeedInternal(cToken, compSpeed);
    }

    /**
     * @notice Return all of the markets
     * @dev The automatic getter may be used to access an individual market.
     * @return The list of market addresses
     */
    function getAllMarkets() public view returns (CToken[] memory) {
        return allMarkets;
    }
    function getBlockNumber() public view returns (uint) {
        return block.number;
    }

    /**
     * @notice Return the address of the COMP token
     * @return The address of COMP
     */
    function getCompAddress() public pure returns (address) {
        return 0xE499Ef4616993730CEd0f31FA2703B92B50bB536;
    }
}
