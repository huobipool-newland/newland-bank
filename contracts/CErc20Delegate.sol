// SPDX-License-Identifier: MIT

pragma solidity ^0.5.16;

import "./CErc20.sol";

/**
 * @title Compound's CErc20Delegate Contract
 * @notice CTokens which wrap an EIP-20 underlying and are delegated to
 * @author Compound
 */
contract CErc20Delegate is CErc20, CDelegateInterface, AccrueInterestInterface {
    /**
     * @notice Construct an empty delegate
     */
    constructor() public {}

    /**
     * @notice Called by the delegator on a delegate to initialize it for duty
     * @param data The encoded bytes data for any initialization
     */
    function _becomeImplementation(bytes memory data) public {
        // Shh -- currently unused
        data;

        // Shh -- we don't ever want this hook to be marked pure
        if (false) {
            implementation = address(0);
        }

        require(msg.sender == admin, "only the admin may call _becomeImplementation");
    }

    /**
     * @notice Called by the delegator on a delegate to forfeit its responsibility
     */
    function _resignImplementation() public {
        // Shh -- we don't ever want this hook to be marked pure
        if (false) {
            implementation = address(0);
        }

        require(msg.sender == admin, "only the admin may call _resignImplementation");
    }

    function _addAccrueInterestNotifier(address _notifier, bytes calldata _data, bool _required) external {
        require(msg.sender == admin, "only the admin can do this");
        AccrueInterestNotifier memory notifier;
        notifier.notifier = _notifier;
        notifier.data = _data;
        notifier.required = _required;
        notifiers.push(notifier);
    }

    function _delAccreuInterestNotifier(uint256 id) external {
        require(msg.sender == admin, "only the admin can do this");
        AccrueInterestNotifier[] memory _notifiers = notifiers;
        require(id < _notifiers.length, "illegal id");
        if (id < notifiers.length - 1) {
            AccrueInterestNotifier storage storageNotifier = notifiers[id];
            storageNotifier.notifier = _notifiers[_notifiers.length - 1].notifier;
            storageNotifier.data = _notifiers[_notifiers.length - 1].data;
            storageNotifier.required = _notifiers[_notifiers.length - 1].required;
        }
        notifiers.pop();
    }

    function accrueInterestNotify() internal {
        AccrueInterestNotifier[] memory _notifiers = notifiers;
        //console.log("accrueInterestNotify: ", underlying, _notifiers.length);
        for (uint i = 0; i < _notifiers.length; i ++) {
            (bool success, ) = _notifiers[i].notifier.call(_notifiers[i].data); 
            if (_notifiers[i].required) {
                require(success, "accrueInterestNotify failed");
            }
        }
    }
}
