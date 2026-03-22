// Sources flattened with hardhat v3.2.0 https://hardhat.org

// SPDX-License-Identifier: MIT

// File contracts/SentinelReceipt.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SentinelReceipt
 * @notice ERC-8004 compatible onchain receipts for every agent decision.
 * Every action Sentinel takes is permanently recorded here.
 * Judges can independently verify every decision made.
 */
contract SentinelReceipt {
    address public owner;
    address public agent;

    uint256 public receiptCount;

    struct Receipt {
        uint256 id;
        string actionType;       // "SWAP", "STAKE", "UNSTAKE", "MONITOR"
        bytes32 proofHash;       // EigenCloud TEE shadow proof hash
        uint256 confidenceScore; // 0-100 from TEE simulation
        uint256 timestamp;
        string outcome;          // Human-readable result
        int256 yieldDelta;       // Yield impact in wei (can be negative)
        address executor;        // Who triggered this
    }

    mapping(uint256 => Receipt) public receipts;
    mapping(address => uint256[]) public receiptsByAgent;

    event ReceiptWritten(
        uint256 indexed id,
        string actionType,
        bytes32 proofHash,
        uint256 confidenceScore,
        string outcome
    );

    modifier onlyAgent() {
        require(msg.sender == agent, "Not agent");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _agent) {
        owner = msg.sender;
        agent = _agent;
    }

    /**
     * @notice Write a permanent decision receipt onchain
     */
    function writeReceipt(
        string calldata actionType,
        bytes32 proofHash,
        uint256 confidenceScore,
        string calldata outcome,
        int256 yieldDelta
    ) external onlyAgent returns (uint256) {
        receiptCount++;
        uint256 id = receiptCount;

        receipts[id] = Receipt({
            id: id,
            actionType: actionType,
            proofHash: proofHash,
            confidenceScore: confidenceScore,
            timestamp: block.timestamp,
            outcome: outcome,
            yieldDelta: yieldDelta,
            executor: msg.sender
        });

        receiptsByAgent[msg.sender].push(id);

        emit ReceiptWritten(id, actionType, proofHash, confidenceScore, outcome);
        return id;
    }

    /**
     * @notice Get a receipt by ID
     */
    function getReceipt(uint256 id) external view returns (Receipt memory) {
        require(id > 0 && id <= receiptCount, "Receipt not found");
        return receipts[id];
    }

    /**
     * @notice Get all receipt IDs for an agent
     */
    function getReceiptsByAgent(address _agent) external view returns (uint256[] memory) {
        return receiptsByAgent[_agent];
    }

    function setAgent(address _agent) external onlyOwner {
        agent = _agent;
    }
}

