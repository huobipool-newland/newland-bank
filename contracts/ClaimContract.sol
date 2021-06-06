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
            updateClaimIndex(address(cToken));
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

    function updateClaimBorrowIndex(uint balance, address market, ClaimInfo storage claimInfo) internal {
        uint borrowBalance = balance.mul(claimInfo.borrowRate[market]).div(10 ** 4).div(1e18);
        CompMarketState storage borrowState = claimInfo.borrowState[market];
        if (borrowBalance > 0) {
            Exp memory borrowIndex = Exp({mantissa: CToken(market).borrowIndex()});
            uint borrowAmount = div_(CToken(market).totalBorrows(), borrowIndex);
            Double memory ratio = borrowAmount > 0 ? fraction(borrowBalance, borrowAmount) : Double({mantissa: 0});
            Double memory index = add_(Double({mantissa: borrowState.index}), ratio);
            claimInfo.borrowState[market] = CompMarketState({
                index: safe224(index.mantissa, "new index exceeds 224 bits"),
                block: safe32(getBlockNumber(), "block number exceeds 32 bits")
            });
        } else {
            borrowState.block = safe32(getBlockNumber(), "block number exceeds 32 bits");
        }
    }

    function updateClaimSupplyIndex(uint balance, address market, ClaimInfo storage claimInfo) internal {
        uint supplyBalance = balance.sub(balance.mul(claimInfo.borrowRate[market]).div(10 ** 4)).div(1e18);
        CompMarketState storage supplyState = claimInfo.supplyState[market];
        if (supplyBalance > 0) {
            uint supplyTokens = CToken(market).totalSupply();
            Double memory ratio = supplyTokens > 0 ? fraction(supplyBalance, supplyTokens) : Double({mantissa: 0});
            Double memory index = add_(Double({mantissa: supplyState.index}), ratio);
            claimInfo.supplyState[market] = CompMarketState({
                index: safe224(index.mantissa, "new index exceeds 224 bits"),
                block: safe32(getBlockNumber(), "block number exceeds 32 bits")
            });
        } else {
            supplyState.block = safe32(getBlockNumber(), "block number exceeds 32 bits");
        }
    }

    function updateClaimIndex(address market) public {
        for (uint i = 0; i < claimInfoKeys.length; i ++) {
            ClaimInfo storage claimInfo = claimInfos[claimInfoKeys[i]];
            if (!claimInfo.markets[market]) {
                continue;
            }
            uint balanceBefore = CToken(claimInfo.token).balanceOf(address(this));
            (bool success, ) = claimInfo.pool.call(claimInfo.method);
            assembly {
                if eq(success, 0) {
                    revert(0, 0)
                }
            }
            uint balanceAfter = CToken(claimInfo.token).balanceOf(address(this));
            //uint blockNumber = getBlockNumber();
            if (balanceBefore >= balanceAfter) {
                continue;
            }
            if (claimInfo.totalAllocPoint == 0) {
                continue;
            }
            for (uint j = 0; j < allMarkets.length; j ++) {
                if (!claimInfo.markets[address(allMarkets[j])]) {
                    continue;
                }
                uint deltaBalance = balanceAfter.sub(balanceBefore).mul(1e18).mul(claimInfo.marketAllocPoint[address(allMarkets[j])]).div(claimInfo.totalAllocPoint);
                updateClaimBorrowIndex(deltaBalance, address(allMarkets[j]), claimInfo);
                updateClaimSupplyIndex(deltaBalance, address(allMarkets[j]), claimInfo);
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
        marketClaimAccrued[getCompAddress()][cToken][supplier] = add_(marketClaimAccrued[getCompAddress()][cToken][supplier], supplierDelta);
        compAccrued[supplier] = supplierAccrued;
        emit DistributedSupplierComp(CToken(cToken), supplier, supplierDelta, supplyIndex.mantissa);
    }

    function distributeSupplierClaim(address key, address cToken, address supplier) public {
        ClaimInfo storage claimInfo = claimInfos[key];
        CompMarketState storage supplyState = claimInfo.supplyState[cToken];
        Double memory supplyIndex = Double({mantissa: supplyState.index});
        Double memory supplierIndex = Double({mantissa: claimInfo.supplierIndex[cToken][supplier]});
        claimInfo.supplierIndex[cToken][supplier] = supplyIndex.mantissa;
        if (supplierIndex.mantissa > 0) {
            Double memory deltaIndex = sub_(supplyIndex, supplierIndex);
            uint supplierTokens = CToken(cToken).balanceOf(supplier);
            uint supplierDelta = mul_(supplierTokens, deltaIndex);
            uint supplierAccrued = add_(claimAccrued[claimInfo.token][supplier], supplierDelta);
            marketClaimAccrued[claimInfo.token][cToken][supplier] = add_(marketClaimAccrued[claimInfo.token][cToken][supplier], supplierDelta);
            claimAccrued[claimInfo.token][supplier] = supplierAccrued;
            emit DistributedSupplierClaimComp(key, CToken(cToken), supplier, supplierDelta, supplyIndex.mantissa);
        }
    }

    /**
     * @notice Calculate COMP accrued by a borrower and possibly transfer it to them
     * @dev Borrowers will not begin to accrue until after the first interaction with the protocol.
     * @param cToken The market in which the borrower is interacting
     * @param borrower The address of the borrower to distribute COMP to
     */
    function distributeBorrowerComp(address cToken, address borrower, uint256 marketBorrowIndex_) public {
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
            marketClaimAccrued[getCompAddress()][cToken][borrower] = add_(marketClaimAccrued[getCompAddress()][cToken][borrower], borrowerDelta);
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
            marketClaimAccrued[claimInfo.token][cToken][borrower] = add_(marketClaimAccrued[claimInfo.token][cToken][borrower], borrowerDelta);
            claimAccrued[claimInfo.token][borrower] = borrowerAccrued;
            emit DistributedBorrowerClaimComp(key, CToken(cToken), borrower, borrowerDelta, borrowIndex.mantissa);
        }
    }

    function claim(address holder, CToken[] memory markets) public {
        for (uint i = 0; i < markets.length; i++) {
            for (uint j = 0; j < claimInfoKeys.length; j ++) {
                if (!claimInfos[claimInfoKeys[j]].markets[address(markets[i])]) {
                    continue;
                }
                updateClaimIndex(address(markets[i]));
                distributeBorrowerClaim(claimInfoKeys[j], address(markets[i]), holder);
                distributeSupplierClaim(claimInfoKeys[j], address(markets[i]), holder);
            }
        }
        for (uint i = 0; i < claimInfoKeys.length; i ++) {
            address token = claimInfos[claimInfoKeys[i]].token; 
            claimAccrued[token][holder] = grantTokenInternal(token, holder, claimAccrued[token][holder]);
        }
    }

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
                //updateClaimIndex();
                for (uint j = 0; j < holders.length; j++) {
                    distributeBorrowerComp(address(cToken), holders[j], borrowIndex.mantissa);
                    /*
                    for (uint m = 0; m < claimInfoKeys.length; m ++) {
                        distributeBorrowerClaim(claimInfoKeys[m], address(cToken), holders[j]);
                    }
                    */
                    compAccrued[holders[j]] = grantCompInternal(holders[j], compAccrued[holders[j]]);
                }
            }
            if (suppliers == true) {
                updateCompSupplyIndex(address(cToken));
                //updateClaimIndex();
                for (uint j = 0; j < holders.length; j++) {
                    distributeSupplierComp(address(cToken), holders[j]);
                    /*
                    for (uint m = 0; m < claimInfoKeys.length; m ++) {
                        distributeSupplierClaim(claimInfoKeys[m], address(cToken), holders[j]);
                    }
                    */
                    compAccrued[holders[j]] = grantCompInternal(holders[j], compAccrued[holders[j]]);
                }
            }
        }
    }

    function grantTokenInternal(address token, address user, uint amount) internal returns (uint) {
        uint remaining = CToken(token).balanceOf(address(this));
        CToken[] memory _allMarkets = allMarkets;
        if (amount > 0 && amount <= remaining) {
            for (uint i = 0; i < _allMarkets.length; i ++) {
                marketClaimAccrued[token][address(_allMarkets[i])][user] = 0;
            }
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
        CToken[] memory _allMarkets = allMarkets;
        if (amount > 0 && amount <= compRemaining) {
            for (uint i = 0; i < _allMarkets.length; i ++) {
                marketClaimAccrued[getCompAddress()][address(_allMarkets[i])][user] = 0;
            }
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

    function claimAll(address holder, CToken[] memory markets) public  {
        claimAllComp(holder, markets);
        claim(holder, markets);
    }
}
