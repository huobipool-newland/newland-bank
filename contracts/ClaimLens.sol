// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/math/SafeMath.sol';
import './interfaces/IComptroller.sol';
import './interfaces/ICErc20.sol';
import './interfaces/IBreeder.sol';
import 'hardhat/console.sol';

contract ClaimLens {
    using SafeMath for uint;
    using SafeMath for uint32;
    using SafeMath for uint224;

    IComptroller public comptroller;

    function setComptroller(IComptroller comptroller_) public {
        comptroller = comptroller_;
    }

    struct DEPInfo {
        address key;
        uint pid;
        uint marketAllocPoint;
        uint totalAllocPoint;
        uint borrowRate;
    }

    address public hpt;
    address public dep;
    address public usdt;
    address public mockDEP;
    address public depPool;
    mapping(address => DEPInfo[]) depInfos;

    function setHPT(address _hpt) external {
        hpt = _hpt;
    }

    function setDEP(address _dep) external {
        dep = _dep;
    }

    function setMockDEP(address _mockDEP) external {
        mockDEP = _mockDEP;
    }

    function setUSDT(address _usdt) external {
        usdt = _usdt;
    }

    function setDEPPool(address _depPool) external {
        depPool = _depPool;
    }

    function addDEPInfos(address _token, address _key, uint _pid, uint _marketAllocPoint, uint _totalAllocPoint, uint _borrowRate) external {
        DEPInfo[] storage infos = depInfos[_token];
        infos.push(DEPInfo({
            key: _key,
            pid: _pid,
            marketAllocPoint: _marketAllocPoint,
            totalAllocPoint: _totalAllocPoint,
            borrowRate: _borrowRate
        }));
    }

    function pendingHPTBorrowIndex (address _market, uint256 _borrowIndex, uint32 currentBlock) internal view returns (uint256) {
        (uint224 borrowIndex, uint32 borrowBlock) = comptroller.compBorrowState(_market);
        if (_borrowIndex == 0) {
            return borrowIndex;
        }
        if (borrowBlock >= currentBlock) {
            return borrowIndex;
        }
        uint borrowSpeed = comptroller.compSpeeds(_market);
        if (borrowSpeed == 0) {
            return borrowIndex;
        }
        uint borrowAmount = ICErc20(_market).totalBorrows().mul(1e18).div(_borrowIndex);
        if (borrowAmount == 0) {
            return borrowIndex;
        }
        uint deltaBlocks = currentBlock.sub(borrowBlock);
        uint compAccrued = deltaBlocks.mul(borrowSpeed);
        return borrowIndex.add(compAccrued.mul(1e36).div(borrowAmount));
    }

    function pendingHPTSupplyIndex (address _market, uint32 currentBlock) internal view returns (uint256) {
        (uint224 supplyIndex, uint32 supplyBlock) = comptroller.compSupplyState(_market);
        if (supplyBlock >= currentBlock) {
            return supplyIndex;
        }
        uint supplySpeed = comptroller.compSpeeds(_market);
        if (supplySpeed == 0) {
            return supplyIndex;
        }
        uint supplyTokens = ICErc20(_market).totalSupply();
        if (supplyTokens == 0) {
            return supplyIndex;
        }
        uint deltaBlocks = currentBlock.sub(supplyBlock);
        uint compAccrued = deltaBlocks.mul(supplySpeed);
        return supplyIndex.add(compAccrued.mul(1e18).div(supplyTokens));
    }

    function pendingHPT(address _holder, address _market, bool borrow, bool supply) public view returns (uint256 amount) {
        uint marketBorrowIndex = ICErc20(_market).borrowIndex();
        uint borrowAmount = ICErc20(_market).borrowBalanceStored(_holder);
        if (borrowAmount > 0 && borrow) {
            borrowAmount = borrowAmount.mul(1e18).div(marketBorrowIndex);
            uint borrowIndex = pendingHPTBorrowIndex(_market, marketBorrowIndex, uint32(block.number + 1));
            uint borrowerIndex = comptroller.compBorrowerIndex(_market, _holder);
            if (borrowerIndex < borrowIndex) {
                amount = amount.add(borrowAmount.mul(borrowIndex.sub(borrowerIndex)).div(1e18));
            }
        }
        uint supplyTokens = ICErc20(_market).balanceOf(_holder);
        if (supplyTokens > 0 && supply) {
            uint supplyIndex = pendingHPTSupplyIndex(_market, uint32(block.number + 1));
            uint supplierIndex = comptroller.compSupplierIndex(_market, _holder);
            if (supplierIndex < supplyIndex) {
                amount = amount.add(supplyTokens.mul(supplyIndex.sub(supplierIndex)));
            }
        }
        amount = amount.add(comptroller.marketClaimAccrued(hpt, _market, _holder)).div(1e18);
    }

    function getMultiplier(uint256 _from, uint256 _to) public pure returns (uint256) {
        return _to.sub(_from);
    }

    function _pendingDEP(uint256 _pid, address _user, uint32 currentBlock) internal view returns (uint256) {
        IBreeder.PoolInfo memory pool = IBreeder(depPool).poolInfo(_pid);
        IBreeder.UserInfo memory user = IBreeder(depPool).userInfo(_pid, _user);
        uint startBlock = IBreeder(depPool).startBlock();
        uint reduceIntervalBlock = IBreeder(depPool).reduceIntervalBlock();
        uint totalAllocPoint = IBreeder(depPool).totalAllocPoint();

        uint256 accPiggyPerShare = pool.accPiggyPerShare;
        uint256 lpSupply = ICErc20(pool.lpToken).balanceOf(depPool);

        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            // pending piggy reward
            uint256 piggyReward = 0;
            uint256 lastRewardBlockPower = pool.lastRewardBlock.sub(startBlock).div(reduceIntervalBlock);
            uint256 blockNumberPower = currentBlock.sub(startBlock).div(reduceIntervalBlock);

            // get piggyReward from pool.lastRewardBlock to block.number.
            // different interval different multiplier and piggyPerBlock, sum piggyReward
            if (lastRewardBlockPower == blockNumberPower) {
                uint256 multiplier = getMultiplier(pool.lastRewardBlock, currentBlock);
                piggyReward = piggyReward.add(multiplier.mul(IBreeder(depPool).getPiggyPerBlock(blockNumberPower)).mul(pool.allocPoint).div(totalAllocPoint));
            } else {
                for (uint256 i = lastRewardBlockPower; i <= blockNumberPower; i++) {
                    uint256 multiplier = 0;
                    if (i == lastRewardBlockPower) {
                        multiplier = getMultiplier(pool.lastRewardBlock, startBlock.add(lastRewardBlockPower.add(1).mul(reduceIntervalBlock)).sub(1));
                    } else if (i == blockNumberPower) {
                        multiplier = getMultiplier(startBlock.add(blockNumberPower.mul(reduceIntervalBlock)), block.number);
                    } else {
                        multiplier = reduceIntervalBlock;
                    }
                    piggyReward = piggyReward.add(multiplier.mul(IBreeder(depPool).getPiggyPerBlock(i)).mul(pool.allocPoint).div(totalAllocPoint));
                }
            }
            accPiggyPerShare = accPiggyPerShare.add(piggyReward.mul(1e12).div(lpSupply));
        }

        // get pending value
        uint256 pendingValue = user.amount.mul(accPiggyPerShare).div(1e12).sub(user.rewardDebt);

        if (user.pendingReward > 0 && user.unStakeBeforeEnableClaim) {
            return pendingValue.add(user.pendingReward);
        }
        return pendingValue;
    }

    function pendingBorrowerDEP (address _market, address _holder, DEPInfo[] memory infos, uint borrowAmount, uint marketBorrowIndex) internal view returns (uint256 amount) {
        for (uint i = 0; i < infos.length; i ++) {
            if (infos[i].marketAllocPoint == 0 || infos[i].borrowRate == 0) {
                continue;
            }
            //uint pending = pendingPiggy(infos[i].pid, address(comptroller));
            uint marketPending = _pendingDEP(infos[i].pid, address(comptroller), uint32(block.number + 1)).mul(infos[i].marketAllocPoint).mul(infos[i].borrowRate).div(infos[i].totalAllocPoint).div(1e4);
            if (marketPending == 0) {
                continue;
            }
            uint224 borrowIndex = comptroller.claimBorrowIndex(infos[i].key, _market);
            uint totalBorrowIndex = borrowIndex.add(marketPending.mul(1e36).div(ICErc20(_market).totalBorrows().mul(1e18).div(marketBorrowIndex)));
            uint256 borrowerIndex = comptroller.claimBorrowerIndex(infos[i].key, _market, _holder);
            if (borrowerIndex < totalBorrowIndex && borrowerIndex > 0) {
                amount = amount.add(borrowAmount.mul(totalBorrowIndex.sub(borrowerIndex)).div(1e18));
            }
       }
    }

    function pendingSupplyDEP (address _market, address _holder, DEPInfo[] memory infos, uint supplyTokens) internal view returns (uint256 amount) {
        for (uint i = 0; i < infos.length; i ++) {
            if (infos[i].marketAllocPoint == 0 || infos[i].borrowRate == 1e4) {
                continue;
            }
            uint pending = IBreeder(depPool).pendingPiggy(infos[i].pid, address(comptroller));
            uint marketPending = pending.sub(pending.mul(infos[i].marketAllocPoint).mul(infos[i].borrowRate).div(infos[i].totalAllocPoint).div(1e4));
            if (marketPending == 0) {
                continue;
            }
            uint224 supplyIndex = comptroller.claimSupplyIndex(infos[i].key, _market);
            uint totalSupplyIndex = supplyIndex.add(marketPending.mul(1e18).div(ICErc20(_market).totalSupply()));
            uint256 supplierIndex = comptroller.claimSupplierIndex(infos[i].key, _market, _holder);
            if (supplierIndex < totalSupplyIndex) {
                amount = amount.add(supplyTokens.mul(totalSupplyIndex.sub(supplierIndex)).div(1e18));
            }
        }
    }

    function pendingDEP(address _holder, address _market, bool borrow, bool supply) public view returns (uint256 amount) {
        uint marketBorrowIndex = ICErc20(_market).borrowIndex();
        uint borrowAmount = ICErc20(_market).borrowBalanceStored(_holder);
        borrowAmount = borrowAmount.mul(1e18).div(marketBorrowIndex);
        DEPInfo[] memory infos = depInfos[_market];
        if (borrowAmount > 0 && borrow) {
            amount = amount.add(pendingBorrowerDEP(_market, _holder, infos, borrowAmount, marketBorrowIndex));
        }
        uint supplyTokens = ICErc20(_market).balanceOf(_holder);
        if (supplyTokens > 0 && supply) {
            amount = amount.add(pendingSupplyDEP(_market, _holder, infos, supplyTokens));
        }
        return amount.div(1e18).add(comptroller.marketClaimAccrued(dep, _market, _holder));
    }

    function pending(address _holder, address _market, address _token) external view returns (uint256 amount) {
        if (_token == dep) {
            return pendingDEP(_holder, _market, true, true);
        } else if (_token == hpt) {
            return pendingHPT(_holder, _market, true, true);
        } else {
            return 0;
        }
    }

    ///@notice claim all the profit of a user
    function claimAll(address holder) public {
        comptroller.claim(holder);
        comptroller.claimComp(holder);
    }

    function getPrice(address _token, address _base) internal view returns (uint256) {
        return 1e18;
    }

    function ApyHPT(address market, bool borrow, bool supply) public view returns (uint256) {
        address token = ICErc20(market).underlying();
        uint priceHPT = getPrice(hpt, usdt);
        uint speed = comptroller.compSpeeds(market);
        uint decimals = ICErc20(token).decimals();
        if (supply) {
            uint dived = ICErc20(market).totalSupply().mul(ICErc20(market).exchangeRateStored()).mul(getPrice(token, usdt)).div(1e18);
            if (dived == 0) {
                return 0;
            }
            if (decimals != 18) {
                return speed.mul(priceHPT).mul(10512000).mul(1e18).div(dived).div(10 ** (18 - decimals));
            } else {
                return speed.mul(priceHPT).mul(10512000).mul(1e18).div(dived);
            }
        } else if (borrow) {
            uint borrowIndex = ICErc20(market).borrowIndex();
            uint dived = 0;
            if (borrowIndex == 0) {
                dived = ICErc20(market).totalBorrows().mul(1e18).mul(getPrice(token, usdt));
            } else {
                dived = ICErc20(market).totalBorrows().mul(1e18).div(ICErc20(market).borrowIndex()).mul(getPrice(token, usdt));
            }
            if (dived == 0) {
                return 0;
            }
            if (decimals != 18) {
                return speed.mul(priceHPT).mul(10512000).mul(1e18).div(dived).div(10 ** (18 - decimals));
            } else {
                return speed.mul(priceHPT).mul(10512000).mul(1e18).div(dived);
            }
        } else {
            return 0;
        }
    }

    function getDEPPreBlock(uint256 pid, uint256 blockNumber) internal view returns (uint256) {
        uint startBlock = IBreeder(depPool).startBlock();
        uint reduceIntervalBlock = IBreeder(depPool).reduceIntervalBlock();
        uint power = blockNumber.sub(startBlock).div(reduceIntervalBlock);
        IBreeder.PoolInfo memory pool = IBreeder(depPool).poolInfo(pid);
        uint multiplier = blockNumber.sub(pool.lastRewardBlock);
        uint blockReward = IBreeder(depPool).getPiggyPerBlock(power);
        uint totalAllocPoint = IBreeder(depPool).totalAllocPoint();
        uint256 piggyReward = multiplier.mul(blockReward).mul(pool.allocPoint).div(totalAllocPoint);
        return piggyReward;
    }

    function ApyDEP(address market, bool borrow, bool supply) public view returns (uint256) {
        address token = ICErc20(market).underlying();
        uint speed = 0;
        DEPInfo[] memory infos = depInfos[market];
        uint decimals = ICErc20(token).decimals();
        if (supply) {
            for (uint i = 0; i < infos.length; i ++) {
                if (infos[i].marketAllocPoint == 0) {
                    continue;
                }
                speed = speed.add(getDEPPreBlock(infos[i].pid, block.number + 1).mul(infos[i].marketAllocPoint).div(infos[i].totalAllocPoint).mul(uint256(1e4).sub(infos[i].borrowRate)).div(1e4));
            }
            uint dived = ICErc20(market).totalSupply().mul(ICErc20(market).exchangeRateStored()).mul(getPrice(token, usdt));
            if (dived == 0) {
                return 0;
            }
            if (dived == 0) {
                return 0;
            }
            if (decimals != 18) {
                return speed.mul(getPrice(dep, usdt)).mul(10512000).mul(1e18).div(dived).div(10 ** (18 - decimals));
            } else {
                return speed.mul(getPrice(dep, usdt)).mul(10512000).mul(1e18).div(dived);
            }
        } else if (borrow) {
            for (uint i = 0; i < infos.length; i ++) {
                if (infos[i].marketAllocPoint == 0) {
                    continue;
                }
                speed = speed.add(getDEPPreBlock(infos[i].pid, block.number + 1).mul(infos[i].marketAllocPoint).div(infos[i].totalAllocPoint).mul(infos[i].borrowRate).div(1e4));
            }
            uint borrowIndex = ICErc20(market).borrowIndex();
            uint dived = 0;
            if (borrowIndex == 0) {
                dived = ICErc20(market).totalBorrows().mul(1e18).mul(getPrice(token, usdt));
            } else {
                dived = ICErc20(market).totalBorrows().mul(1e18).mul(getPrice(token, usdt)).div(ICErc20(market).borrowIndex());
            }
            if (dived == 0) {
                return 0;
            }
            if (decimals != 18) {
                return speed.mul(getPrice(dep, usdt)).mul(10512000).mul(1e18).div(dived).div(10 ** (18 - decimals));
            } else {
                return speed.mul(getPrice(dep, usdt)).mul(10512000).mul(1e18).div(dived);
            }
        } else {
            return 0;
        }
    }

    function Apy(address _market, address _token, bool borrow, bool supply) external view returns (uint256) {
        require(!supply || !borrow, "only supply or borrow can be true");
        if (_token == hpt) {
            return ApyHPT(_market, borrow, supply);
        } else if (_token == dep) {
            return ApyDEP(_market, borrow, supply);
        } else {
            return 0;
        }
    }

}
