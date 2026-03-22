import { create } from '@web3-storage/w3up-client';
import { readFile, writeFile } from 'fs/promises';
import * as dotenv from 'dotenv';
dotenv.config();

const SPACE_DID = 'did:key:z6MksFDNEMiATKkUFHJCVjbe9Ch7nvgxaL4xxba3Dm3vADyi';

async function uploadToFilecoin() {
  console.log('=== Sentinel Filecoin/IPFS Upload ===');

  const client = await create();
  await client.setCurrentSpace(SPACE_DID);
  console.log('[Filecoin] Client ready, space set');

  const results = [];

  // Upload 1: agent_log.json
  console.log('\n[Filecoin] Uploading agent_log.json...');
  const agentLog = await readFile('./agent_log.json');
  const agentLogCid = await client.uploadFile(new Blob([agentLog], { type: 'application/json' }));
  results.push({ file: 'agent_log.json', cid: agentLogCid.toString(), url: `https://w3s.link/ipfs/${agentLogCid}` });
  console.log(`[Filecoin] CID: ${agentLogCid}`);
  console.log(`[Filecoin] Verify: https://w3s.link/ipfs/${agentLogCid}`);

  // Upload 2: agent-registration.json
  console.log('\n[Filecoin] Uploading agent-registration.json...');
  const agentReg = await readFile('./docs/agent-registration.json');
  const agentRegCid = await client.uploadFile(new Blob([agentReg], { type: 'application/json' }));
  results.push({ file: 'agent-registration.json', cid: agentRegCid.toString(), url: `https://w3s.link/ipfs/${agentRegCid}` });
  console.log(`[Filecoin] CID: ${agentRegCid}`);
  console.log(`[Filecoin] Verify: https://w3s.link/ipfs/${agentRegCid}`);

  // Upload 3: audit trail
  console.log('\n[Filecoin] Uploading audit trail...');
  const auditEntry = {
    timestamp: new Date().toISOString(),
    agent: 'Sentinel DAO Guardian',
    network: 'base-mainnet',
    contracts: {
      vault: '0xa7ecd19963abcbd8ee8df55b97f6a25ab80bc34a',
      delegation: '0x9317b43be52a3159489073853c2adb2ee4960013',
      receipt: '0x1a20d875822fe026c3388b4780ab34fe29e7855b',
      swapHook: '0x94f02cc3954a4c3322afb14741d4e7d2a89f7871'
    },
    eigencloud: '0x28b72Cd70b8932aBAd5DAf0E1cE6114877548bA6',
    erc8004tx: '0x8749eda734873517affb0e16941d19be0d26cfeb6e1b78d3a2bb75088330a86a'
  };
  const auditCid = await client.uploadFile(new Blob([JSON.stringify(auditEntry, null, 2)], { type: 'application/json' }));
  results.push({ file: 'audit-trail', cid: auditCid.toString(), url: `https://w3s.link/ipfs/${auditCid}` });
  console.log(`[Filecoin] CID: ${auditCid}`);
  console.log(`[Filecoin] Verify: https://w3s.link/ipfs/${auditCid}`);

  await writeFile('./agent/filecoin-cids.json', JSON.stringify(results, null, 2));
  console.log('\n=== ALL CIDs SAVED ===');
  console.log(JSON.stringify(results, null, 2));
}

uploadToFilecoin().catch(console.error);
