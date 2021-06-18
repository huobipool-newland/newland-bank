// SPDX-License-Identifier: MIT

pragma solidity ^0.6.2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import '@openzeppelin/contracts/access/Ownable.sol';
import "hardhat/console.sol";

contract ValueToken is ERC20, Ownable {
    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) public {
        if (decimals_ != 18) {
            _setupDecimals(decimals_);
        }
    }

    function mint (address to_, uint amount_) public onlyOwner {
        _mint(to_, amount_);
    }

    function burn (uint amount_) public onlyOwner {
        uint balance = balanceOf(address(this));
        if (balance < amount_) {
            amount_ = balance;
        }
        _burn(address(this), amount_);
    }
}
