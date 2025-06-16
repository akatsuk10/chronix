// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

contract BTCBetting is KeeperCompatibleInterface {
    AggregatorV3Interface public immutable btcPriceFeed;

    address public owner;
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

    event BetPlaced(address indexed user, uint8 position, uint256 amount, int256 startPrice);
    event BetSettled(address indexed user, bool won, uint256 payout, string result, int256 startPrice, int256 endPrice);
    event PoolFunded(address indexed funder, uint256 amount);
    event PoolWithdrawn(address indexed admin, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _priceFeed) {
        btcPriceFeed = AggregatorV3Interface(_priceFeed);
        owner = msg.sender;
    }

    // ========== New Function for Vault Integration ==========
    function placeBetFor(address user, uint8 _position) public payable {
        require(_position == 0 || _position == 1, "Invalid position");
        require(msg.value > 0, "Bet must be positive");
        require(bets[user].amount == 0 || bets[user].settled, "Existing active bet");

        (, int256 startPrice,,,) = btcPriceFeed.latestRoundData();

        poolBalance += msg.value;

        bets[user] = Bet({
            amount: msg.value,
            startTime: block.timestamp,
            startPrice: startPrice,
            position: _position,
            settled: false
        });

        activeBettors.push(user);

        emit BetPlaced(user, _position, msg.value, startPrice);
    }

    // ========== Existing Direct User Bet ==========
    function placeBet(uint8 _position) external payable {
        placeBetFor(msg.sender, _position);
    }

    function betEnd(address user) public {
        Bet storage bet = bets[user];
        require(!bet.settled, "Already settled");
        require(block.timestamp >= bet.startTime + 299, "Too early to settle");

        (, int256 endPrice,,,) = btcPriceFeed.latestRoundData();

        bool won = (bet.position == 0 && endPrice > bet.startPrice) || (bet.position == 1 && endPrice < bet.startPrice);
        bool draw = (endPrice == bet.startPrice);

        uint256 payout = won ? bet.amount * 2 : (draw ? bet.amount : 0);

        bet.settled = true;

        if (payout > 0) {
            require(poolBalance >= payout, "Insufficient pool balance");
            poolBalance -= payout;
            (bool success, ) = payable(user).call{value: payout}("");
            require(success, "ETH Transfer failed");
        }

        emit BetSettled(user, won, payout, won ? "Won" : (draw ? "Draw" : "Lost"), bet.startPrice, endPrice);
    }

    // ========== CHAINLINK AUTOMATION ==========
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
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

    // ========== POOL FUNDING ==========
    function fundPool() external payable {
        require(msg.value > 0, "No funds sent");
        poolBalance += msg.value;
        emit PoolFunded(msg.sender, msg.value);
    }

    function withdrawPool(uint256 amount) external onlyOwner {
        require(amount <= poolBalance, "Amount exceeds pool balance");
        poolBalance -= amount;
        payable(owner).transfer(amount);
        emit PoolWithdrawn(msg.sender, amount);
    }

    receive() external payable {
        poolBalance += msg.value;
        emit PoolFunded(msg.sender, msg.value);
    }

    // ========== VIEWS ==========
    function getActiveBettors() external view returns (address[] memory) {
        return activeBettors;
    }

    function getBet(address user) external view returns (Bet memory) {
        return bets[user];
    }
}
