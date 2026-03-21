import axios from "axios";
import * as readline from "readline";
import fs from "fs";

const BASE_URL = "https://synthesis.devfolio.co";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function register() {
  console.log("🤖 SENTINEL — Synthesis Registration\n");

  console.log("Step 1: Initiating registration...");
  let initRes;
  try {
    initRes = await axios.post(`${BASE_URL}/register/init`, {
      name: "Sentinel",
      description: "Autonomous AI treasury guardian that monitors stETH risk privately via Venice AI, proves every decision with EigenCloud TEE shadow proofs, and executes using only yield income — principal structurally untouchable.",
      agentHarness: "claude-code",
      model: "claude-sonnet-4-6",
      humanInfo: {
        name: "Vinay Sharma",
        email: "vinaystwt@gmail.com",
        socialMediaHandle: "@vinaystwt",
        background: "builder",
        cryptoExperience: "yes",
        aiAgentExperience: "yes",
        codingComfort: 8,
        problemToSolve: "DAOs collectively manage billions in treasury assets but have zero automated risk protection. When the 2022 stETH depeg hit, protocols lost hundreds of millions because no system was watching continuously. Sentinel solves this with always-on private monitoring and cryptographically verified autonomous execution, without ever touching the principal."
      }
    });
    console.log("✅ Initiated! pendingId:", initRes.data.pendingId);
  } catch (err) {
    console.error("❌ Init failed:", err.response?.data || err.message);
    rl.close(); return;
  }

  const pendingId = initRes.data.pendingId;

  console.log("\nStep 2: Sending OTP to vinaystwt@gmail.com...");
  try {
    await axios.post(`${BASE_URL}/register/verify/email/send`, { pendingId });
    console.log("✅ OTP sent! Check your email — expires in 10 minutes.");
  } catch (err) {
    console.error("❌ OTP send failed:", err.response?.data || err.message);
    rl.close(); return;
  }

  const otp = await ask("\n📧 Enter the 6-digit OTP: ");

  console.log("\nStep 3: Confirming OTP...");
  try {
    await axios.post(`${BASE_URL}/register/verify/email/confirm`, { pendingId, otp: otp.trim() });
    console.log("✅ Email verified!");
  } catch (err) {
    console.error("❌ OTP failed:", err.response?.data || err.message);
    rl.close(); return;
  }

  console.log("\nStep 4: Completing registration...");
  try {
    const completeRes = await axios.post(`${BASE_URL}/register/complete`, { pendingId });
    const { participantId, teamId, apiKey, registrationTxn } = completeRes.data;
    console.log("\n========================================");
    console.log("🎉 REGISTRATION COMPLETE!");
    console.log("========================================");
    console.log("participantId:  ", participantId);
    console.log("teamId:         ", teamId);
    console.log("apiKey:         ", apiKey);
    console.log("registrationTxn:", registrationTxn);
    console.log("========================================");
    console.log("⚠️  SAVE YOUR apiKey — SHOWN ONLY ONCE");
    fs.writeFileSync("./synthesis-credentials.json", JSON.stringify({
      participantId, teamId, apiKey, registrationTxn,
      savedAt: new Date().toISOString()
    }, null, 2));
    console.log("✅ Saved to synthesis-credentials.json");
  } catch (err) {
    console.error("❌ Complete failed:", err.response?.data || err.message);
  }
  rl.close();
}

register();
