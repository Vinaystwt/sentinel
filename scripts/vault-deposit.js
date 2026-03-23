import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ALCHEMY_URL = process.env.ALCHEMY_URL || 'https://base-mainnet.g.alchemy.com/v2/9DEiQU97Q_xA_8joYIM4m';
const VAULT_ADDRESS = '0xa7ecd19963abcbd8ee8df55b97f6a25ab80bc34a';

async function depositToVault() {
  if (!PRIVATE_KEY) throw new Error('PRIVATE_KEY env var required');
  
  const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
  
  const publicClient = createPublicClient({ chain: base, transport: http(ALCHEMY_URL) });
  const walletClient = createWalletClient({ account, chain: base, transport: http(ALCHEMY_URL) });

  console.log('Wallet:', account.address);
  console.log('Vault:', VAULT_ADDRESS);
  console.log('Amount: 0.001 ETH');

  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Wallet balance:', (Number(balance) / 1e18).toFixed(6), 'ETH');

  if (balance < parseEther('0.0015')) {
    throw new Error('Insufficient balance — need at least 0.0015 ETH for deposit + gas');
  }

  console.log('\nSending 0.001 ETH to SentinelVault...');

  const hash = await walletClient.sendTransaction({
    to: VAULT_ADDRESS,
    value: parseEther('0.001'),
  });

  console.log('\nTX submitted:', hash);
  console.log('BaseScan:', `https://basescan.org/tx/${hash}`);

  console.log('\nWaiting for confirmation...');
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('Confirmed in block:', receipt.blockNumber.toString());
  console.log('Status:', receipt.status);

  return hash;
}

depositToVault().catch(console.error);
