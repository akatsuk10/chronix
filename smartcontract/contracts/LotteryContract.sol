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
    address public vrfCoordinator = 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE;
    bytes32 public s_keyHash = 0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887;
    uint32 public callbackGasLimit = 400000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 3;

    mapping(address => uint256) public points;
    address[] public participants;
    uint256 public totalPool;

    uint256 public interval;
    uint256 public lastTimeStamp;
    bool public requestPending;

    event LotteryEntered(address indexed user, uint256 amount);
    event WinnersPicked(address[3] winners, uint256[3] prizes);

    constructor(uint256 subscriptionId, uint256 updateInterval) VRFConsumerBaseV2Plus(vrfCoordinator) {
        s_subscriptionId = subscriptionId;
        interval = updateInterval;
        lastTimeStamp = block.timestamp;
    }

    modifier onlyBettingContract() {
        require(msg.sender == bettingContract, "Not authorized");
        _;
    }

    function setBettingContract(address _bettingContract) external {
        require(bettingContract == address(0), "Already set");
        bettingContract = _bettingContract;
    }

    function enterLottery(address user) external payable onlyBettingContract {
        require(msg.value > 0, "No ETH sent");

        if (points[user] == 0) {
            participants.push(user);
        }

        points[user] += 1;
        totalPool += msg.value;

        emit LotteryEntered(user, msg.value);
    }

    // Chainlink Automation Interface
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory) {
        upkeepNeeded = (block.timestamp - lastTimeStamp) >= interval && participants.length >= 3 && !requestPending;
    }

    function performUpkeep(bytes calldata) external override {
        require((block.timestamp - lastTimeStamp) >= interval, "Too early");
        require(participants.length >= 10, "Not enough players");
        require(!requestPending, "Request already pending");

        lastTimeStamp = block.timestamp;
        requestPending = true;

        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
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

    function fulfillRandomWords(uint256, uint256[] calldata randomWords) internal override {
        require(randomWords.length >= 3, "Not enough randomness");

        address[3] memory winners;
        bool[3] memory assigned;
        uint256 totalPoints = 0;

        for (uint i = 0; i < participants.length; i++) {
            totalPoints += points[participants[i]];
        }

        uint256 w = 0;
        uint256 safety = 0;
        while (w < 3 && safety < 100) {
            uint256 rand = randomWords[w % randomWords.length] % totalPoints;
            uint256 cumulative = 0;
            for (uint i = 0; i < participants.length; i++) {
                cumulative += points[participants[i]];
                if (rand < cumulative) {
                    address winner = participants[i];
                    bool alreadyPicked = false;
                    for (uint j = 0; j < w; j++) {
                        if (winners[j] == winner) {
                            alreadyPicked = true;
                            break;
                        }
                    }
                    if (!alreadyPicked) {
                        winners[w] = winner;
                        assigned[w] = true;
                        w++;
                    }
                    break;
                }
            }
            safety++;
        }

        uint256 fivePercent = (totalPool * 5) / 100;
        uint256 distributable = totalPool - fivePercent;

        uint256[3] memory prizes = [
            (distributable * 40) / 100,
            (distributable * 30) / 100,
            (distributable * 20) / 100
        ];

        for (uint i = 0; i < 3; i++) {
            if (assigned[i]) {
                payable(winners[i]).transfer(prizes[i]);
            }
        }

        if (fivePercent > 0 && bettingContract != address(0)) {
            payable(bettingContract).transfer(fivePercent);
        }

        emit WinnersPicked(winners, prizes);

        for (uint i = 0; i < participants.length; i++) {
            delete points[participants[i]];
        }
        delete participants;
        totalPool = 0;
        requestPending = false;
    }

    receive() external payable {}
}
