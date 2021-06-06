// SPDX-License-Identifier: MIT

pragma solidity ^0.6.2;

interface ICErc20 {

    function mint(uint mintAmount) external returns (uint);
    
    function redeem(uint redeemTokens) external returns (uint);

    function redeemUnderlying(uint redeemAmount) external returns (uint);

    function borrow(uint borrowAmount) external returns (uint);

    function repayBorrow(uint repayAmount) external returns (uint);

    function borrowIndex() external view returns (uint256);

    function totalBorrows() external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function borrowBalanceStored(address holder) external view returns (uint256);

    function balanceOf(address holder) external view returns (uint256);

    function underlying() external view returns (address);

    function exchangeRateStored() external view returns (uint);

    function decimals() external view returns (uint8);
}
