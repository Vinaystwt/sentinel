// Sources flattened with hardhat v3.2.0 https://hardhat.org

// SPDX-License-Identifier: MIT

// File contracts/SentinelVault.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SentinelVault
 * @notice Accepts ETH deposits, tracks principal vs yield balance.
 * Principal is LOCKED — only yield flows to the agent operating wallet.
 */
contract SentinelVault {
    address public owner;
    address public agent;

    uint256 public totalPrincipal;
    uint256 public totalYieldEarned;
    uint256 public agentYieldBudget;

    // Simulated wstETH yield rate (0.4% per day for demo)
    uint256 public constant DAILY_YIELD_BPS = 4; // 0.04%
    uint256 public lastYieldTimestamp;

    event Deposited(address indexed depositor, uint256 amount);
    event YieldAccrued(uint256 amount);
    event YieldWithdrawnToAgent(uint256 amount);

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
        lastYieldTimestamp = block.timestamp;
    }

    /**
     * @notice Deposit ETH — this becomes locked principal
     */
    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        totalPrincipal += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Accrue yield based on time elapsed (simulated Lido staking yield)
     */
    function accrueYield() external {
        uint256 elapsed = block.timestamp - lastYieldTimestamp;
        uint256 daysElapsed = elapsed / 1 days;
        if (daysElapsed == 0) daysElapsed = 1; // minimum 1 for demo

        uint256 yield = (totalPrincipal * DAILY_YIELD_BPS * daysElapsed) / 10000;
        totalYieldEarned += yield;
        agentYieldBudget += yield;
        lastYieldTimestamp = block.timestamp;

        emit YieldAccrued(yield);
    }

    /**
     * @notice Agent can only withdraw yield — NEVER principal
     */
    function withdrawYieldToAgent(uint256 amount) external onlyAgent {
        require(amount <= agentYieldBudget, "Exceeds yield budget");
        require(amount <= address(this).balance - totalPrincipal, "Insufficient yield balance");
        agentYieldBudget -= amount;
        payable(agent).transfer(amount);
        emit YieldWithdrawnToAgent(amount);
    }

    /**
     * @notice Owner can update agent address
     */
    function setAgent(address _agent) external onlyOwner {
        agent = _agent;
    }

    /**
     * @notice View vault status
     */
    function getVaultStatus() external view returns (
        uint256 principal,
        uint256 yieldEarned,
        uint256 yieldBudget,
        uint256 contractBalance
    ) {
        return (totalPrincipal, totalYieldEarned, agentYieldBudget, address(this).balance);
    }

    receive() external payable {}
}

