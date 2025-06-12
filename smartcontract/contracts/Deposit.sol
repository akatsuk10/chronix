// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(
        address from,
        address to,
        uint amount
    ) external returns (bool);
    function transfer(address to, uint amount) external returns (bool);
    function balanceOf(address account) external view returns (uint);
}

contract Vault {
    address public owner;

    // Mapping: token address => user address => balance
    mapping(address => mapping(address => uint256)) public tokenBalances;

    // For native AVAX
    mapping(address => uint256) public avaxBalances;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // --- Deposit Functions ---

    // Deposit AVAX
    function depositAVAX() external payable {
        require(msg.value > 0, "No AVAX sent");
        avaxBalances[msg.sender] += msg.value;
    }

    // Deposit USDC/USDT or any ERC20 token
    function depositToken(address token, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(
            IERC20(token).transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        tokenBalances[token][msg.sender] += amount;
    }

    // --- Withdraw Functions ---

    function withdrawAVAX(uint256 amount) external {
        require(avaxBalances[msg.sender] >= amount, "Insufficient AVAX");
        avaxBalances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    function withdrawToken(address token, uint256 amount) external {
        require(
            tokenBalances[token][msg.sender] >= amount,
            "Insufficient balance"
        );
        tokenBalances[token][msg.sender] -= amount;
        require(IERC20(token).transfer(msg.sender, amount), "Transfer failed");
    }

    // --- View Functions ---

    function getTokenBalance(
        address token,
        address user
    ) external view returns (uint256) {
        return tokenBalances[token][user];
    }

    function getAVAXBalance(address user) external view returns (uint256) {
        return avaxBalances[user];
    }

    // Emergency withdraw by owner
    function emergencyWithdrawToken(
        address token,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }

    function emergencyWithdrawAVAX(uint256 amount) external onlyOwner {
        payable(owner).transfer(amount);
    }

    // Fallback to accept plain AVAX
    receive() external payable {
        avaxBalances[msg.sender] += msg.value;
    }
}
