//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./interfaces/IMailbox.sol";
import "./interfaces/IInterchainGasPaymaster.sol";

import "./libs/TypeCast.sol";

contract HlSuperCall {
    struct Call {
        uint16 chainId;
        address target;
        bytes callData;
        bytes[] subCalls;
        address HlSuperCall;
        uint fee;
    }

    IMailbox public immutable mailbox;
    IInterchainGasPaymaster public immutable interchainGasPaymaster;

    constructor(address _mailbox, address _interchainGasPaymaster) {
        mailbox = IMailbox(_mailbox);
        interchainGasPaymaster = IInterchainGasPaymaster(
            _interchainGasPaymaster
        );
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

            if (block.chainid == call.chainId) {
                (bool success, ) = call.target.call(call.callData);
                require(success, "HlSuperCall: call failed");
                _processCalls(call.subCalls);
            } else {
                send(call.chainId, call.HlSuperCall, encodedCalls[i], call.fee);
            }
        }
    }

    function send(
        uint32 _destinationChainId,
        address _targetAddress,
        bytes memory _body,
        uint _gasAmount
    ) private returns (bytes32) {
        bytes32 messageId = mailbox.dispatch(
            _destinationChainId,
            TypeCast.addressToBytes32(_targetAddress),
            _body
        );

        interchainGasPaymaster.payForGas{value: msg.value}(
            messageId,
            _destinationChainId,
            _gasAmount,
            msg.sender
        );
        return messageId;
    }

    event Received(uint32 origin, address sender, bytes body);

    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes memory _body
    ) external {
        address sender = TypeCast.bytes32ToAddress(_sender);
        emit Received(_origin, sender, _body);
        bytes[] memory encodedCalls = new bytes[](1);
        encodedCalls[0] = _body;
        _aggregate(encodedCalls);
    }

    function quoteGasPayment(
        uint32 _destinationDomain,
        uint256 _gasAmount
    ) external view returns (uint256) {
        return
            interchainGasPaymaster.quoteGasPayment(
                _destinationDomain,
                _gasAmount
            );
    }
}
