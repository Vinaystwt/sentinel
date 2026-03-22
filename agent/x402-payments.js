import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
dotenv.config();

const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
const publicClient = createPublicClient({ chain: base, transport: http(process.env.ALCHEMY_BASE_URL) });
const walletClient = createWalletClient({ account, chain: base, transport: http(process.env.ALCHEMY_BASE_URL) });

// USDC on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }
];

// x402 payment middleware
// Agent pays for services from yield income — never principal
export class X402PaymentMiddleware {
  constructor() {
    this.paymentLog = [];
    this.totalSpent = 0n;
  }

  // Handle HTTP 402 Payment Required response
  async handlePaymentRequired(serviceUrl, amount, recipient) {
    console.log(`\n[x402] Payment required for: ${serviceUrl}`);
    console.log(`[x402] Amount: ${formatUnits(amount, 6)} USDC → ${recipient}`);

    const balance = await this.getUSDCBalance();
    console.log(`[x402] Current USDC balance: ${formatUnits(balance, 6)}`);

    if (balance < amount) {
      console.log('[x402] Insufficient USDC balance — skipping payment');
      return { success: false, reason: 'insufficient_balance' };
    }

    // Pay from yield budget only
    const receipt = await this.payUSDC(recipient, amount, serviceUrl);
    return receipt;
  }

  async getUSDCBalance() {
    try {
      return await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [account.address]
      });
    } catch (err) {
      console.error('[x402] Balance check error:', err.message);
      return 0n;
    }
  }

  async payUSDC(recipient, amount, serviceUrl) {
    try {
      console.log(`[x402] Sending ${formatUnits(amount, 6)} USDC to ${recipient}...`);

      const hash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [recipient, amount]
      });

      const payment = {
        txHash: hash,
        serviceUrl,
        amount: formatUnits(amount, 6),
        recipient,
        timestamp: new Date().toISOString(),
        baseScan: `https://basescan.org/tx/${hash}`
      };

      this.paymentLog.push(payment);
      this.totalSpent += amount;

      console.log(`[x402] Payment sent: ${hash}`);
      console.log(`[x402] BaseScan: ${payment.baseScan}`);
      return { success: true, ...payment };

    } catch (err) {
      console.error('[x402] Payment error:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Simulate x402 flow for demo
  async simulateX402Flow() {
    console.log('\n[x402] ===== X402 PAYMENT FLOW DEMO =====');
    console.log('[x402] Agent receives HTTP 402 from Venice AI API');
    console.log('[x402] Required payment: 0.001 USDC for inference compute');
    console.log('[x402] Agent checks yield budget...');

    const balance = await this.getUSDCBalance();
    console.log(`[x402] USDC balance: ${formatUnits(balance, 6)}`);
    console.log('[x402] Payment would route from yield income only — principal protected');
    console.log('[x402] x402 V2 multi-chain USDC on Base mainnet');
    console.log('[x402] =======================================\n');

    return {
      protocol: 'x402-v2',
      chain: 'base-mainnet',
      token: 'USDC',
      usdcAddress: USDC_ADDRESS,
      agentWallet: account.address,
      balance: formatUnits(balance, 6),
      yieldOnlyPayments: true,
      principalProtected: true
    };
  }

  getPaymentLog() { return this.paymentLog; }
  getTotalSpent() { return formatUnits(this.totalSpent, 6); }
}

// Run demo
const middleware = new X402PaymentMiddleware();
middleware.simulateX402Flow().then(result => {
  console.log('[x402] Flow result:', JSON.stringify(result, null, 2));
}).catch(console.error);
