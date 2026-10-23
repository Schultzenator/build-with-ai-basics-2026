import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { request } from 'node:http';
import { createApp } from '../src/server.js';
import { sampleMessages } from '../src/sample.js';
import { rehearsalPlan, AgentError } from '../src/agent.js';

async function withServer(app: ReturnType<typeof createApp>, run: (base: string) => Promise<void>) {
  const server: Server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const address = server.address() as { port: number };
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())); }
}
test('API produces a source-backed rehearsal plan and returns health without exposing keys', async () => {
  await withServer(createApp({ apiKey: 'test-placeholder' }), async base => {
    const health = await (await fetch(`${base}/api/health`)).json();
    assert.equal(health.liveAvailable, true);
    assert.ok(!JSON.stringify(health).includes('test-placeholder'));
    const response = await fetch(`${base}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ engine: 'rehearsal', messages: sampleMessages }) });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.decisions.length, 8); assert.equal(data.engine, 'rehearsal');
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
});
test('API rejects invalid requests, cross-origin access, foreign hosts and bad JSON', async () => {
  await withServer(createApp(), async base => {
    const post = (body: string, headers: Record<string, string> = {}) => fetch(`${base}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body });
    assert.equal((await post('{}')).status, 400);
    assert.equal((await post('{')).status, 400);
    assert.equal((await post('{}', { Origin: 'https://unrelated.example' })).status, 403);
    const hostStatus = await new Promise<number | undefined>((resolve, reject) => {
      request(`${base}/api/health`, { headers: { Host: 'unrelated.example' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject).end();
    });
    assert.equal(hostStatus, 403);
    assert.equal((await post(JSON.stringify({ engine: 'rehearsal', messages: Array(21).fill(sampleMessages[0]) }))).status, 400);
    assert.equal((await post(JSON.stringify({ content: 'x'.repeat(150000) }))).status, 413);
  });
});
test('live requests use the provider and never quietly fall back after a failure', async () => {
  let calls = 0;
  await withServer(createApp({ livePlanner: async messages => { calls++; return rehearsalPlan(messages); } }), async base => {
    const response = await fetch(`${base}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ engine: 'gemini', messages: sampleMessages }) });
    assert.equal((await response.json()).engine, 'gemini'); assert.equal(calls, 1);
  });
  await withServer(createApp({ livePlanner: async () => { throw new AgentError('Quota exhausted.'); } }), async base => {
    const response = await fetch(`${base}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ engine: 'gemini', messages: sampleMessages }) });
    assert.equal(response.status, 502); assert.deepEqual(await response.json(), { error: 'Quota exhausted.' });
  });
});
