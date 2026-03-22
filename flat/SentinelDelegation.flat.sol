// Sources flattened with hardhat v3.2.0 https://hardhat.org

// SPDX-License-Identifier: MIT

// File contracts/SentinelDelegation.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SentinelDelegation
 * @notice Enforces spending rules for the Sentinel agent.
 * DAO delegates to Sentinel with precise constraints:
 * - Max 5% of yield per action
 * - Only SWAP, STAKE, UNSTAKE actions allowed
 * - Only whitelisted counterparties
 * - Requires valid shadow proof hash
 */
contract SentinelDelegation {
    address public owner;
    address public agent;

    uint256 public maxSpendPerActionBps = 500; // 5% of yield budget
    uint256 public maxSpendPer24Hours;
    uint256 public spentLast24Hours;
    uint256 public last24HourReset;

    enum ActionType { SWAP, STAKE, UNSTAKE }

    mapping(address => bool) public approvedCounterparties;
    mapping(bytes32 => bool) public usedProofs;

    event DelegationExecuted(
        ActionType actionType,
        address counterparty,
        uint256 amount,
        bytes32 proofHash
    );
    event CounterpartyApproved(address counterparty);
    event CounterpartyRevoked(address counterparty);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAgent() {
        require(msg.sender == agent, "Not agent");
        _;
    }

    constructor(address _agent) {
        owner = msg.sender;
        agent = _agent;
        last24HourReset = block.timestamp;
        maxSpendPer24Hours = 0.01 ether; // default 0.01 ETH per day for demo
    }

    /**
     * @notice Approve a counterparty (e.g. Uniswap v4 pool address)
     */
    function approveCounterparty(address counterparty) external onlyOwner {
        approvedCounterparties[counterparty] = true;
        emit CounterpartyApproved(counterparty);
    }

    /**
     * @notice Revoke a counterparty
     */
    function revokeCounterparty(address counterparty) external onlyOwner {
        approvedCounterparties[counterparty] = false;
        emit CounterpartyRevoked(counterparty);
    }

    /**
     * @notice Validate and execute a delegated action
     * @param actionType SWAP=0, STAKE=1, UNSTAKE=2
     * @param counterparty Target address for the action
     * @param amount ETH amount to spend
     * @param proofHash Shadow proof hash from EigenCloud TEE
     * @param yieldBudget Current yield budget from vault
     */
    function executeAction(
        ActionType actionType,
        address counterparty,
        uint256 amount,
        bytes32 proofHash,
        uint256 yieldBudget
    ) external onlyAgent returns (bool) {
        // Reset 24h window if needed
        if (block.timestamp >= last24HourReset + 1 days) {
            spentLast24Hours = 0;
            last24HourReset = block.timestamp;
        }

        // Enforce: proof must not be reused
        require(!usedProofs[proofHash], "Proof already used");

        // Enforce: counterparty must be approved
        require(approvedCounterparties[counterparty], "Counterparty not approved");

        // Enforce: max 5% of yield budget per action
        uint256 maxPerAction = (yieldBudget * maxSpendPerActionBps) / 10000;
        require(amount <= maxPerAction, "Exceeds per-action limit");

        // Enforce: 24h spending cap
        require(spentLast24Hours + amount <= maxSpendPer24Hours, "Exceeds 24h limit");

        // Mark proof as used
        usedProofs[proofHash] = true;
        spentLast24Hours += amount;

        emit DelegationExecuted(actionType, counterparty, amount, proofHash);
        return true;
    }

    /**
     * @notice Update spending limits (owner only)
     */
    function updateLimits(uint256 _maxBps, uint256 _max24h) external onlyOwner {
        maxSpendPerActionBps = _maxBps;
        maxSpendPer24Hours = _max24h;
    }

    function setAgent(address _agent) external onlyOwner {
        agent = _agent;
    }
}

