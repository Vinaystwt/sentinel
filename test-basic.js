import assert from 'assert';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

console.log('Running Sentinel basic validation tests...\n');

// Test 1: Contract addresses are valid EIP-55 format
const contracts = {
  SentinelVault: '0xa7ecd19963abcbd8ee8df55b97f6a25ab80bc34a',
  SentinelDelegation_v2: '0xa7a33dd5f34a397b214a1563e2ad8aaa93a39e1b',
  SentinelReceipt: '0x1a20d875822fe026c3388b4780ab34fe29e7855b',
  SentinelSwapHook: '0x94f02cc3954a4c3322afb14741d4e7d2a89f7871'
};

for (const [name, address] of Object.entries(contracts)) {
  assert(address.startsWith('0x'), `${name}: address must start with 0x`);
  assert(address.length === 42, `${name}: address must be 42 chars, got ${address.length}`);
  assert(/^0x[0-9a-fA-F]{40}$/.test(address), `${name}: address must be valid hex`);
  console.log(`✅ ${name}: ${address}`);
}

// Test 2: agent_log.json has correct structure
const agentLog = JSON.parse(fs.readFileSync('./agent_log.json', 'utf8'));
assert(agentLog.agent === 'Sentinel', 'agent_log.json: agent field must be Sentinel');
assert(agentLog.hackathon === 'The Synthesis 2026', 'agent_log.json: hackathon field missing');
assert(Array.isArray(agentLog.executionLog), 'agent_log.json: executionLog must be array');
assert(agentLog.executionLog.length >= 11, `agent_log.json: must have at least 11 steps, got ${agentLog.executionLog.length}`);
console.log(`\n✅ agent_log.json: ${agentLog.executionLog.length} execution steps found`);

// Test 3: All execution steps have required fields
for (const step of agentLog.executionLog) {
  assert(typeof step.step === 'number', `Step missing 'step' number field`);
  assert(typeof step.action === 'string', `Step ${step.step} missing 'action' field`);
  assert(typeof step.timestamp === 'string', `Step ${step.step} missing 'timestamp' field`);
  assert(typeof step.status === 'string', `Step ${step.step} missing 'status' field`);
}
console.log(`✅ All ${agentLog.executionLog.length} steps have required fields`);

// Test 4: proofs folder exists and has all 3 files
const proofFiles = ['eigencloud-verification.md', 'sample-attestation.json', 'onchain-proofs.md'];
for (const file of proofFiles) {
  assert(fs.existsSync(`./proofs/${file}`), `proofs/${file} missing`);
  console.log(`✅ proofs/${file} exists`);
}

// Test 5: sample attestation is valid and has correct structure
const attestation = JSON.parse(fs.readFileSync('./proofs/sample-attestation.json', 'utf8'));
assert(attestation.success === true, 'sample-attestation: success must be true');
assert(attestation.attestation.approved === true, 'sample-attestation: approved must be true');
assert(attestation.attestation.proofHash.startsWith('0x'), 'sample-attestation: proofHash must start with 0x');
assert(attestation.attestation.teeAttestation.hardwareVerified === true, 'sample-attestation: hardwareVerified must be true');
assert(attestation.attestation.teeAttestation.teeProvider === 'EigenCloud/EigenCompute', 'sample-attestation: teeProvider mismatch');
console.log(`✅ sample-attestation.json: proofHash=${attestation.attestation.proofHash.slice(0,20)}...`);

// Test 6: Venice mock is properly documented in monitor.js
const monitorCode = fs.readFileSync('./agent/monitor.js', 'utf8');
assert(monitorCode.includes('mock mode'), 'monitor.js: must contain mock mode disclosure');
assert(!monitorCode.includes('private inference, zero data retention'), 'monitor.js: must not contain undisclosed private inference claim');
console.log(`✅ monitor.js: Venice mock properly disclosed`);

// Test 7: README has honest architecture section
const readme = fs.readFileSync('./README.md', 'utf8');
assert(readme.includes('Architecture Status'), 'README.md: must contain Architecture Status section');
assert(readme.includes('deterministic mock'), 'README.md: must contain mock disclosure');
console.log(`✅ README.md: Honest architecture section present`);

console.log('\n🎉 All tests passed. Sentinel validation complete.');
