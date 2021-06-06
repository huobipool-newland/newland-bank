// SPDX-License-Identifier: MIT

pragma solidity ^0.6.2;

interface IComptroller {

    function claim(address holder) external;

    function claimComp(address holder) external;

    function claimAll(address holder) external;

    function getAssetsIn(address account) external view returns (address[] memory);

    function getClaimInfoKeysLength() external view returns (uint256);

    function claimInfoKeys(uint256 _id) external view returns (address); 

    function marketInClaimInfo(address market, uint256 claimInfoIndex) external view returns (bool);

    function marketClaimInfo(address market, uint256 claimInfoIndex) external view returns (
        address token_, 
        address pool_,
        uint256 totalAllocPoint_, 
        uint256 marketAllocPoint_, 
        uint256 borrowRate_, 
        uint224 borrowIndex_, 
        uint32 borrowBlock_, 
        uint224 supplyIndex_, 
        uint32 supplyBlock_
    );

    function enterMarkets(address[] calldata cTokens) external returns (uint[] memory);

    function checkMembership(address account, address cToken) external view returns (bool);
    
    function getCompAddress() external pure returns (address);

    function userMarketClaimInfo(address user, address market, uint256 claimInfoIndex) external view returns (
        uint256 supplierIndex_,
        uint256 borrowerIndex_
    );

    function compBorrowState(address _market) external view returns (uint224, uint32);

    function compSupplyState(address _market) external view returns (uint224, uint32);
    
    function compSpeeds(address _market) external view returns (uint256);

    function compBorrowerIndex(address _market, address _holder) external view returns (uint256);

    function compSupplierIndex(address _market, address _holder) external view returns (uint256);

    function compAccrued(address _holder) external view returns (uint256);

    function claimBorrowIndex(address key, address market) external view returns (uint224);

    function claimSupplyIndex(address key, address market) external view returns (uint224);

    function claimBorrowerIndex(address key, address market, address user) external view returns (uint256);

    function claimSupplierIndex(address key, address market, address user) external view returns (uint256);

    function claimAccrued(address token, address key) external view returns (uint256);

    function marketClaimAccrued(address token, address market, address key) external view returns (uint256);
}
