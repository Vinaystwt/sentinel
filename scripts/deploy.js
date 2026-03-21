import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

// Load compiled contract artifacts
const vaultArtifact = JSON.parse(fs.readFileSync("./artifacts/contracts/SentinelVault.sol/SentinelVault.json", "utf8"));
const delegationArtifact = JSON.parse(fs.readFileSync("./artifacts/contracts/SentinelDelegation.sol/SentinelDelegation.json", "utf8"));
const receiptArtifact = JSON.parse(fs.readFileSync("./artifacts/contracts/SentinelReceipt.sol/SentinelReceipt.json", "utf8"));
const swapHookArtifact = JSON.parse(fs.readFileSync("./artifacts/contracts/SentinelSwapHook.sol/SentinelSwapHook.json", "utf8"));

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

async function deployContract(name, artifact, constructorArgs) {
  console.log(`Deploying ${name}...`);
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: constructorArgs,
  });
  console.log(`  TX hash: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`✅ ${name} deployed: ${receipt.contractAddress}`);
  return receipt.contractAddress;
}

async function main() {
  console.log("🚀 Deploying Sentinel contracts to Base Mainnet...");
  console.log("📍 Deployer:", account.address);

  const balance = await publicClient.getBalance({ address: account.address });
  console.log("💰 Balance:", Number(balance) / 1e18, "ETH\n");

  const agentAddress = account.address;

  const vaultAddress      = await deployContract("SentinelVault",      vaultArtifact,      [agentAddress]);
  const delegationAddress = await deployContract("SentinelDelegation", delegationArtifact, [agentAddress]);
  const receiptAddress    = await deployContract("SentinelReceipt",    receiptArtifact,    [agentAddress]);
  const swapHookAddress   = await deployContract("SentinelSwapHook",   swapHookArtifact,   [agentAddress]);

  console.log("\n========================================");
  console.log("🎉 ALL CONTRACTS DEPLOYED ON BASE MAINNET");
  console.log("========================================");
  console.log("SentinelVault:      ", vaultAddress);
  console.log("SentinelDelegation: ", delegationAddress);
  console.log("SentinelReceipt:    ", receiptAddress);
  console.log("SentinelSwapHook:   ", swapHookAddress);
  console.log("\n🔗 BaseScan:");
  console.log(`https://basescan.org/address/${vaultAddress}`);
  console.log(`https://basescan.org/address/${delegationAddress}`);
  console.log(`https://basescan.org/address/${receiptAddress}`);
  console.log(`https://basescan.org/address/${swapHookAddress}`);

  fs.writeFileSync("./deployed-addresses.json", JSON.stringify({
    network: "base-mainnet",
    deployer: agentAddress,
    timestamp: new Date().toISOString(),
    contracts: {
      SentinelVault: vaultAddress,
      SentinelDelegation: delegationAddress,
      SentinelReceipt: receiptAddress,
      SentinelSwapHook: swapHookAddress,
    }
  }, null, 2));
  console.log("\n✅ Saved to deployed-addresses.json");
}

main().catch(console.error);
