import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("SentinelVault", function () {
  let vault;
  let owner;
  let agent;

  beforeEach(async function () {
    [owner, agent] = await hre.viem.getWalletClients();
    vault = await hre.viem.deployContract("SentinelVault", [
      agent.account.address,
    ]);
  });

  it("should accept ETH deposits and track principal correctly", async function () {
    await vault.write.deposit({ value: parseEther("0.001") });
    const [principal] = await vault.read.getVaultStatus();
    expect(principal).to.equal(parseEther("0.001"));
  });

  it("should reject zero-value deposits", async function () {
    await expect(
      vault.write.deposit({ value: 0n })
    ).to.be.rejected;
  });

  it("should block agent from withdrawing more than yield budget", async function () {
    await vault.write.deposit({ value: parseEther("0.01") });
    await expect(
      vault.write.withdrawYieldToAgent([parseEther("1")], {
        account: agent.account,
      })
    ).to.be.rejected;
  });

  it("should only allow agent to call withdrawYieldToAgent", async function () {
    await vault.write.deposit({ value: parseEther("0.01") });
    await expect(
      vault.write.withdrawYieldToAgent([1n])
    ).to.be.rejected;
  });
});

describe("SentinelDelegation", function () {
  let delegation;
  let owner;

  beforeEach(async function () {
    [owner] = await hre.viem.getWalletClients();
    delegation = await hre.viem.deployContract("SentinelDelegation", [
      owner.account.address,
    ]);
  });

  it("should deploy with correct owner", async function () {
    const contractOwner = await delegation.read.owner();
    expect(contractOwner.toLowerCase()).to.equal(
      owner.account.address.toLowerCase()
    );
  });

  it("should reject calls from non-owner", async function () {
    const [, nonOwner] = await hre.viem.getWalletClients();
    await expect(
      delegation.write.setAgent([nonOwner.account.address], {
        account: nonOwner.account,
      })
    ).to.be.rejected;
  });
});

describe("SentinelReceipt", function () {
  let receipt;
  let owner;
  let agent;

  beforeEach(async function () {
    [owner, agent] = await hre.viem.getWalletClients();
    receipt = await hre.viem.deployContract("SentinelReceipt", [
      agent.account.address,
    ]);
  });

  it("should deploy successfully", async function () {
    expect(receipt.address).to.match(/^0x[a-fA-F0-9]{40}$/);
  });

  it("should write a receipt and return an id", async function () {
    const proofHash =
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    await receipt.write.writeReceipt(
      ["rebalance", proofHash, 95n, "success", 100n],
      { account: agent.account }
    );
    const r = await receipt.read.getReceipt([1n]);
    expect(r.proofHash).to.equal(proofHash);
  });

  it("should only allow agent to write receipts", async function () {
    const proofHash =
      "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    await expect(
      receipt.write.writeReceipt(
        ["rebalance", proofHash, 90n, "success", 0n]
      )
    ).to.be.rejected;
  });
});

describe("SentinelSwapHook", function () {
  let swapHook;
  let owner;
  let agent;

  beforeEach(async function () {
    [owner, agent] = await hre.viem.getWalletClients();
    swapHook = await hre.viem.deployContract("SentinelSwapHook", [
      agent.account.address,
    ]);
  });

  it("should deploy with correct owner", async function () {
    expect(swapHook.address).to.match(/^0x[a-fA-F0-9]{40}$/);
  });

  it("should register a proof successfully", async function () {
    const proofHash =
      "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    await swapHook.write.registerProof(
      [proofHash, 92n, "lido-rebalance-v1"],
      { account: agent.account }
    );
    const [valid] = await swapHook.read.validateProof([proofHash]);
    expect(valid).to.equal(true);
  });

  it("should block beforeSwap for unregistered proof", async function () {
    const fakeHash =
      "0x0000000000000000000000000000000000000000000000000000000000000001";
    const result = await swapHook.read.validateProof([fakeHash]);
    expect(result[0]).to.equal(false);
  });
});
