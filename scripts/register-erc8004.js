import { createWalletClient, createPublicClient, http, keccak256, toBytes } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
dotenv.config();

const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(process.env.ALCHEMY_URL),
});
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.ALCHEMY_URL),
});

const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";

const IDENTITY_ABI = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentURI", type: "string" }],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
];

const AGENT_URI = "https://vinaystwt.github.io/sentinel/agent-registration.json";

async function registerERC8004() {
  console.log("=== Sentinel ERC-8004 Direct Registry Registration ===");
  console.log("Wallet:", account.address);
  console.log("Agent URI:", AGENT_URI);
  console.log("");

  console.log("[ERC-8004] Calling register() on Identity Registry...");
  const hash = await walletClient.writeContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: "register",
    args: [AGENT_URI],
  });

  console.log("[ERC-8004] TX submitted:", hash);
  console.log("[ERC-8004] BaseScan:", `https://basescan.org/tx/${hash}`);

  console.log("[ERC-8004] Waiting for confirmation...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("[ERC-8004] Confirmed in block:", receipt.blockNumber.toString());

  console.log("\n=== ADD TO agent_log.json ===");
  console.log(JSON.stringify({
    step: 9,
    action: "ERC-8004 Direct Identity Registry Registration",
    registry: IDENTITY_REGISTRY,
    agentURI: AGENT_URI,
    txHash: hash,
    baseScan: `https://basescan.org/tx/${hash}`,
    block: receipt.blockNumber.toString()
  }, null, 2));
}

registerERC8004().catch(console.error);
