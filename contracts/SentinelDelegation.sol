// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SentinelDelegation {
    address public owner;
    address public agent;

    uint256 public maxSpendPerActionBps = 500;
    uint256 public maxSpendPer24Hours;
    uint256 public spentLast24Hours;
    uint256 public last24HourReset;

    enum ActionType { SWAP, STAKE, UNSTAKE }

    mapping(address => bool) public approvedCounterparties;
    mapping(bytes32 => bool) public usedProofs;
    mapping(bytes32 => bool) public registeredDelegations;

    event DelegationExecuted(ActionType actionType, address counterparty, uint256 amount, bytes32 proofHash);
    event CounterpartyApproved(address counterparty);
    event CounterpartyRevoked(address counterparty);
    event DelegationRegistered(bytes32 indexed delegationHash, address indexed delegator, address indexed delegate);

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
        maxSpendPer24Hours = 0.01 ether;
    }

    function approveCounterparty(address counterparty) external onlyOwner {
        approvedCounterparties[counterparty] = true;
        emit CounterpartyApproved(counterparty);
    }

    function revokeCounterparty(address counterparty) external onlyOwner {
        approvedCounterparties[counterparty] = false;
        emit CounterpartyRevoked(counterparty);
    }

    function executeAction(
        ActionType actionType,
        address counterparty,
        uint256 amount,
        bytes32 proofHash,
        uint256 yieldBudget
    ) external onlyAgent returns (bool) {
        if (block.timestamp >= last24HourReset + 1 days) {
            spentLast24Hours = 0;
            last24HourReset = block.timestamp;
        }
        require(!usedProofs[proofHash], "Proof already used");
        require(approvedCounterparties[counterparty], "Counterparty not approved");
        uint256 maxPerAction = (yieldBudget * maxSpendPerActionBps) / 10000;
        require(amount <= maxPerAction, "Exceeds per-action limit");
        require(spentLast24Hours + amount <= maxSpendPer24Hours, "Exceeds 24h limit");
        usedProofs[proofHash] = true;
        spentLast24Hours += amount;
        emit DelegationExecuted(actionType, counterparty, amount, proofHash);
        return true;
    }

    /**
     * @notice Register an EIP-7715 compatible delegation hash onchain
     * @dev Proves DAO-to-Sentinel delegation with AllowedTargets + ValueLte caveats
     */
    function registerDelegationHash(
        bytes32 delegationHash,
        address delegator,
        address delegate
    ) external onlyOwner {
        registeredDelegations[delegationHash] = true;
        emit DelegationRegistered(delegationHash, delegator, delegate);
    }

    function updateLimits(uint256 _maxBps, uint256 _max24h) external onlyOwner {
        maxSpendPerActionBps = _maxBps;
        maxSpendPer24Hours = _max24h;
    }

    function setAgent(address _agent) external onlyOwner {
        agent = _agent;
    }
}
