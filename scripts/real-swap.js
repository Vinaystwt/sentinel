import { createWalletClient, createPublicClient, http, parseEther } from "viem";
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

// Uniswap SwapRouter02 on Base — live and real
const SWAP_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481";
const WETH = "0x4200000000000000000000000000000000000006";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const SWAP_ABI = [
  {
    name: "exactInputSingle",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
];

const PROOF_ABI = [
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

async function executeSwap() {
  console.log("=== Sentinel Agentic Swap: ETH → USDC via Uniswap SwapRouter02 ===");
  console.log("Wallet:", account.address);

  const swapAmount = parseEther("0.0001");
  console.log("Swap amount: 0.0001 ETH → USDC");
  console.log("Router:", SWAP_ROUTER);

  // Execute real swap
  console.log("\n[Uniswap] Submitting swap TX...");
  const swapHash = await walletClient.writeContract({
    address: SWAP_ROUTER,
    abi: SWAP_ABI,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: WETH,
        tokenOut: USDC,
        fee: 500,
        recipient: account.address,
        amountIn: swapAmount,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
      },
    ],
    value: swapAmount,
  });

  console.log("[Uniswap] Swap TX:", swapHash);
  console.log("[Uniswap] BaseScan:", `https://basescan.org/tx/${swapHash}`);

  const swapReceipt = await publicClient.waitForTransactionReceipt({ hash: swapHash });
  console.log("[Uniswap] Confirmed block:", swapReceipt.blockNumber.toString());

  // Register swap TX hash as shadow proof in SentinelSwapHook
  console.log("\n[SwapHook] Registering swap as shadow proof...");
  const proofHash = swapHash;
  const proofTx = await walletClient.writeContract({
    address: "0x94f02cc3954a4c3322afb14741d4e7d2a89f7871",
    abi: PROOF_ABI,
    functionName: "registerProof",
    args: [proofHash, 95n, "uniswap-eth-usdc-500-base"],
  });

  console.log("[SwapHook] Proof TX:", proofTx);
  console.log("[SwapHook] BaseScan:", `https://basescan.org/tx/${proofTx}`);

  const proofReceipt = await publicClient.waitForTransactionReceipt({ hash: proofTx });
  console.log("[SwapHook] Confirmed block:", proofReceipt.blockNumber.toString());

  console.log("\n=== ADD TO agent_log.json ===");
  console.log(JSON.stringify({
    step: 11,
    action: "Real Uniswap ETH→USDC Swap + Shadow Proof Registration",
    network: "base-mainnet",
    swapRouter: SWAP_ROUTER,
    amountIn: "0.0001 ETH",
    tokenOut: "USDC",
    swapTxHash: swapHash,
    swapBaseScan: `https://basescan.org/tx/${swapHash}`,
    proofTxHash: proofTx,
    proofBaseScan: `https://basescan.org/tx/${proofTx}`,
    swapBlock: swapReceipt.blockNumber.toString(),
    proofBlock: proofReceipt.blockNumber.toString()
  }, null, 2));
}

executeSwap().catch(console.error);
