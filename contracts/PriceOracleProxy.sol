// SPDX-License-Identifier: MIT

pragma solidity ^0.5.16;

import "./CErc20.sol";
import "./CToken.sol";
import "./PriceOracle.sol";
import "./ErrorReporter.sol";
import "./Unitroller.sol";

contract PriceOracleProxy is UnitrollerAdminStorage, TokenErrorReporter {
    /// @notice Indicator that this is a PriceOracleProxy contract (for inspection)
    bool public constant isPriceOracleProxy = true;

    /// @notice The v1 price oracle, which will continue to serve prices for v1 assets
    PriceOracle public underlying;
    mapping(address => uint256) public fixPrices;

    constructor() public {
        admin = msg.sender;
    }

    function _setFixPrice(address token, uint256 price) external {
        require(msg.sender == admin, "only admin can set");
        fixPrices[token] = price;
    }

    function _delFixPrice(address token) external {
        require(msg.sender == admin, "only admin can set");
        fixPrices[token] = 0;
    }

    /**
     * @notice Get the underlying price of a listed cToken asset
     * @param cToken The cToken to get the underlying price of
     * @return The underlying asset price mantissa (scaled by 1e18)
     */
    function getUnderlyingPrice(CToken cToken) public view returns (uint) {
        uint value = underlying.getUnderlyingPrice(cToken);
        if (value == 0) {
            value = fixPrices[CErc20(address(cToken)).underlying()];
        }
        return value;
    }

    event MarketListed(address cToken);
    /**
     * @notice set the underlying priceOracle address
     * @param newUnderlying_ new PriceOracle
     */
    function _setUnderlying(PriceOracle newUnderlying_) public returns (uint) {
        require(msg.sender == admin, "only admin can set");
        require(newUnderlying_.isPriceOracle(), "NOT_PRICE_ORACLE");
        underlying = newUnderlying_;
        return uint(Error.NO_ERROR);
    }

    function _become(Unitroller unitroller) public {
        require(msg.sender == unitroller.admin(), "only unitroller admin can change brains");
        require(unitroller._acceptImplementation() == 0, "change not authorized");
    }
}
