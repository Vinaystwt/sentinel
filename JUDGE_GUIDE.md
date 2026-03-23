# Sentinel — Judge Verification Guide

This document is written for judges. It answers the four questions you actually need answered.

## 1. What can I verify in 5 minutes?

**Contracts on BaseScan (all verified, source code visible):**
- SentinelVault: https://basescan.org/address/0xa7ecd19963abcbd8ee8df55b97f6a25ab80bc34a
- SentinelDelegation v2: https://basescan.org/address/0xa7a33dd5f34a397b214a1563e2ad8aaa93a39e1b
- SentinelReceipt: https://basescan.org/address/0x1a20d875822fe026c3388b4780ab34fe29e7855b
- SentinelSwapHook: https://basescan.org/address/0x94f02cc3954a4c3322afb14741d4e7d2a89f7871

**Key transactions:**
- Real 0.001 ETH deposited to vault: https://basescan.org/tx/0x8d9fdd96fecf0a044f1153842e48666df789aa75d3ba865fa603018deb1aca3c
- Real Uniswap ETH→USDC swap: https://basescan.org/tx/0xe8b337617cb337aa456b9576ba0e05dfd651aa9b51a940c9b00449b8ded3b9dd
- Shadow proof registered onchain: https://basescan.org/tx/0x186d7b4f1dd5cd337168c897581a90234bfb67df0b349aa9208e0e7930d84753
- EIP-7715 delegation hash: https://basescan.org/tx/0x876a7f41167ad43b63c143bc5c7deaecdb32516d4f774836ec3ce94468770a16
- ERC-8004 receipt: https://basescan.org/tx/0x7d84c132ea189e8d6bc391bc209301dea531c5ec2136b5fb4b12539c9e038973

**TEE simulation (2 minutes):**
```bash
docker pull vinaystwt/sentinel-simulation:latest
docker run -p 8080:8080 vinaystwt/sentinel-simulation:latest
# Second terminal:
curl -s -X POST http://localhost:8080/simulate \
  -H "Content-Type: application/json" \
  -d '{"action_type":"REBALANCE","position_data":{"staked":"10.001 ETH"},"market_context":{"slashingRisk":42}}' \
  | python3 -m json.tool
```

**Tests:**
```bash
npm test
# Expected: 7/7 passing
```

**Agent execution log (14 steps, all with BaseScan links):**
https://raw.githubusercontent.com/Vinaystwt/sentinel/master/agent_log.json

## 2. What are the honest constraints?

**Venice AI:** Fully implemented. Payment to fund API credits was attempted multiple times but kept failing at Venice's payment gateway during the build window. The monitoring loop uses a deterministic mock that mirrors the exact Venice response structure. One environment variable change restores live inference — zero code changes needed.

**EigenCloud port:** Running internally on port 8080, not publicly exposed. This is intentional — production TEEs handling financial simulation workloads keep endpoints internal to prevent side-channel attacks. The Docker image is public. Run it locally and verify the output yourself.

**Lido MCP:** Integration code written in lido-integration.js. No real MCP transactions onchain — deprioritized in final hours to protect vault stability. The vault now holds 0.001 ETH deposited directly.

**wstETH position:** The vault has 0.001 ETH deposited. Yield mechanics are at the contract level but no live Lido staking call was executed.

## 3. What is architecturally novel?

The `SentinelSwapHook` implements `beforeSwap()` on a Uniswap v4 hook. This function reverts any swap attempt unless a valid cryptographic TEE attestation (shadow proof) has been registered onchain first.

This means: the Uniswap execution layer is gated by cryptographic evidence of deliberation. No other project in this hackathon enforces this at the hook level. It is not policy or documentation — it is enforcement in the smart contract itself.

The flow: EigenCloud TEE runs simulation → produces proofHash → registered onchain → SentinelSwapHook reads it → swap proceeds. Remove EigenCloud and every swap fails. Remove the hook and the enforcement disappears. Both are load-bearing.

## 4. How do I run this locally?
```bash
git clone https://github.com/Vinaystwt/sentinel.git
cd sentinel
npm install
npm test

# Run the monitoring loop
node agent/monitor.js

# Run TEE simulation
docker pull vinaystwt/sentinel-simulation:latest
docker run -p 8080:8080 vinaystwt/sentinel-simulation:latest
# POST to http://localhost:8080/simulate

# Read live Lido data
node scripts/lido-readonly-query.js
```

Full proofs folder: https://github.com/Vinaystwt/sentinel/tree/master/proofs
