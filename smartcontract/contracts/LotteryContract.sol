// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

interface IBettingContract {
    function receiveLotteryRake(uint256 amount) external;
}

contract Lottery is VRFConsumerBaseV2Plus, AutomationCompatibleInterface {
    uint256 public s_subscriptionId;
    address public bettingContract;
    address public immutable vrfCoordinator;
    bytes32 public immutable s_keyHash;
    uint32 public callbackGasLimit = 500000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 3;

    mapping(address => uint256) public points;
    address[] public participants;
    mapping(address => bool) public hasParticipated;

    uint256 public totalPool;
    uint256 public interval;
    uint256 public lastTimeStamp;
    bool public requestPending;

    address public admin;

    event LotteryEntered(address indexed user, uint256 amount);
    event WinnersPicked(address[] winners, uint256[] prizes);
    event Received(address indexed sender, uint256 amount);
    event OwnershipTransferred(address indexed newOwner);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not owner");
        _;
    }

    modifier onlyBettingContract() {
        require(msg.sender == bettingContract, "Not authorized");
        _;
    }

    constructor(
        uint256 subscriptionId,
        uint256 updateInterval,
        address _vrfCoordinator,
        bytes32 _keyHash
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        s_subscriptionId = subscriptionId;
        interval = updateInterval;
        lastTimeStamp = block.timestamp;
        admin = msg.sender;
        vrfCoordinator = _vrfCoordinator;
        s_keyHash = _keyHash;
    }

    function setBettingContract(address _bettingContract) external onlyAdmin {
        require(_bettingContract != address(0), "Invalid address");
        bettingContract = _bettingContract;
    }

    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        admin = newAdmin;
        emit OwnershipTransferred(newAdmin);
    }

    function enterLottery(address user) external payable onlyBettingContract {
        require(msg.value > 0, "No ETH sent");

        if (!hasParticipated[user]) {
            participants.push(user);
            hasParticipated[user] = true;
        }

        points[user] += 1;
        totalPool += msg.value;

        emit LotteryEntered(user, msg.value);
    }

    function checkUpkeep(
        bytes calldata
    ) external view override returns (bool upkeepNeeded, bytes memory) {
        upkeepNeeded =
            (block.timestamp - lastTimeStamp) >= interval &&
            participants.length >= 3 &&
            !requestPending;
    }

    function performUpkeep(bytes calldata) external override {
        require((block.timestamp - lastTimeStamp) >= interval, "Too early");
        require(participants.length >= 3, "Not enough players");
        require(!requestPending, "Request already pending");

        lastTimeStamp = block.timestamp;
        requestPending = true;

        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient
            .RandomWordsRequest({
                keyHash: s_keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            });

        s_vrfCoordinator.requestRandomWords(req);
    }

    function fulfillRandomWords(
        uint256,
        uint256[] calldata randomWords
    ) internal override {
        require(randomWords.length >= 3, "Not enough randomness");

        address[] memory winners = new address[](3);
        bool[] memory picked = new bool[](participants.length);
        uint256 totalPoints = 0;

        for (uint i = 0; i < participants.length; i++) {
            totalPoints += points[participants[i]];
        }

        uint256 winnerCount = 0;
        uint256 safety = 0;

        while (winnerCount < 3 && safety < 100) {
            uint256 rand = randomWords[winnerCount % randomWords.length] %
                totalPoints;
            uint256 cumulative = 0;

            for (uint i = 0; i < participants.length; i++) {
                cumulative += points[participants[i]];
                if (rand < cumulative && !picked[i]) {
                    winners[winnerCount] = participants[i];
                    picked[i] = true;
                    winnerCount++;
                    break;
                }
            }
            safety++;
        }

        uint256 fivePercent = (totalPool * 5) / 100;
        uint256 distributable = totalPool - fivePercent;

        uint256[] memory prizes = new uint256[](3);
        prizes[0] = (distributable * 40) / 100;
        prizes[1] = (distributable * 30) / 100;
        prizes[2] = (distributable * 20) / 100;

        for (uint i = 0; i < winnerCount; i++) {
            payable(winners[i]).transfer(prizes[i]);
        }

        if (fivePercent > 0 && bettingContract != address(0)) {
            payable(bettingContract).transfer(fivePercent);
        }

        emit WinnersPicked(winners, prizes);

        for (uint i = 0; i < participants.length; i++) {
            delete points[participants[i]];
            delete hasParticipated[participants[i]];
        }

        delete participants;
        totalPool = 0;
        requestPending = false;
    }

    function getParticipants() external view returns (address[] memory) {
        return participants;
    }

    function getPoints(address user) external view returns (uint256) {
        return points[user];
    }

    function getTimeRemaining() external view returns (uint256) {
        if ((block.timestamp - lastTimeStamp) >= interval) return 0;
        return interval - (block.timestamp - lastTimeStamp);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}
