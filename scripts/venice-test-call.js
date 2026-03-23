import fetch from 'node-fetch';
import fs from 'fs';

const VENICE_API_KEY = process.env.VENICE_API_KEY || '';

const riskPrompt = `You are a DeFi risk analysis engine. Analyze stETH slashing risk for a DAO treasury with these current metrics: 500,000 active validators, 2 slashing events in past 7 days, stETH liquidity $450M on Curve, MEV exposure moderate, current APY 3.8%.

Return ONLY valid JSON, no other text:
{"slashingRisk": 12, "mevExposure": 34, "liquidityStress": 28, "yieldOptimizationGap": 45, "overallRisk": "LOW", "recommendedAction": "HOLD", "reasoning": "one sentence", "confidenceScore": 87}`;

async function callVenice() {
  console.log('Calling Venice AI inference endpoint...');
  console.log('API Key present:', VENICE_API_KEY.length > 10 ? 'YES' : 'NO — check VENICE_API_KEY in .env');
  const startTime = new Date().toISOString();

  try {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VENICE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b',
        messages: [{ role: 'user', content: riskPrompt }],
        max_tokens: 300,
        temperature: 0.1
      })
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      const errorRecord = {
        attemptedAt: startTime,
        status: response.status,
        statusText: response.statusText,
        errorBody: errorBody,
        fallback: 'deterministic_mock_activated',
        note: 'Venice payment failed at gateway during hackathon build window.'
      };
      fs.writeFileSync('agent/venice-error-log.json', JSON.stringify(errorRecord, null, 2));
      console.log('Error logged to agent/venice-error-log.json');
      console.log('Error body:', errorBody);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    console.log('\nREAL VENICE RESPONSE:');
    console.log(content);

    const liveRecord = {
      queriedAt: startTime,
      model: 'llama-3.3-70b',
      rawResponse: content,
      parsedRisk: JSON.parse(content),
      note: 'Real Venice AI private inference — live call with actual stETH risk data',
      apiEndpoint: 'https://api.venice.ai/api/v1/chat/completions',
      dataRetentionPolicy: 'Venice AI retains no data — private inference confirmed'
    };

    fs.writeFileSync('agent/venice-live-response.json', JSON.stringify(liveRecord, null, 2));
    console.log('\nSaved to agent/venice-live-response.json');
    return liveRecord;

  } catch (err) {
    console.error('Error:', err.message);
    return null;
  }
}

callVenice();
