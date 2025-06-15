// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IChainlinkPriceFeed {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

contract ChronixTrade {
    struct Trade {
        address user;
        uint256 amount;
        uint256 entryPrice;
        uint256 startTime;
        uint256 duration;
        bool directionUp;
        bool settled;
        bool won;
    }

    mapping(uint256 => Trade) public trades;
    uint256 public tradeCount;
    uint256 public lotteryPot;

    IChainlinkPriceFeed public priceFeed;
    address public owner;

    event TradePlaced(uint256 tradeId, address user, uint256 amount, bool directionUp, uint256 duration);
    event TradeSettled(uint256 tradeId, bool won, uint256 payout);

    constructor(address _priceFeed) {
        priceFeed = IChainlinkPriceFeed(_priceFeed);
        owner = msg.sender;
    }

    function placeTrade(bool directionUp, uint256 duration) external payable {
        require(msg.value > 0, "Must send ETH or stablecoin (use WETH if ERC20)");
        require(duration == 1 minutes || duration == 3 minutes || duration == 5 minutes, "Invalid duration");

        (, int256 price,,,) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price from oracle");

        trades[tradeCount] = Trade({
            user: msg.sender,
            amount: msg.value,
            entryPrice: uint256(price),
            startTime: block.timestamp,
            duration: duration,
            directionUp: directionUp,
            settled: false,
            won: false
        });

        emit TradePlaced(tradeCount, msg.sender, msg.value, directionUp, duration);
        tradeCount++;
    }

    function settleTrade(uint256 tradeId) external {
        Trade storage t = trades[tradeId];
        require(!t.settled, "Trade already settled");
        require(block.timestamp >= t.startTime + t.duration, "Trade duration not ended");

        (, int256 price,,,) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price from oracle");
        uint256 exitPrice = uint256(price);

        bool wonTrade;
        if (t.directionUp) {
            wonTrade = exitPrice > t.entryPrice;
        } else {
            wonTrade = exitPrice < t.entryPrice;
        }

        t.settled = true;
        t.won = wonTrade;

        if (wonTrade) {    
            uint256 profit = t.amount;
            uint256 fee = profit * 5 / 100;
            uint256 payout = t.amount * 2 - fee;

            lotteryPot += fee;
            payable(t.user).transfer(payout);
            emit TradeSettled(tradeId, true, payout);
        } else {
            lotteryPot += t.amount;
            emit TradeSettled(tradeId, false, 0);
        }
    }

    function withdrawLotteryPot(address to, uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        require(amount <= lotteryPot, "Insufficient pot");
        lotteryPot -= amount;
        payable(to).transfer(amount);
    }

    receive() external payable {}
}
