import axios from "axios";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const VENICE_API_KEY = process.env.VENICE_API_KEY;
const VENICE_URL = "https://api.venice.ai/api/v1/chat/completions";

// Simulated stETH position data (in production this comes from onchain)
const getPositionData = () => ({
  totalStaked: "10.5 ETH",
  wstETHBalance: "9.8 wstETH",
  currentAPY: "3.8%",
  validatorCount: 12,
  lastSlashingEvent: "none in 30 days",
  stETHLiquidityDepth: "$450M on Curve",
  mevExposure: "low — using private mempool",
  yieldGapVsBenchmark: "+12 bps vs benchmark",
  timestamp: new Date().toISOString()
});

async function analyzeRisk(positionData) {
  console.log("🔍 Sending position data to Venice for private risk analysis...");

  const prompt = `You are a DeFi risk analysis engine for a DAO treasury holding stETH via Lido Finance.
Analyze the following position and return a JSON risk assessment.

Position Data:
${JSON.stringify(positionData, null, 2)}

Return ONLY a valid JSON object with this exact structure:
{
  "slashingRisk": <0-100>,
  "mevExposure": <0-100>,
  "liquidityStress": <0-100>,
  "yieldOptimizationGap": <basis points, 0-100>,
  "overallRisk": <"LOW"|"MEDIUM"|"HIGH"|"CRITICAL">,
  "recommendedAction": <"HOLD"|"REBALANCE"|"STAKE_MORE"|"PARTIAL_UNSTAKE">,
  "reasoning": "<one sentence>",
  "triggerSimulation": <true|false>
}

Rules:
- slashingRisk > 60 → triggerSimulation = true
- liquidityStress > 70 → triggerSimulation = true
- yieldOptimizationGap > 30 → triggerSimulation = true
- Otherwise triggerSimulation = false`;

  try {
    const response = await axios.post(
      VENICE_URL,
      {
        model: "llama-3.3-70b",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${VENICE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0].message.content;
    // Strip markdown if present
    const cleaned = content.replace(/```json|```/g, "").trim();
    const riskData = JSON.parse(cleaned);

    console.log("✅ Venice risk analysis complete (private — not stored):");
    console.log(JSON.stringify(riskData, null, 2));

    return riskData;
  } catch (err) {
    console.error("❌ Venice API error:", err.response?.data || err.message);
    return null;
  }
}

async function runMonitoringLoop() {
  console.log("👁️  SENTINEL MONITORING LOOP STARTED");
  console.log("🔒 All analysis is private — Venice does not store your data\n");

  let cycleCount = 0;

  const loop = async () => {
    cycleCount++;
    console.log(`\n--- Monitoring Cycle #${cycleCount} @ ${new Date().toISOString()} ---`);

    const position = getPositionData();
    const risk = await analyzeRisk(position);

    if (!risk) {
      console.log("⚠️  Skipping cycle — Venice unavailable");
      return;
    }

    // Log to audit file
    const logEntry = {
      cycle: cycleCount,
      timestamp: new Date().toISOString(),
      position,
      riskAssessment: risk,
    };

    const logFile = "./agent/monitoring-log.json";
    let logs = [];
    if (fs.existsSync(logFile)) {
      logs = JSON.parse(fs.readFileSync(logFile, "utf8"));
    }
    logs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

    if (risk.triggerSimulation) {
      console.log("\n🚨 RISK THRESHOLD EXCEEDED — Triggering EigenCloud simulation...");
      console.log(`   Recommended action: ${risk.recommendedAction}`);
      console.log(`   Reasoning: ${risk.reasoning}`);

      // Write trigger file for simulation engine to pick up
      fs.writeFileSync("./agent/simulation-trigger.json", JSON.stringify({
        triggered: true,
        timestamp: new Date().toISOString(),
        riskData: risk,
        position,
        recommendedAction: risk.recommendedAction,
      }, null, 2));
    } else {
      console.log(`✅ Risk level: ${risk.overallRisk} — No action needed`);
    }
  };

  // Run once immediately
  await loop();

  // Then every 60 seconds
  setInterval(loop, 60000);
}

runMonitoringLoop();
