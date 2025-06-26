// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract CarbonCredit {
    string public name = "GreenBetCarbon";
    string public symbol = "GBC";
    uint8 public decimals = 18;

    address public bettingContract;
    address public owner;
    uint256 public totalSupply;

    AggregatorV3Interface public immutable avaxUsdFeed;
    AggregatorV3Interface public immutable emchFeed;
    bool public immutable useMockEmchRate;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public isHolder;
    address[] public holders;

    // --- Events ---
    event Minted(address indexed user, uint256 amount, uint256 usdValue, uint256 emchRate);
    event Burned(address indexed user, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed newOwner);
    event Withdrawn(address indexed to, uint256 amount);
    event UsingFallbackEmchRate(uint256 fallbackRate);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyBettingContract() {
        require(msg.sender == bettingContract, "Not BettingContract");
        _;
    }

    // --- Constructor ---
    constructor(address _avaxUsdFeed, address _emchFeed, bool _useMockEmchRate) {
        require(_avaxUsdFeed != address(0), "Invalid AVAX feed");
        require(_emchFeed != address(0), "Invalid EmCH feed");
        avaxUsdFeed = AggregatorV3Interface(_avaxUsdFeed);
        emchFeed = AggregatorV3Interface(_emchFeed);
        useMockEmchRate = _useMockEmchRate;
        owner = msg.sender;
    }

    // --- Admin ---
    function setBettingContract(address _bettingContract) external onlyOwner {
        require(_bettingContract != address(0), "Invalid address");
        bettingContract = _bettingContract;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
        emit OwnershipTransferred(newOwner);
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount <= address(this).balance, "Insufficient balance");
        to.transfer(amount);
        emit Withdrawn(to, amount);
    }

    // --- Chainlink Feed Logic ---
    function getAvaxUsd() public view returns (uint256) {
        (, int256 answer, , , ) = avaxUsdFeed.latestRoundData();
        require(answer > 0, "Invalid AVAX/USD price");
        return uint256(answer); // 8 decimals
    }

    function getEmchRate() public view returns (uint256) {
        if (useMockEmchRate) {
            return 40 * 1e18; // fixed $40
        }

        try emchFeed.latestRoundData() returns (
            uint80,
            int256 value,
            uint256,
            uint256,
            uint80
        ) {
            if (value > 0) {
                return uint256(value * 1e10); // adjust to 18 decimals
            }
        } catch {
            revert("EMCH feed failed");
        }

        revert("Invalid EMCH rate");
    }

    // --- Minting ---
    function convertAndMint(address user) external payable onlyBettingContract {
        require(msg.value > 0, "No AVAX sent");

        uint256 avaxUsd = getAvaxUsd(); // 8 decimals
        uint256 emchRate = getEmchRate(); // 18 decimals

        uint256 usdValue = (msg.value * avaxUsd) / 1e8;
        uint256 gbcAmount = (usdValue * emchRate) / 1e18;

        balanceOf[user] += gbcAmount;
        totalSupply += gbcAmount;

        if (!isHolder[user]) {
            holders.push(user);
            isHolder[user] = true;
        }

        emit Minted(user, gbcAmount, usdValue, emchRate);
        emit Transfer(address(0), user, gbcAmount);
    }

    function previewMintAmount(uint256 avaxAmountInWei) external view returns (uint256) {
        uint256 avaxUsd = getAvaxUsd();
        uint256 emchRate = getEmchRate();
        uint256 usdValue = (avaxAmountInWei * avaxUsd) / 1e8;
        return (usdValue * emchRate) / 1e18;
    }

    function testMint(address to, uint256 gbcAmount) external {
        require(to != address(0), "Invalid address");
        require(gbcAmount > 0, "Amount must be greater than zero");

        uint256 emchRate = getEmchRate();
        uint256 usdValue = (gbcAmount * 1e18) / emchRate;

        balanceOf[to] += gbcAmount;
        totalSupply += gbcAmount;

        if (!isHolder[to]) {
            holders.push(to);
            isHolder[to] = true;
        }

        emit Minted(to, gbcAmount, usdValue, emchRate);
        emit Transfer(address(0), to, gbcAmount);
    }

    // --- ERC20-like Functions ---
    function burn(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Burned(msg.sender, amount);
        emit Transfer(msg.sender, address(0), amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "Not approved");
        allowance[from][msg.sender] -= amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(to != address(0), "Invalid to address");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        if (!isHolder[to]) {
            holders.push(to);
            isHolder[to] = true;
        }

        emit Transfer(from, to, amount);
    }

    // --- View Functions ---
    function getUserHolding(address user) external view returns (uint256) {
        return balanceOf[user];
    }

    function getLeaderboard() external view returns (address[] memory, uint256[] memory) {
        uint256 len = holders.length;
        address[] memory addresses = new address[](len);
        uint256[] memory balances = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            addresses[i] = holders[i];
            balances[i] = balanceOf[holders[i]];
        }

        return (addresses, balances);
    }

    receive() external payable {}
}
