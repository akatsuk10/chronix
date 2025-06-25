// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

interface ILottery {
    function enterLottery(address user) external payable;
}

interface ICarbonCredit {
    function convertAndMint(address user) external payable;
}

contract VaultBetting is AutomationCompatibleInterface {
    AggregatorV3Interface public immutable btcPriceFeed;

    address public owner;
    address public lotteryContract;
    address public carbonCreditContract;

    uint256 public poolBalance;

    struct Bet {
        uint256 amount;
        uint256 startTime;
        int256 startPrice;
        uint8 position; // 0 = long, 1 = short
        bool settled;
    }

    mapping(address => Bet) public bets;
    address[] public activeBettors;
    mapping(address => uint256) public avaxVaultBalances;

    // Events
    event AVAXDeposited(address indexed user, uint256 amount);
    event AVAXWithdrawn(address indexed user, uint256 amount);
    event BetPlaced(address indexed user, uint8 position, uint256 amount, int256 startPrice);
    event BetSettled(address indexed user, bool won, uint256 payout, string result, int256 startPrice, int256 endPrice);
    event PoolFunded(address indexed funder, uint256 amount);
    event PoolWithdrawn(address indexed admin, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _btcPriceFeed) {
        btcPriceFeed = AggregatorV3Interface(_btcPriceFeed);
        owner = msg.sender;
    }

    // --- Admin Setup ---

    function setLotteryContract(address _lottery) external onlyOwner {
        require(_lottery != address(0), "Invalid lottery address");
        lotteryContract = _lottery;
    }

    function setCarbonContract(address _carbon) external onlyOwner {
        require(_carbon != address(0), "Invalid carbon contract");
        carbonCreditContract = _carbon;
    }

    // --- Vault Functions ---

    function depositAVAX() external payable {
        require(msg.value > 0, "Zero AVAX");
        avaxVaultBalances[msg.sender] += msg.value;
        emit AVAXDeposited(msg.sender, msg.value);
    }

    function withdrawAVAX(uint256 amount) external {
        require(avaxVaultBalances[msg.sender] >= amount, "Insufficient vault balance");
        avaxVaultBalances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit AVAXWithdrawn(msg.sender, amount);
    }

    function getVaultBalance(address user) external view returns (uint256) {
        return avaxVaultBalances[user];
    }

    // --- Betting Functions ---

    function placeBet(uint8 position, uint256 amount) external {
        require(position == 0 || position == 1, "Invalid position");
        require(amount > 0, "Zero amount");
        require(avaxVaultBalances[msg.sender] >= amount, "Vault: insufficient balance");
        require(bets[msg.sender].amount == 0 || bets[msg.sender].settled, "Active bet exists");

        (, int256 startPrice, , , ) = btcPriceFeed.latestRoundData();

        avaxVaultBalances[msg.sender] -= amount;
        poolBalance += amount;

        bets[msg.sender] = Bet({
            amount: amount,
            startTime: block.timestamp,
            startPrice: startPrice,
            position: position,
            settled: false
        });

        activeBettors.push(msg.sender);
        emit BetPlaced(msg.sender, position, amount, startPrice);
    }

    function betEnd(address user) public {
        Bet storage bet = bets[user];
        require(!bet.settled, "Already settled");
        require(block.timestamp >= bet.startTime + 299, "Too early");

        (, int256 endPrice, , , ) = btcPriceFeed.latestRoundData();

        bool won = (bet.position == 0 && endPrice > bet.startPrice) ||
                   (bet.position == 1 && endPrice < bet.startPrice);
        bool draw = (endPrice == bet.startPrice);

        uint256 payout = won ? bet.amount * 2 : (draw ? bet.amount : 0);
        bet.settled = true;

        if (payout > 0) {
            uint256 lotteryAmount = (bet.amount * 5) / 100;
            uint256 carbonAmount = (bet.amount * 2) / 100;
            uint256 finalPayout = payout - lotteryAmount - carbonAmount;

            require(poolBalance >= payout, "Insufficient pool");

            poolBalance -= payout;

            if (lotteryContract != address(0)) {
                ILottery(lotteryContract).enterLottery{value: lotteryAmount}(user);
            }

            if (carbonCreditContract != address(0)) {
                ICarbonCredit(carbonCreditContract).convertAndMint{value: carbonAmount}(user);
            }

            (bool success, ) = payable(user).call{value: finalPayout}("");
            require(success, "Transfer failed");
        }

        emit BetSettled(user, won, payout, won ? "Won" : (draw ? "Draw" : "Lost"), bet.startPrice, endPrice);
    }

    // --- Chainlink Automation ---

    function checkUpkeep(bytes calldata) external view override returns (bool, bytes memory) {
        for (uint256 i = 0; i < activeBettors.length; i++) {
            address user = activeBettors[i];
            Bet storage bet = bets[user];
            if (!bet.settled && block.timestamp >= bet.startTime + 299) {
                return (true, abi.encode(user, i));
            }
        }
        return (false, "");
    }

    function performUpkeep(bytes calldata performData) external override {
        (address user, uint256 index) = abi.decode(performData, (address, uint256));
        betEnd(user);
        removeBettor(index);
    }

    function removeBettor(uint256 index) internal {
        if (index >= activeBettors.length) return;
        activeBettors[index] = activeBettors[activeBettors.length - 1];
        activeBettors.pop();
    }

    // --- Pool Management ---

    function fundPool() external payable {
        require(msg.value > 0, "No ETH sent");
        poolBalance += msg.value;
        emit PoolFunded(msg.sender, msg.value);
    }

    function withdrawPool(uint256 amount) external onlyOwner {
        require(amount <= poolBalance, "Exceeds pool balance");
        poolBalance -= amount;
        payable(owner).transfer(amount);
        emit PoolWithdrawn(msg.sender, amount);
    }

    receive() external payable {
        poolBalance += msg.value;
        emit PoolFunded(msg.sender, msg.value);
    }

    // --- View ---

    function getActiveBettors() external view returns (address[] memory) {
        return activeBettors;
    }

    function getBet(address user) external view returns (Bet memory) {
        return bets[user];
    }

    function getCurrentBTCPrice() external view returns (int256) {
        (, int256 price, , , ) = btcPriceFeed.latestRoundData();
        return price;
    }
}
