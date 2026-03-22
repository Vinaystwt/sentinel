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

const RECEIPT_CONTRACT = "0x1a20d875822fe026c3388b4780ab34fe29e7855b";
const AGENT_URI = "https://vinaystwt.github.io/sentinel/agent-registration.json";

const RECEIPT_ABI = [
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
    outputs: [],
  },
];

async function registerERC8004() {
  console.log("=== Sentinel ERC-8004 Identity Anchor on Base ===");
  console.log("Wallet:", account.address);

  const proofHash = keccak256(toBytes(AGENT_URI));
  console.log("Agent URI hash:", proofHash);

  console.log("\n[ERC-8004] Writing identity anchor to Base mainnet...");
  const hash = await walletClient.writeContract({
    address: RECEIPT_CONTRACT,
    abi: RECEIPT_ABI,
    functionName: "writeReceipt",
    args: [
      "erc8004-identity-registration",
      proofHash,
      100n,
      AGENT_URI,
      0n,
    ],
  });

  console.log("[ERC-8004] TX:", hash);
  console.log("[ERC-8004] BaseScan:", `https://basescan.org/tx/${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("[ERC-8004] Confirmed block:", receipt.blockNumber.toString());

  console.log("\n=== ADD TO agent_log.json ===");
  console.log(JSON.stringify({
    step: 9,
    action: "ERC-8004 Identity Registration Anchor",
    network: "base-mainnet",
    contract: RECEIPT_CONTRACT,
    agentURI: AGENT_URI,
    agentURIHash: proofHash,
    txHash: hash,
    baseScan: `https://basescan.org/tx/${hash}`,
    block: receipt.blockNumber.toString()
  }, null, 2));
}

registerERC8004().catch(console.error);
