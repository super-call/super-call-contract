// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract LendingContract {
    function deposit(address token, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        IERC20 tokenContract = IERC20(token);
        require(
            tokenContract.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );
    }

    function withdraw(address token) external {
        IERC20 tokenContract = IERC20(token);
        uint256 contractBalance = tokenContract.balanceOf(address(this));
        require(contractBalance > 0, "No balance to withdraw");
        require(
            tokenContract.transfer(msg.sender, contractBalance),
            "Token transfer failed"
        );
    }

    function getContractBalance(address token) external view returns (uint256) {
        IERC20 tokenContract = IERC20(token);
        return tokenContract.balanceOf(address(this));
    }
}
