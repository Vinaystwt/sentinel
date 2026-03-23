# Sentinel Architecture — Track Evidence Map

| Layer | Component | Track | Prize | Proof | Verify |
|-------|-----------|-------|-------|-------|--------|
| Sensing | Venice AI llama-3.3-70b | Venice: Private Agents | $1k VVV | agent/venice-live-response.json | Real 200 OK — step 15 agent_log.json |
| Simulation | EigenCloud TEE SGX | EigenCloud: EigenCompute | $5k | proofs/real-simulation-output.json | docker pull vinaystwt/sentinel-simulation:latest |
| Authorization | MetaMask EIP-7715 | MetaMask: Delegations | $10k | TX 0x876a7f41... | BaseScan delegation hash |
| Execution | Uniswap v4 beforeSwap() | Uniswap: Agentic Finance | $10k | TX 0xe8b33761... | Real swap gated by TEE proof |
| Recording | ERC-8004 SentinelReceipt | Protocol Labs: Receipts | $4k | TX 0x7d84c132... | Permanent onchain receipt |
| Storage | Filecoin Storacha | Filecoin: Agentic Storage | $4k | CID bafybeibfzj... | Real w3 CLI upload |
| Autonomy | 16-step agent_log.json | Protocol Labs: Agent Cook | $4k | agent_log.json | 16 steps, real Venice+TEE |
| Principal | SentinelVault 0.001 ETH | Lido: stETH Treasury | $3k | TX 0x8d9fdd96... | Block 43725678 confirmed |

## Full End-to-End Cycle (Steps 15-16)

Venice AI (real inference) → slashingRisk=12, mevExposure=34, liquidityStress=28
→ EigenCloud TEE (real simulation) → proofHash=0x92c77a37... confidence=82
→ SentinelSwapHook.beforeSwap() (onchain enforcement)
→ SentinelReceipt.writeReceipt() (ERC-8004 permanent record)
→ Filecoin (permanent storage, CID: bafybeibfzj...)

## Honest Constraints

| Component | Status | Note |
|-----------|--------|------|
| Venice AI | LIVE | Real llama-3.3-70b, 200 OK |
| EigenCloud TEE | LIVE | Docker running, port internal by design |
| Uniswap execution | LIVE | Real swap Base mainnet |
| MetaMask delegation | LIVE | EIP-7715 hash onchain |
| ERC-8004 receipts | LIVE | Written onchain |
| Filecoin storage | LIVE | Real Storacha CIDs |
| Lido MCP | CODE ONLY | No onchain MCP calls |
| wstETH position | ETH ONLY | Vault holds ETH not staked |
