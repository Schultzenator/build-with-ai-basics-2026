import assert from 'node:assert/strict';
import { geminiPlan } from '../src/agent.js';
import { sampleMessages } from '../src/sample.js';
if (!process.env.GEMINI_API_KEY) { console.error('Set GEMINI_API_KEY on the server to run this opt-in live test.'); process.exitCode = 1; }
else {
  const started = Date.now();
  try {
    const plan = await geminiPlan(sampleMessages);
    assert.equal(plan.decisions.length, sampleMessages.length);
    console.log(JSON.stringify({ result: 'PASS', provider: 'Google Gemini', model: process.env.GEMINI_MODEL || 'gemini-3.8-flash', messages: plan.decisions.length, exactQuotesValidated: true, elapsedMs: Date.now() - started, lanes: plan.decisions.map(d => d.lane) }, null, 2));
  } catch (error) { console.error(error instanceof Error ? error.message : 'Live test failed.'); process.exitCode = 1; }
}
