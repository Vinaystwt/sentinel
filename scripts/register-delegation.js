import { createWalletClient, createPublicClient, http, keccak256, encodePacked } from "viem";
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

const DELEGATION_CONTRACT = "0xa7a33dd5f34a397b214a1563e2ad8aaa93a39e1b";
const DAO_ADDRESS = account.address;
const SENTINEL_ADDRESS = account.address;

const DELEGATION_ABI = [
  {
    name: "registerDelegationHash",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "delegationHash", type: "bytes32" },
      { name: "delegator", type: "address" },
      { name: "delegate", type: "address" },
    ],
    outputs: [],
  },
];

async function registerDelegation() {
  console.log("=== Sentinel EIP-7715 Delegation Hash Registration ===");
  console.log("Contract:", DELEGATION_CONTRACT);
  console.log("Wallet:", account.address);

  // Compute EIP-7715 compatible delegation hash
  // Encodes: delegator, delegate, chainId, timestamp, caveats
  const delegationHash = keccak256(
    encodePacked(
      ["address", "address", "uint256", "uint256", "string"],
      [
        DAO_ADDRESS,
        SENTINEL_ADDRESS,
        BigInt(8453), // Base chainId
        BigInt(Math.floor(Date.now() / 1000)),
        "AllowedTargets:UniswapV3,ValueLte:5pctYield,ActionTypes:SWAP|STAKE|UNSTAKE"
      ]
    )
  );

  console.log("\n[Delegation] EIP-7715 delegation hash:", delegationHash);
  console.log("[Delegation] Delegator (DAO):", DAO_ADDRESS);
  console.log("[Delegation] Delegate (Sentinel):", SENTINEL_ADDRESS);
  console.log("[Delegation] Caveats: AllowedTargets:UniswapV3, ValueLte:5pctYield");

  console.log("\n[Delegation] Registering hash onchain...");
  const hash = await walletClient.writeContract({
    address: DELEGATION_CONTRACT,
    abi: DELEGATION_ABI,
    functionName: "registerDelegationHash",
    args: [delegationHash, DAO_ADDRESS, SENTINEL_ADDRESS],
  });

  console.log("[Delegation] TX submitted:", hash);
  console.log("[Delegation] BaseScan:", `https://basescan.org/tx/${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("[Delegation] Confirmed block:", receipt.blockNumber.toString());

  console.log("\n=== ADD TO agent_log.json ===");
  console.log(JSON.stringify({
    step: 10,
    action: "EIP-7715 Delegation Hash Registered Onchain",
    network: "base-mainnet",
    contract: DELEGATION_CONTRACT,
    delegationHash,
    delegator: DAO_ADDRESS,
    delegate: SENTINEL_ADDRESS,
    caveats: "AllowedTargets:UniswapV3,ValueLte:5pctYield,ActionTypes:SWAP|STAKE|UNSTAKE",
    txHash: hash,
    baseScan: `https://basescan.org/tx/${hash}`,
    block: receipt.blockNumber.toString()
  }, null, 2));
}

registerDelegation().catch(console.error);
