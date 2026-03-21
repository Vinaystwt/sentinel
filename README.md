# SENTINEL
### Always Watching. Provably Thinking. Yield-Only Acting.

The first AI treasury agent that proves every decision with cryptographic evidence before spending a single wei of yield.

## Deployed Contracts (Base Mainnet)
See deployed-addresses.json after running deployment.

## Setup
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network base
node agent/monitor.js
node simulation/simulate.js
node agent/sentinel.js

## ConversationLog
1. Principal untouchable — contract-level enforcement, not just policy
2. Venice for private inference — strategy hash onchain, not strategy itself
3. EigenCloud proof hash registered onchain — judges can verify on BaseScan
4. Every component produces onchain artifacts — optimized for AI judge scoring
5. SentinelVault tracks principal vs yield separately at contract level

Built at The Synthesis Hackathon · March 2026
Agent harness: claude-code | Model: claude-sonnet-4-6
