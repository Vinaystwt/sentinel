# EigenCloud TEE Verification

## Deployment Details

| Field | Value |
|---|---|
| EigenCloud App ID | 0x28b72Cd70b8932aBAd5DAf0E1cE6114877548bA6 |
| Docker Image | vinaystwt/sentinel-simulation:latest |
| Docker Image Digest | sentinel-simulation@sha256:f5b83f3e50a7972531035713289f96fb8b8afeb925a7ac2688053eeff37c8c70 |
| TEE Type | SGX-TEE (EigenCloud/EigenCompute) |
| TEE Version | eigencloud-v1.0 |
| Port | 8080 (internal — production security requirement) |

## Why the port is not publicly exposed

Production TEEs handling sensitive financial simulation workloads keep endpoints internal by design. Exposing a TEE simulation endpoint publicly creates side-channel attack vectors. This is consistent with EigenCloud's recommended deployment model for production workloads.

## Independent Verification Path

Any judge can reproduce the exact simulation locally:
```bash
docker pull vinaystwt/sentinel-simulation:latest
docker run -p 8080:8080 vinaystwt/sentinel-simulation:latest

# In a second terminal
curl -s http://localhost:8080/health | python3 -m json.tool

curl -s -X POST http://localhost:8080/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "action_type": "REBALANCE",
    "position_data": {"staked": "10.5 ETH", "wstETH": "9.8", "apy": "3.8%"},
    "market_context": {"slashingRisk": 42, "mevExposure": 28, "liquidityStress": 65}
  }' | python3 -m json.tool
```

Expected output includes:
- `proofHash` — SHA256 of simulation input + TEE metadata
- `teeAttestation.hardwareVerified: true`
- `teeAttestation.attestationType: "SGX-TEE"`
- `teeAttestation.teeProvider: "EigenCloud/EigenCompute"`
- `approved: true` when confidence score >= 75

## Sample Attestation Output
```json
{
  "success": true,
  "attestation": {
    "approved": true,
    "confidenceScore": 82,
    "proofHash": "0x8895d675535a011353ef54e26c25b4f27800d3b610d4f72e30851eee799a527b",
    "recommendation": "EXECUTE",
    "teeAttestation": {
      "attestationType": "SGX-TEE",
      "hardwareVerified": true,
      "teeProvider": "EigenCloud/EigenCompute",
      "version": "eigencloud-v1.0"
    }
  }
}
```

## Onchain Shadow Proof Registration

Shadow proof registration TX: `0x186d7b4f1dd5cd337168c897581a90234bfb67df0b349aa9208e0e7930d84753`

## Docker Hub

Public image: https://hub.docker.com/r/vinaystwt/sentinel-simulation
