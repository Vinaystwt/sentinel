import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import fs from 'fs';

const WSTETH_ADDRESS = '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452';

const WSTETH_ABI = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)'
]);

const ALCHEMY_URL = process.env.ALCHEMY_URL || 'https://base-mainnet.g.alchemy.com/v2/9DEiQU97Q_xA_8joYIM4m';

async function queryLidoOnchain() {
  console.log('Querying Lido wstETH contract on Base mainnet...');

  const client = createPublicClient({
    chain: base,
    transport: http(ALCHEMY_URL)
  });

  const [totalSupply, symbol, name, decimals] = await Promise.all([
    client.readContract({ address: WSTETH_ADDRESS, abi: WSTETH_ABI, functionName: 'totalSupply' }),
    client.readContract({ address: WSTETH_ADDRESS, abi: WSTETH_ABI, functionName: 'symbol' }),
    client.readContract({ address: WSTETH_ADDRESS, abi: WSTETH_ABI, functionName: 'name' }),
    client.readContract({ address: WSTETH_ADDRESS, abi: WSTETH_ABI, functionName: 'decimals' })
  ]);

  const result = {
    queriedAt: new Date().toISOString(),
    network: 'base-mainnet',
    contract: WSTETH_ADDRESS,
    contractName: name,
    symbol: symbol,
    decimals: decimals,
    queryType: 'READ_ONLY — no gas, no state change',
    data: {
      totalSupply: totalSupply.toString(),
      totalSupplyHuman: (Number(totalSupply) / 1e18).toFixed(4) + ' ' + symbol + ' in circulation on Base',
    },
    interpretation: 'Confirmed: wstETH is live and circulating on Base mainnet. This is the Lido-backed yield-bearing token that SentinelVault is designed to hold. Total supply confirms active Lido staking activity bridged to Base.',
    baseScanContract: 'https://basescan.org/address/' + WSTETH_ADDRESS,
    note: 'Base wstETH is a bridged token — exchange rate functions live on Ethereum mainnet Lido contract. This query confirms token existence, supply, and onchain availability for SentinelVault integration.'
  };

  console.log('\nLive Lido wstETH Data from Base Mainnet:');
  console.log('  Name:', name);
  console.log('  Symbol:', symbol);
  console.log('  Decimals:', decimals);
  console.log('  Total Supply:', result.data.totalSupplyHuman);
  console.log('\nQuery successful — wstETH confirmed live on Base mainnet.');

  fs.writeFileSync('./agent/lido-live-data.json', JSON.stringify(result, null, 2));
  console.log('Saved to agent/lido-live-data.json');

  return result;
}

queryLidoOnchain().catch(console.error);
