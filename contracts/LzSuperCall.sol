// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "./lzApp/NonblockingLzApp.sol";

contract LzSuperCall is NonblockingLzApp {

    uint16 public lzChainId;

    struct Call {
        uint16 chainId;
        address target;
        bytes callData;
        bytes[] subCalls;
        address lzSuperCall;
        uint fee;
    }

    constructor(address _lzEndpoint, uint16 _lzChainId, address _owner) NonblockingLzApp(_lzEndpoint) {
        lzChainId = _lzChainId;
        transferOwnership(_owner);
    }

    function aggregate(bytes[] memory encodedCalls) external payable {
        _processCalls(encodedCalls);
    }

    function _aggregate(bytes[] memory encodedCalls) internal {
        _processCalls(encodedCalls);
    }

    function _processCalls(bytes[] memory encodedCalls) private {
        uint256 length = encodedCalls.length;

        for (uint256 i = 0; i < length; i++) {
            Call memory call = abi.decode(encodedCalls[i], (Call));

            if (lzChainId == call.chainId) {
                (bool success, ) = call.target.call(call.callData);
                require(success, 'LzSuperCall: call failed');
                _processCalls(call.subCalls);
            } else {
                _lzSend(call.chainId, encodedCalls[i], payable(msg.sender), address(0x0), bytes(""), msg.value);
            }
        }
    }

    function _nonblockingLzReceive(uint16 _srcChainId, bytes memory _srcAddress, uint64 _nonce, bytes memory _payload) internal override {
        bytes[] memory encodedCalls = new bytes[](1);
        encodedCalls[0] = _payload;

        _aggregate(encodedCalls);
    }

    // Helper functions
    function estimateFee(uint16 _dstChainId, bool _useZro, bytes[] calldata _payloads, bytes calldata _adapterParams) public view returns (uint nativeFee, uint zroFee) {
        for (uint i = 0; i < _payloads.length; i++) {
            (uint native, uint zro) = lzEndpoint.estimateFees(_dstChainId, address(this), _payloads[i], _useZro, _adapterParams);
            nativeFee += native;
            zroFee += zro;
        }
    }

}