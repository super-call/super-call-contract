// // SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AxlSuperCall} from "../AxlSuperCall.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OwnedAxlSuperCall is AxlSuperCall, Ownable {

    bool public isInitialized;
    mapping(string => string) public trustedRemoteLookup;

    modifier onlyTrustedRemote(
        string memory sourceChain_,
        string memory sourceAddress_
    ) {
        require(
            keccak256(bytes(trustedRemoteLookup[sourceChain_])) ==
                keccak256(bytes(sourceAddress_)),
            "OwnedAxlSuperCall: caller is not trusted remote"
        );
        _;
    }

    constructor(
        address gateway_,
        address gasReceiver_,
        string memory chain_
    ) AxlSuperCall(gateway_, gasReceiver_, chain_) {}

    function init(address _owner, string memory _sourceChain, string memory _sourceAddress) external {
        require(!isInitialized, "OwnedAxlSuperCall: already initialized");
        _transferOwnership(_owner);
        _setTrustedRemote(_sourceChain, _sourceAddress);
        isInitialized = true;
    }

    // Public functions
    function aggregate(
        bytes[] memory encodedCalls
    ) external payable override onlyOwner {
        _processCallsWithGasService(encodedCalls);
    }

    function setTrustedRemote(
        string memory sourceChain_,
        string memory sourceAddress_
    ) external onlyOwner {
        _setTrustedRemote(sourceChain_, sourceAddress_);
    }

    function setTrustedRemotes(
        string[] memory sourceChains_,
        string[] memory sourceAddresses_
    ) external onlyOwner {
        _setTrustedRemotes(sourceChains_, sourceAddresses_);
    }

    // Internal functions
    function _execute(
        string calldata sourceChain_,
        string calldata sourceAddress_,
        bytes calldata payload_
    ) internal override onlyTrustedRemote(sourceChain_, sourceAddress_) {
        bytes[] memory encodedCalls = new bytes[](1);
        encodedCalls[0] = payload_;

        _aggregate(encodedCalls);
    }

    function _setTrustedRemote(
        string memory sourceChain_,
        string memory sourceAddress_
    ) internal {
        trustedRemoteLookup[sourceChain_] = sourceAddress_;
    }

    function _setTrustedRemotes(
        string[] memory sourceChains_,
        string[] memory sourceAddresses_
    ) internal {
        require(
            sourceChains_.length == sourceAddresses_.length,
            "OwnedAxlSuperCall: sourceChains and sourceAddresses length mismatch"
        );
        for (uint256 i = 0; i < sourceChains_.length; i++) {
            _setTrustedRemote(sourceChains_[i], sourceAddresses_[i]);
        }
    }
}
