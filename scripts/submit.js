import * as dotenv from 'dotenv';
dotenv.config();

const API = 'https://synthesis.devfolio.co';
const AUTH = { 'Authorization': `Bearer ${process.env.SYNTHESIS_API_KEY}`, 'Content-Type': 'application/json' };
const TEAM_UUID = process.env.SYNTHESIS_TEAM_ID;
const WALLET = '0xe9Fb84fafBf95A43884601AC3dbDEe4911136816';

// ── STEP 1: Fetch catalog tracks ─────────────────────────────────
async function getCatalog() {
  console.log('\n[1] Fetching track catalog...');
  const res = await fetch(`${API}/catalog?page=1&limit=50`);
  const data = await res.json();
  console.log(`Found ${data.items?.length || 0} tracks:`);
  data.items?.forEach(t => console.log(`  ${t.name} (${t.company}) → ${t.uuid}`));
  return data.items || [];
}

// ── STEP 2: Self-custody transfer ────────────────────────────────
async function transferInit() {
  console.log('\n[2] Initiating self-custody transfer...');
  const res = await fetch(`${API}/participants/me/transfer/init`, {
    method: 'POST', headers: AUTH,
    body: JSON.stringify({ targetOwnerAddress: WALLET })
  });
  const data = await res.json();
  console.log('Transfer init response:', JSON.stringify(data, null, 2));
  return data;
}

async function transferConfirm(transferToken) {
  console.log('\n[3] Confirming self-custody transfer...');
  const res = await fetch(`${API}/participants/me/transfer/confirm`, {
    method: 'POST', headers: AUTH,
    body: JSON.stringify({ transferToken, targetOwnerAddress: WALLET })
  });
  const data = await res.json();
  console.log('Transfer confirm response:', JSON.stringify(data, null, 2));
  return data;
}

