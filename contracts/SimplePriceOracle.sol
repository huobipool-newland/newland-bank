pragma solidity ^0.5.16;

import "./PriceOracle.sol";
import "./CErc20.sol";

contract SimplePriceOracle is PriceOracle {
    mapping(address => uint) prices1;
    mapping(address => uint) prices2;
    mapping(address => uint) prices3;
    event PricePosted(uint index, address asset, uint previousPriceMantissa, uint requestedPriceMantissa, uint newPriceMantissa);

    address public admin;

    function _setAdmin(address newAdmin) public {
        require(msg.sender == admin, "NOT_ADMIN");
        admin = newAdmin;
    }

    constructor(address admin_) public {
        admin = admin_;
    }

    function getUnderlyingPrice(CToken cToken) public view returns (uint) {
        if (compareStrings(cToken.symbol(), "cUSDT")) {
            return 1e18;
        } else {
            uint totalPrice = 0;
            uint totalNum = 0;
            if (prices1[address(CErc20(address(cToken)).underlying())] != 0) {
                totalPrice += prices1[address(CErc20(address(cToken)).underlying())];
                totalNum += 1;
            } else if (prices2[address(CErc20(address(cToken)).underlying())] != 0) {
                totalPrice += prices2[address(CErc20(address(cToken)).underlying())];
                totalNum += 1;
            } else if (prices3[address(CErc20(address(cToken)).underlying())] != 0) {
                totalPrice += prices3[address(CErc20(address(cToken)).underlying())];
                totalNum += 1;
            }
            if (totalNum == 0) {
                return 0;
            } else {
                uint price = totalPrice / totalNum;
                uint price1 = prices1[address(CErc20(address(cToken)).underlying())];
                uint price2 = prices2[address(CErc20(address(cToken)).underlying())];
                uint price3 = prices3[address(CErc20(address(cToken)).underlying())];
                if (price1 < price) {
                    return price2 < price3 ? price2 : price3;
                }
                else if (price2 < price) {
                    return price1 < price3 ? price1 : price3;
                }
                else if (price3 < price) {
                    return price1 < price2 ? price1 : price2;
                } else { //价格一样
                    return price1;
                }
            }
        }
    }

    function setDirectPrice(uint index, address asset, uint price) public {
        require(msg.sender == admin, "NOT_ADMIN");
        if (index == 1) {
            emit PricePosted(index, asset, prices1[asset], price, price);
            prices1[asset] = price;
        } else if (index == 2) {
            emit PricePosted(index, asset, prices2[asset], price, price);
            prices2[asset] = price;
        } else if (index == 3) {
            emit PricePosted(index, asset, prices3[asset], price, price);
            prices3[asset] = price;
        }
    }

    function setBulkDirectPrice(uint index, address[] memory assets, uint[] memory setPrices) public {
        require (assets.length == setPrices.length, "illegal request");
        for (uint i = 0; i < setPrices.length; i ++) {
            setDirectPrice(index, assets[i], setPrices[i]);
        }
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }
}
