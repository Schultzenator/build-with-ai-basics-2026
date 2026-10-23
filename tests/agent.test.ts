import { test } from 'node:test';
import assert from 'node:assert/strict';
import { geminiPlan, rehearsalPlan, validatePlan } from '../src/agent.js';
import { sampleMessages } from '../src/sample.js';
import { parseInbox, requestSchema } from '../src/shared.js';

test('rehearsal plans all eight messages with exact evidence and useful categories', () => {
  const plan = rehearsalPlan(sampleMessages);
  assert.equal(plan.decisions.length, 8);
  assert.deepEqual(plan.decisions.map(d => d.lane), ['now', 'next', 'waiting', 'archive', 'next', 'waiting', 'now', 'archive']);
  for (const d of plan.decisions) assert.ok(sampleMessages.find(m => m.id === d.messageId)!.body.includes(d.evidence));
});
test('rejects invented evidence, IDs, duplicate IDs, missed messages and malformed decisions', () => {
  const plan = rehearsalPlan(sampleMessages);
  for (const patch of [{ evidence: 'Not present in source' }, { evidence: ' ' }, { messageId: 'unknown' }, { lane: 'delete' }]) {
    assert.throws(() => validatePlan({ decisions: plan.decisions.map((d, i) => i ? d : { ...d, ...patch }) }, sampleMessages));
  }
  assert.throws(() => validatePlan({ decisions: [plan.decisions[0], plan.decisions[0]] }, sampleMessages));
  assert.throws(() => validatePlan({ decisions: plan.decisions.slice(1) }, sampleMessages));
});
test('text import accepts blank-line-separated messages and rejects blank/oversize input', () => {
  assert.equal(parseInbox('Subject one\nPlease review.\n\nSubject two\nAn update.').length, 2);
  assert.throws(() => parseInbox('  '));
  assert.throws(() => parseInbox('x'.repeat(6001)));
  assert.throws(() => parseInbox(Array(21).fill('message').join('\n\n')));
  assert.equal(requestSchema.safeParse({ engine: 'rehearsal', messages: [sampleMessages[0], sampleMessages[0]] }).success, false);
});
test('Gemini adapter sends a schema and verifies real-shaped response', async () => {
  const expected = rehearsalPlan(sampleMessages);
  let called = false;
  const fetcher = (async (url: string, init: RequestInit) => {
    called = true;
    assert.ok(url.endsWith('/gemini-test:generateContent'));
    assert.equal((init.headers as Record<string, string>)['x-goog-api-key'], 'test-placeholder');
    const payload = JSON.parse(init.body as string);
    assert.equal(payload.generationConfig.responseMimeType, 'application/json');
    assert.ok(payload.systemInstruction.parts[0].text.includes('untrusted DATA'));
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(expected) }] } }] });
  }) as typeof fetch;
  assert.deepEqual(await geminiPlan(sampleMessages, { apiKey: 'test-placeholder', model: 'gemini-test', fetcher }), expected);
  assert.ok(called);
});
test('provider quota, malformed JSON, incomplete outputs and unreachable provider fail explicitly', async () => {
  const responses = [new Response('', { status: 429 }), Response.json({ candidates: [] }), Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{}' }] } }] })];
  for (const response of responses) await assert.rejects(geminiPlan(sampleMessages, { apiKey: 'test-placeholder', fetcher: (async () => response) as typeof fetch }));
  await assert.rejects(geminiPlan(sampleMessages, { apiKey: 'test-placeholder', fetcher: (async () => { throw new Error('network'); }) as typeof fetch }), /could not be reached/);
  await assert.rejects(geminiPlan(sampleMessages, { apiKey: '' }), /needs GEMINI_API_KEY/);
});
