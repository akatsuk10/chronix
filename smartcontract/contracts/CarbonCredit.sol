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

    mapping(address => uint256) public balanceOf;
    address[] public holders;
    mapping(address => bool) public isHolder;

    AggregatorV3Interface public immutable avaxUsdFeed;
    AggregatorV3Interface public immutable emchFeed;

    event Minted(address indexed user, uint256 amount, uint256 usdValue, uint256 emchRate);
    event OwnershipTransferred(address indexed newOwner);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyBettingContract() {
        require(msg.sender == bettingContract, "Not BettingContract");
        _;
    }

    constructor() {
        avaxUsdFeed = AggregatorV3Interface(0x5498BB86BC934c8D34FDA08E81D444153d0D06aD);     // AVAX/USD
        emchFeed = AggregatorV3Interface(0x0d2807dc7FA52d3B38be564B64a2b37753C49AdD);        // EmCH feed
        owner = msg.sender;
    }

    function setBettingContract(address _bettingContract) external onlyOwner {
        require(_bettingContract != address(0), "Invalid address");
        bettingContract = _bettingContract;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
        emit OwnershipTransferred(newOwner);
    }

    function getAvaxUsd() public view returns (uint256) {
        (, int256 price, , , ) = avaxUsdFeed.latestRoundData();
        require(price > 0, "Invalid AVAX/USD price");
        return uint256(price); // 8 decimals
    }

    function getEmchRate() public view returns (uint256) {
        (, int256 value, , , ) = emchFeed.latestRoundData();
        require(value > 0, "Invalid EmCH rate");
        return uint256(value * 1e10); // Convert 8 → 18 decimals
    }

    function convertAndMint(address user) external payable onlyBettingContract {
        require(msg.value > 0, "No AVAX sent");

        uint256 avaxUsd = getAvaxUsd();
        uint256 emchRate = getEmchRate();

        uint256 usdValue = (msg.value * avaxUsd) / 1e8;
        uint256 gbcAmount = (usdValue * emchRate) / 1e18;

        balanceOf[user] += gbcAmount;
        totalSupply += gbcAmount;

        if (!isHolder[user]) {
            holders.push(user);
            isHolder[user] = true;
        }

        emit Minted(user, gbcAmount, usdValue, emchRate);
    }

    function previewMintAmount(uint256 avaxAmountInWei) external view returns (uint256) {
        uint256 avaxUsd = getAvaxUsd();
        uint256 emchRate = getEmchRate();
        uint256 usdValue = (avaxAmountInWei * avaxUsd) / 1e8;
        return (usdValue * emchRate) / 1e18;
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount <= address(this).balance, "Insufficient balance");
        to.transfer(amount);
        emit Withdrawn(to, amount);
    }

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
