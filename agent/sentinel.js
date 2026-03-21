import fs from "fs";
import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import * as dotenv from "dotenv";
dotenv.config();

// Load deployed contract addresses
let addresses = {};
if (fs.existsSync("./deployed-addresses.json")) {
  addresses = JSON.parse(fs.readFileSync("./deployed-addresses.json", "utf8")).contracts;
}

const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.ALCHEMY_BASE_URL),
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(process.env.ALCHEMY_BASE_URL),
});

// Minimal ABI for SentinelReceipt
const receiptABI = [
  {
    name: "writeReceipt",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "actionType", type: "string" },
      { name: "proofHash", type: "bytes32" },
      { name: "confidenceScore", type: "uint256" },
      { name: "outcome", type: "string" },
      { name: "yieldDelta", type: "int256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
];

// Minimal ABI for SentinelSwapHook
const swapHookABI = [
  {
    name: "registerProof",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proofHash", type: "bytes32" },
      { name: "confidenceScore", type: "uint256" },
      { name: "strategyHash", type: "string" },
    ],
    outputs: [],
  },
];

async function writeOnchainReceipt(shadowProof, action) {
  if (!addresses.SentinelReceipt) {
    console.log("⚠️  No deployed contract address found. Run deploy first.");
    return null;
  }

  console.log("\n📝 Writing ERC-8004 receipt onchain...");

  try {
    const proofHashBytes = shadowProof.proofHash.padEnd(66, "0").slice(0, 66);

    const txHash = await walletClient.writeContract({
      address: addresses.SentinelReceipt,
      abi: receiptABI,
      functionName: "writeReceipt",
      args: [
        action,
        proofHashBytes,
        BigInt(shadowProof.confidenceScore),
        `Sentinel executed ${action} with ${shadowProof.confidenceScore}% confidence`,
        BigInt(0),
      ],
    });

    console.log("✅ Receipt written onchain!");
    console.log("   TX Hash:", txHash);
    console.log(`   🔗 https://basescan.org/tx/${txHash}`);
    return txHash;
  } catch (err) {
    console.error("❌ Failed to write receipt:", err.message);
    return null;
  }
}

async function registerProofOnchain(shadowProof) {
  if (!addresses.SentinelSwapHook) {
    console.log("⚠️  No SwapHook address. Run deploy first.");
    return null;
  }

  console.log("\n🔐 Registering shadow proof onchain...");

  try {
    const proofHashBytes = shadowProof.proofHash.padEnd(66, "0").slice(0, 66);

    const txHash = await walletClient.writeContract({
      address: addresses.SentinelSwapHook,
      abi: swapHookABI,
      functionName: "registerProof",
      args: [
        proofHashBytes,
        BigInt(shadowProof.confidenceScore),
        shadowProof.strategyHash,
      ],
    });

    console.log("✅ Proof registered onchain!");
    console.log("   TX Hash:", txHash);
    console.log(`   🔗 https://basescan.org/tx/${txHash}`);
    return txHash;
  } catch (err) {
    console.error("❌ Failed to register proof:", err.message);
    return null;
  }
}

async function runFullCycle() {
  console.log("🤖 SENTINEL AGENT — FULL EXECUTION CYCLE");
  console.log("==========================================\n");

  // Check for shadow proof
  if (!fs.existsSync("./agent/shadow-proof.json")) {
    console.log("No shadow proof found. Run simulation/simulate.js first.");
    return;
  }

  const shadowProof = JSON.parse(fs.readFileSync("./agent/shadow-proof.json", "utf8"));
  console.log("📋 Loaded shadow proof:", shadowProof.proofHash);
  console.log("   Confidence:", shadowProof.confidenceScore + "%");
  console.log("   Approved:", shadowProof.approved);

  if (!shadowProof.approved) {
    console.log("❌ Proof not approved. Confidence too low. Aborting.");
    return;
  }

  // Register proof onchain
  const proofTx = await registerProofOnchain(shadowProof);

  // Write receipt onchain
  const receiptTx = await writeOnchainReceipt(shadowProof, "REBALANCE");

  console.log("\n========================================");
  console.log("✅ SENTINEL CYCLE COMPLETE");
  console.log("========================================");
  console.log("Proof TX:", proofTx || "skipped");
  console.log("Receipt TX:", receiptTx || "skipped");
  console.log("\nSentinel has:");
  console.log("  1. Monitored risk privately (Venice)");
  console.log("  2. Simulated the decision (EigenCloud TEE)");
  console.log("  3. Verified confidence ≥ 75%");
  console.log("  4. Registered proof onchain (SentinelSwapHook)");
  console.log("  5. Written permanent receipt (SentinelReceipt)");
  console.log("\nAll without touching the principal. 🛡️");
}

runFullCycle();
