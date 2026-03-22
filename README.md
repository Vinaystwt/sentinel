# SENTINEL
### Always Watching. Provably Thinking. Yield-Only Acting.

> The first AI treasury agent that proves every decision with cryptographic evidence before spending a single wei of yield.

Built for [The Synthesis Hackathon](https://synthesis.md) — March 2026

---

## What It Does

Sentinel is a fully autonomous AI treasury guardian for DAOs. It monitors stETH risk privately via Venice AI, proves every decision with an EigenCloud TEE shadow proof, and executes using only yield income — the principal is structurally untouchable at the smart contract level.

**Five properties no existing system has simultaneously:**
1. Always-on private risk monitoring (Venice AI)
2. Cryptographic proof of deliberation before every action (EigenCloud TEE)
3. Principal untouchable at the contract level (Lido + SentinelVault)
4. MEV-protected execution with precise spending guardrails (Uniswap v4 + MetaMask Delegation)
5. Permanent verifiable decision audit trail (ERC-8004 on Base mainnet)

---

## Architecture
```
Venice AI (private risk monitoring)
    ↓ risk signal (slashing/MEV/liquidity scores)
EigenCloud TEE (shadow proof simulation)
    ↓ cryptographic proof (confidence score)
MetaMask Delegation (spending rule enforcement)
    ↓ authorized action
Uniswap v4 Hook + Lido MCP (execution)
    ↓ outcome
ERC-8004 Receipt on Base (permanent record)
```

---

## Deployed Contracts (Base Mainnet)

| Contract | Address | BaseScan |
|---|---|---|
| SentinelVault | `0xa7ecd19963abcbd8ee8df55b97f6a25ab80bc34a` | [View](https://basescan.org/address/0xa7ecd19963abcbd8ee8df55b97f6a25ab80bc34a) |
| SentinelDelegation | `0x9317b43be52a3159489073853c2adb2ee4960013` | [View](https://basescan.org/address/0x9317b43be52a3159489073853c2adb2ee4960013) |
| SentinelReceipt | `0x1a20d875822fe026c3388b4780ab34fe29e7855b` | [View](https://basescan.org/address/0x1a20d875822fe026c3388b4780ab34fe29e7855b) |
| SentinelSwapHook | `0x94f02cc3954a4c3322afb14741d4e7d2a89f7871` | [View](https://basescan.org/address/0x94f02cc3954a4c3322afb14741d4e7d2a89f7871) |

---

## Real Onchain Transactions

- **ERC-8004 Identity:** https://basescan.org/tx/0x1d8f6b43ac6a697f8f1a285e3b2ee40b499c5387764fa875e9bb9bb31b93a19d
- **Shadow proof registered:** https://basescan.org/tx/0x7e23e0e38c7a809d7ad0cbfcd98db76c5210020f9c4f2862e2aa341c583fbe8b
- **ERC-8004 receipt written:** https://basescan.org/tx/0x7d84c132ea189e8d6bc391bc209301dea531c5ec2136b5fb4b12539c9e038973

---

## Setup
```bash
git clone https://github.com/Vinaystwt/sentinel
cd sentinel
npm install
cp .env.example .env   # fill in your keys
```

**Required env vars:**
```
VENICE_API_KEY=
ALCHEMY_BASE_URL=
PRIVATE_KEY=
SYNTHESIS_API_KEY=
```

**Run the agent:**
```bash
node agent/sentinel.js       # full agent cycle
node agent/monitor.js        # Venice monitoring loop
node agent/lido-integration.js  # Lido treasury checks
node simulation/simulate.js  # EigenCloud TEE simulation
```

**Deploy contracts:**
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network base
```

---

## EigenCloud Docker Image
```bash
docker pull vinaystwt/sentinel-simulation:latest
docker run -p 8080:8080 vinaystwt/sentinel-simulation:latest
```

Simulation endpoint: `POST http://localhost:8080/simulate`
Input: `{ "action_type": "REBALANCE_STETH", "position_data": {}, "market_context": {} }`
Output: `{ "confidence_score": 87, "expected_outcome": "...", "simulation_hash": "0x..." }`

---

## Agent Identity

- **agent.json** — machine-readable capability manifest
- **agent_log.json** — structured execution log with all decisions and tool calls
- **ERC-8004 identity** — onchain agent identity on Base mainnet

---

## Built At

The Synthesis Hackathon · March 2026
Agent harness: claude-code | Model: claude-sonnet-4-6
Human builder: Vinay Sharma (@vinaystwt)