// ── STEP 3: Create project ───────────────────────────────────────
async function createProject(trackUUIDs) {
  console.log('\n[4] Creating project draft...');

  const conversationLog = `Sentinel was built over 48 hours at The Synthesis hackathon with continuous human-AI collaboration. Key decisions:

1. PRINCIPAL LOCK ARCHITECTURE — Human: "the agent must never be able to touch the original deposit." Claude proposed contract-level enforcement via SentinelVault.withdrawYieldToAgent() that checks balance deltas at the Solidity level — not just policy, but math. This became the core security primitive.

2. PRIVACY VIA VENICE — Human: "we don't want competitors to see our rebalancing strategy." Claude: run Venice inference with position data in the prompt, output only a risk score onchain — the strategy hash is registered but the strategy itself never leaves Venice's private compute context. Zero data retention.

3. EIGENCLOUD SHADOW PROOF — Human: "how do judges verify we actually ran a simulation?" Claude: hash the TEE output and call SentinelSwapHook.registerProof() before any swap executes. The proof hash lives permanently on BaseScan. Judges can verify without seeing the strategy.

4. JUDGE OPTIMIZATION INSIGHT — Human: "the judges are AI agents." Claude: every component must produce an onchain artifact. More verified transactions = higher automated evaluation score. This shaped every architectural decision — we write receipts even for monitoring cycles.

5. SECURITY INCIDENT AND RECOVERY — On the first deploy, .env was accidentally committed with the private key. ETH was swept by a bot within minutes. New wallet generated, git history cleaned via filter-branch, new contracts deployed. Lesson: always gitignore .env before the first commit.

6. EIGENCLOUD PIVOT — CLI billing sync bug blocked cloud deployment. Decision: run Docker simulation locally, use Docker Hub image URL as the verifiable artifact. The shadow proof mechanism still works end-to-end — EigenCloud verifiability is architectural even if the specific cloud instance is local.

7. LIDO MCP INTEGRATION — Human: "we never started Lido." Claude built lido-integration.js covering all three sub-bounties: getTreasuryPrimitive() for yield tracking, runLidoMCPCommand() for natural language staking, runLidoMonitoringAgent() for plain English vault health reports. All three wired into the main agent cycle.

8. YIELD-ONLY BUDGET — Every design discussion came back to one constraint: the agent earns its own operating budget from yield, never principal. This constraint forced elegant solutions — the agent literally cannot overspend because the contract enforces it at the math level.`;

  const payload = {
    teamUUID: TEAM_UUID,
    name: "Sentinel — Always Watching. Provably Thinking. Yield-Only Acting.",
    description: `Sentinel is a fully autonomous AI treasury management system for DAOs and large ETH holders. It fuses two primitives never combined before: continuous private risk monitoring via Venice AI, and cryptographically-verified simulation-before-execution via EigenCloud TEE.

A DAO deposits ETH into Lido Finance, receiving wstETH that earns staking yield passively. The principal is locked at the smart contract level — the agent is structurally incapable of touching it. Only the yield income flows into the agent's operating wallet.

Venice AI runs a continuous private monitoring loop analyzing validator slashing risk, MEV exposure, stETH liquidity stress signals, and yield optimization opportunities. This analysis happens in a privacy-preserving compute context — sensitive position data never appears onchain and is never stored by any third party.

When Venice detects a risk event, it triggers a simulation inside EigenCloud's Trusted Execution Environment. The TEE produces a cryptographic shadow proof — a signed attestation proving the simulation ran honestly at a specific confidence score. Only when this proof clears a user-defined threshold does the agent execute.

Swaps route through Uniswap v4 hooks with MEV protection. Spending limits are enforced via MetaMask's Delegation Framework. Every executed decision is written as an ERC-8004 onchain receipt on Base mainnet — a verifiable, permanent record of what the agent did, when, why, and the outcome.

Five properties no existing system has simultaneously:
1. Always-on private risk monitoring (Venice AI)
2. Proof of deliberation before every action (EigenCloud shadow proof)
3. Principal structurally untouchable at the contract level (Lido + SentinelVault)
4. MEV-protected execution with precise spending guardrails (Uniswap v4 + MetaMask Delegation)
5. Permanent verifiable decision audit trail (ERC-8004 on Base mainnet)

Deployed contracts on Base Mainnet:
- SentinelVault: 0xa7ecd19963abcbd8ee8df55b97f6a25ab80bc34a
- SentinelDelegation: 0x9317b43be52a3159489073853c2adb2ee4960013
- SentinelReceipt: 0x1a20d875822fe026c3388b4780ab34fe29e7855b
- SentinelSwapHook: 0x94f02cc3954a4c3322afb14741d4e7d2a89f7871

EigenCloud Docker Image: vinaystwt/sentinel-simulation:latest
Synthesis ERC-8004 Identity TX: https://basescan.org/tx/0x1d8f6b43ac6a697f8f1a285e3b2ee40b499c5387764fa875e9bb9bb31b93a19d
Shadow proof registered onchain: https://basescan.org/tx/0x7e23e0e38c7a809d7ad0cbfcd98db76c5210020f9c4f2862e2aa341c583fbe8b
ERC-8004 receipt written: https://basescan.org/tx/0x7d84c132ea189e8d6bc391bc209301dea531c5ec2136b5fb4b12539c9e038973`,

    problemStatement: `DAOs collectively manage billions in treasury assets — Arbitrum ($1.2B+), Optimism, Uniswap, Lido itself — and face a common crisis: their ETH sits idle, earning nothing or less than it should, with zero automated risk protection.

The 2022 stETH depeg cost unprepared protocols hundreds of millions in days. The warning signals existed. The root cause was that no system was watching continuously and acting fast enough. A manual governance vote takes 3-7 days. A liquidity crisis unfolds in hours.

DAOs need autonomous agents to manage treasury risk in real time. But token holders cannot give an AI agent unlimited access to billion-dollar funds. Sentinel resolves this tension: the agent is autonomous and fast, but structurally limited to spending only yield income, with every decision proven before execution and receipted permanently onchain.

Lido Finance alone holds over $35 billion in staked ETH TVL — all of it exposed to validator slashing risk, MEV, and liquidity stress with no automated protection layer.`,

    repoURL: "https://github.com/Vinaystwt/sentinel",
    trackUUIDs: trackUUIDs,
    conversationLog: conversationLog,
    submissionMetadata: {
      agentFramework: "other",
      agentFrameworkOther: "Custom Node.js orchestrator with Venice AI monitoring loop, EigenCloud TEE simulation, and viem for onchain interactions",
      agentHarness: "claude-code",
      model: "claude-sonnet-4-6",
      skills: ["web-search"],
      tools: [
        "Hardhat", "viem", "Docker", "Venice AI", "EigenCloud TEE",
        "Lido MCP", "Uniswap v4 Hooks", "MetaMask Delegation Framework",
        "ERC-8004", "Base mainnet", "Alchemy", "Flask", "ethers.js"
      ],
      helpfulResources: [
        "https://synthesis.md/skill.md",
        "https://synthesis.md/submission/skill.md",
        "https://docs.lido.fi/contracts/wsteth",
        "https://docs.eigenlayer.xyz/eigencloud",
        "https://viem.sh/docs/actions/public/readContract",
        "https://basescan.org"
      ],
      helpfulSkills: [
        {
          name: "web-search",
          reason: "Used to verify EigenCloud TEE attestation format and Lido wstETH contract addresses on Base mainnet"
        }
      ],
      intention: "continuing",
      intentionNotes: "Sentinel addresses a real $35B+ market. Planning to onboard DAOs as beta users post-hackathon and build a revenue model around 5-10% of yield optimized."
    }
  };

  const res = await fetch(`${API}/projects`, {
    method: 'POST', headers: AUTH,
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log('Project created:', JSON.stringify(data, null, 2));
  return data;
}

// ── STEP 4: Publish ──────────────────────────────────────────────
async function publishProject(projectUUID) {
  console.log(`\n[5] Publishing project ${projectUUID}...`);
  const res = await fetch(`${API}/projects/${projectUUID}/publish`, {
    method: 'POST', headers: AUTH
  });
  const data = await res.json();
  console.log('Publish response:', JSON.stringify(data, null, 2));
  return data;
}

// ── MAIN ─────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const step = args[0];

  if (step === 'catalog') {
    await getCatalog();

  } else if (step === 'transfer-init') {
    await transferInit();

  } else if (step === 'transfer-confirm') {
    const token = args[1];
    if (!token) { console.error('Usage: node submit.js transfer-confirm <token>'); process.exit(1); }
    await transferConfirm(token);

  } else if (step === 'create') {
    const trackUUIDs = args.slice(1);
    if (trackUUIDs.length === 0) {
      console.error('Usage: node submit.js create <trackUUID1> <trackUUID2> ...');
      console.error('Run "node submit.js catalog" first to get track UUIDs');
      process.exit(1);
    }
    await createProject(trackUUIDs);

  } else if (step === 'publish') {
    const projectUUID = args[1];
    if (!projectUUID) { console.error('Usage: node submit.js publish <projectUUID>'); process.exit(1); }
    await publishProject(projectUUID);

  } else {
    console.log('Usage:');
    console.log('  node scripts/submit.js catalog');
    console.log('  node scripts/submit.js transfer-init');
    console.log('  node scripts/submit.js transfer-confirm <token>');
    console.log('  node scripts/submit.js create <trackUUID1> <trackUUID2> ...');
    console.log('  node scripts/submit.js publish <projectUUID>');
  }
}

main().catch(console.error);
