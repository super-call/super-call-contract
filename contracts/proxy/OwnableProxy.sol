// // SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Proxy.sol";

contract OwnedProxy is Proxy, Ownable {

    address private _impl;

    constructor(address implementation_, address owner_) {
        _impl = implementation_;

        transferOwnership(owner_);
    }

    function _implementation() internal view override returns (address) {
        return _impl;
    }

    fallback() external payable onlyOwner override {
        _fallback();
    }

}
