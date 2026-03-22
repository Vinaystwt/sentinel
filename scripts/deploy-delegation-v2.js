import { createWalletClient, createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { readFile } from "fs/promises";
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

async function deploy() {
  console.log("=== Deploying SentinelDelegation V2 ===");
  console.log("Deployer:", account.address);

  // Read compiled artifact
  const artifact = JSON.parse(
    await readFile("./artifacts/contracts/SentinelDelegation.sol/SentinelDelegation.json", "utf8")
  );

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [account.address],
  });

  console.log("Deploy TX:", hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("New SentinelDelegation address:", receipt.contractAddress);
  console.log("BaseScan:", `https://basescan.org/address/${receipt.contractAddress}`);
  console.log("\nSave this address — update DELEGATION_CONTRACT in register-delegation.js");
}

deploy().catch(console.error);
