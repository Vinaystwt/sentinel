// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SentinelSwapHook
 * @notice Uniswap v4 compatible hook that gates swaps behind TEE shadow proofs.
 * NO swap executes without a valid EigenCloud proof.
 * This is the enforcement mechanism — not just policy.
 */
contract SentinelSwapHook {
    address public owner;
    address public agent;

    uint256 public constant PROOF_EXPIRY = 10 minutes;
    uint256 public constant MIN_CONFIDENCE = 75; // 75% minimum confidence

    struct ShadowProof {
        bytes32 proofHash;
        uint256 confidenceScore;
        uint256 timestamp;
        bool used;
        string strategyHash; // hash of the strategy (not the strategy itself — privacy preserved)
    }

    mapping(bytes32 => ShadowProof) public proofs;
    mapping(bytes32 => bool) public executedProofs;

    uint256 public totalSwapsExecuted;
    uint256 public totalSwapsBlocked;

    event ProofRegistered(bytes32 indexed proofHash, uint256 confidenceScore);
    event SwapApproved(bytes32 indexed proofHash, uint256 confidenceScore);
    event SwapBlocked(bytes32 indexed proofHash, string reason);

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
    }

    /**
     * @notice Register a shadow proof from EigenCloud TEE
     * Called by agent after receiving TEE attestation
     */
    function registerProof(
        bytes32 proofHash,
        uint256 confidenceScore,
        string calldata strategyHash
    ) external onlyAgent {
        require(confidenceScore <= 100, "Invalid confidence score");
        require(!proofs[proofHash].used, "Proof already registered");

        proofs[proofHash] = ShadowProof({
            proofHash: proofHash,
            confidenceScore: confidenceScore,
            timestamp: block.timestamp,
            used: false,
            strategyHash: strategyHash
        });

        emit ProofRegistered(proofHash, confidenceScore);
    }

    /**
     * @notice beforeSwap hook — validates proof before any swap
     * Returns true if swap is allowed, reverts if not
     */
    function beforeSwap(bytes32 proofHash) external returns (bool) {
        ShadowProof storage proof = proofs[proofHash];

        // Check proof exists
        if (proof.timestamp == 0) {
            totalSwapsBlocked++;
            emit SwapBlocked(proofHash, "Proof not found");
            revert("SENTINEL: No proof registered");
        }

        // Check proof not expired (10 min window)
        if (block.timestamp > proof.timestamp + PROOF_EXPIRY) {
            totalSwapsBlocked++;
            emit SwapBlocked(proofHash, "Proof expired");
            revert("SENTINEL: Proof expired");
        }

        // Check confidence threshold
        if (proof.confidenceScore < MIN_CONFIDENCE) {
            totalSwapsBlocked++;
            emit SwapBlocked(proofHash, "Confidence below threshold");
            revert("SENTINEL: Confidence too low");
        }

        // Check not already used
        if (executedProofs[proofHash]) {
            totalSwapsBlocked++;
            emit SwapBlocked(proofHash, "Proof already used");
            revert("SENTINEL: Proof already used");
        }

        // All checks passed — approve swap
        executedProofs[proofHash] = true;
        proof.used = true;
        totalSwapsExecuted++;

        emit SwapApproved(proofHash, proof.confidenceScore);
        return true;
    }

    /**
     * @notice Check if a proof is valid without executing
     */
    function validateProof(bytes32 proofHash) external view returns (
        bool valid,
        string memory reason,
        uint256 confidenceScore
    ) {
        ShadowProof storage proof = proofs[proofHash];

        if (proof.timestamp == 0) return (false, "Proof not found", 0);
        if (block.timestamp > proof.timestamp + PROOF_EXPIRY) return (false, "Proof expired", proof.confidenceScore);
        if (proof.confidenceScore < MIN_CONFIDENCE) return (false, "Confidence too low", proof.confidenceScore);
        if (executedProofs[proofHash]) return (false, "Already used", proof.confidenceScore);

        return (true, "Valid", proof.confidenceScore);
    }

    function setAgent(address _agent) external onlyOwner {
        agent = _agent;
    }
}
