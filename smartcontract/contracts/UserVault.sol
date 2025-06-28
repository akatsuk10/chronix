// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Vault {
    address public owner;
    address public bettingContract;

    mapping(address => mapping(address => uint256)) public tokenBalances; // token => user => amount
    mapping(address => uint256) public avaxBalances;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyBettingContract() {
        require(msg.sender == bettingContract, "Only betting contract can call");
        _;
    }

    // Events
    event DepositAVAX(address indexed user, uint256 amount);
    event WithdrawAVAX(address indexed user, uint256 amount);
    event DepositToken(address indexed user, address indexed token, uint256 amount);
    event WithdrawToken(address indexed user, address indexed token, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    // --- Config ---

    function setBettingContract(address _betting) external onlyOwner {
        bettingContract = _betting;
    }

    // --- Deposit Functions ---

    function depositAVAX() external payable {
        require(msg.value > 0, "No AVAX sent");
        avaxBalances[msg.sender] += msg.value;
        emit DepositAVAX(msg.sender, msg.value);
    }

    function depositToken(address token, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(
            IERC20(token).transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );
        tokenBalances[token][msg.sender] += amount;
        emit DepositToken(msg.sender, token, amount);
    }

    // --- Withdraw Functions ---

    function withdrawAVAX(uint256 amount) external {
        require(avaxBalances[msg.sender] >= amount, "Insufficient AVAX balance");
        avaxBalances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit WithdrawAVAX(msg.sender, amount);
    }

    function withdrawToken(address token, uint256 amount) external {
        require(tokenBalances[token][msg.sender] >= amount, "Insufficient token balance");
        tokenBalances[token][msg.sender] -= amount;
        require(IERC20(token).transfer(msg.sender, amount), "Token transfer failed");
        emit WithdrawToken(msg.sender, token, amount);
    }

    // --- Called by BTCBetting to Deduct Bet ---

    function deductForBet(address user, uint256 amount) external onlyBettingContract {
        require(avaxBalances[user] >= amount, "Insufficient Vault balance");
        avaxBalances[user] -= amount;
        // funds stay in Vault, BTCBetting updates poolBalance on its side
    }

    // --- View Functions ---

    function getTokenBalance(address token, address user) external view returns (uint256) {
        return tokenBalances[token][user];
    }

    function getAVAXBalance(address user) external view returns (uint256) {
        return avaxBalances[user];
    }

    // --- Fallback for direct AVAX transfers ---

    receive() external payable {
        avaxBalances[msg.sender] += msg.value;
        emit DepositAVAX(msg.sender, msg.value);
    }
}
