pragma solidity ^0.5.16;

import "./PriceOracle.sol";
import "./CErc20.sol";

contract SimplePriceOracle is PriceOracle {
    mapping(address => uint) prices;
    event PricePosted(address asset, uint previousPriceMantissa, uint requestedPriceMantissa, uint newPriceMantissa);

    address public admin;

    function _setAdmin(address newAdmin) public {
        require(msg.sender == admin, "NOT_ADMIN");
        admin = newAdmin;
    }

    constructor(address admin_) public {
        admin = admin_;
    }

    function getUnderlyingPrice(CToken cToken) public view returns (uint) {
        if (compareStrings(cToken.symbol(), "cWUSDT")) {
            return 1e18;
        } else {
            return prices[address(CErc20(address(cToken)).underlying())];
        }
    }

    function setUnderlyingPrice(CToken cToken, uint underlyingPriceMantissa) public {
        require(msg.sender == admin, "NOT_ADMIN");
        address asset = address(CErc20(address(cToken)).underlying());
        emit PricePosted(asset, prices[asset], underlyingPriceMantissa, underlyingPriceMantissa);
        prices[asset] = underlyingPriceMantissa;
    }

    function setDirectPrice(address asset, uint price) public {
        require(msg.sender == admin, "NOT_ADMIN");
        emit PricePosted(asset, prices[asset], price, price);
        prices[asset] = price;
    }

    function setBulkDirectPrice(address[] memory assets, uint[] memory setPrices) public {
        require (assets.length == setPrices.length, "illegal request");
        for (uint i = 0; i < setPrices.length; i ++) {
            setDirectPrice(assets[i], setPrices[i]);
        }
    }

    // v1 price oracle interface for use as backing of proxy
    function assetPrices(address asset) external view returns (uint) {
        return prices[asset];
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }
}
