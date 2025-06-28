// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

interface ILottery { function enterLottery(address user) external payable; }
interface ICarbonCredit { function convertAndMint(address user) external payable; }
interface IVault { function deductForBet(address user, uint256 amount) external; }

contract BTCBetting is AutomationCompatibleInterface, FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    address private constant ROUTER = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;

    address public vault;
    address public lotteryContract;
    address public carbonCreditContract;

    uint256 public poolBalance;

    struct Bet {
        uint256 amount;
        uint256 startTime;
        int256 startPrice;
        int256 endPrice;
        uint8 position;
        bool settled;
    }

    mapping(address => Bet) public bets;
    address[] public activeBettors;

    enum PriceType { NONE, START, END }
    mapping(bytes32 => address) private requestToUser;
    mapping(bytes32 => PriceType) private requestType;

    string private source = 
        "const response = await Functions.makeHttpRequest({"
        "url: 'https://chainlink-datastrems-api.onrender.com/api/report',"
        "method: 'POST',"
        "headers: { 'Content-Type': 'application/json' },"
        "data: { secret: 'supersecretcode123' }"
        "});"
        "if (response.error) throw Error('API failed');"
        "const price = response.data.report;"
        "return Functions.encodeString(price.toString());";

    bytes32 private constant DON_ID = 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000; // Sepolia
    uint32 private constant GAS_LIMIT = 300_000;

    bytes32 public lastRequestId;

    event BetPlaced(address indexed user, uint8 position, uint256 amount);
    event BetSettled(address indexed user, bool won, int256 startPrice, int256 endPrice);
    event PriceRequested(address indexed user, PriceType priceType, bytes32 requestId);
    event PriceFulfilled(address indexed user, PriceType priceType, int256 price);

    constructor() FunctionsClient(ROUTER) ConfirmedOwner(msg.sender) {}

    // Config
    function setVault(address _vault) external onlyOwner { vault = _vault; }
    function setLotteryContract(address _lottery) external onlyOwner { lotteryContract = _lottery; }
    function setCarbonContract(address _carbon) external onlyOwner { carbonCreditContract = _carbon; }

    // 🔁 Bet Placement — pull from Vault instead of msg.value
    function placeBetFor(address user, uint8 position, uint256 amount) external {
        require(position <= 1, "Invalid position");
        require(amount > 0, "Amount zero");
        require(bets[user].amount == 0 || bets[user].settled, "Active bet exists");

        IVault(vault).deductForBet(user, amount); // <-- pull funds from vault
        poolBalance += amount;

        bets[user] = Bet({
            amount: amount,
            startTime: block.timestamp,
            startPrice: 0,
            endPrice: 0,
            position: position,
            settled: false
        });

        activeBettors.push(user);
        emit BetPlaced(user, position, amount);

        _requestPrice(user, PriceType.START);
    }

    // 🏁 End bet
    function betEnd(address user) internal {
        Bet storage bet = bets[user];
        require(!bet.settled, "Already settled");
        require(block.timestamp >= bet.startTime + 300, "Too soon");
        _requestPrice(user, PriceType.END);
        bet.settled = true;
    }

    // Chainlink Automation
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        for (uint i; i < activeBettors.length; i++) {
            Bet storage b = bets[activeBettors[i]];
            if (!b.settled && block.timestamp >= b.startTime + 300) {
                return (true, abi.encode(activeBettors[i], i));
            }
        }
        return (false, "");
    }

    function performUpkeep(bytes calldata performData) external override {
        (address user, uint idx) = abi.decode(performData, (address, uint));
        betEnd(user);
        _removeBettor(idx);
    }

    function _removeBettor(uint idx) internal {
        activeBettors[idx] = activeBettors[activeBettors.length - 1];
        activeBettors.pop();
    }

    // Chainlink Functions
    function _requestPrice(address user, PriceType pType) internal {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        bytes32 rid = _sendRequest(req.encodeCBOR(), 15680, GAS_LIMIT, DON_ID);
        requestToUser[rid] = user;
        requestType[rid] = pType;
        lastRequestId = rid;
        emit PriceRequested(user, pType, rid);
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory) internal override {
        require(requestToUser[requestId] != address(0), "Unknown request");
        address user = requestToUser[requestId];
        PriceType pType = requestType[requestId];

        int256 price = _parseInt(response);
        emit PriceFulfilled(user, pType, price);

        Bet storage bet = bets[user];
        if (pType == PriceType.START) {
            bet.startPrice = price;
        } else if (pType == PriceType.END) {
            bet.endPrice = price;
            _finalizeBet(user, bet);
        }

        delete requestToUser[requestId];
        delete requestType[requestId];
    }

    // Bet resolution
    function _finalizeBet(address user, Bet storage bet) internal {
        bool won = (bet.position == 0 && bet.endPrice > bet.startPrice) ||
                   (bet.position == 1 && bet.endPrice < bet.startPrice);
        bool draw = (bet.endPrice == bet.startPrice);
        uint payout = won ? bet.amount * 2 : draw ? bet.amount : 0;

        if (payout > 0) {
            uint lotteryAmt = bet.amount * 5 / 100;
            uint carbonAmt = bet.amount * 2 / 100;
            uint finalPayout = payout - lotteryAmt - carbonAmt;
            poolBalance -= payout;

            if (lotteryContract != address(0)) ILottery(lotteryContract).enterLottery{value: lotteryAmt}(user);
            if (carbonCreditContract != address(0)) ICarbonCredit(carbonCreditContract).convertAndMint{value: carbonAmt}(user);
            payable(user).transfer(finalPayout);
        }

        emit BetSettled(user, won, bet.startPrice, bet.endPrice);
    }

    function _parseInt(bytes memory b) internal pure returns (int256) {
        uint val;
        for (uint i; i < b.length; i++) {
            require(b[i] >= 0x30 && b[i] <= 0x39, "Non-digit");
            val = val * 10 + (uint8(b[i]) - 48);
        }
        return int256(val);
    }

    // Admin pool functions
    function fundPool() external payable { poolBalance += msg.value; }
    function withdrawPool(uint amt) external onlyOwner {
        require(amt <= poolBalance, "Insufficient pool");
        poolBalance -= amt;
        payable(owner()).transfer(amt);
    }
    receive() external payable { poolBalance += msg.value; }

    // Views
    function getActiveBettors() external view returns (address[] memory) {
        return activeBettors;
    }

    function getBet(address user) external view returns (Bet memory) {
        return bets[user];
    }
}
