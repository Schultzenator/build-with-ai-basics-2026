import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDecisions, exportBrief, newSession, sessionSchema, undoSession } from '../src/board.js';
import { sampleMessages } from '../src/sample.js';
import { rehearsalPlan } from '../src/agent.js';

test('applying a subset preserves unselected messages and undo restores exactly', () => {
  const original = newSession(sampleMessages);
  const decisions = rehearsalPlan(sampleMessages).decisions.slice(0, 3);
  const applied = applyDecisions(original, decisions);
  assert.equal(applied.current.inbox.length, 5); assert.equal(applied.current.board.length, 3);
  assert.deepEqual(applied.current.inbox, sampleMessages.slice(3));
  assert.deepEqual(undoSession(applied), original);
  assert.equal(original.current.inbox.length, 8);
});
test('board survives JSON roundtrip with undo and changing a category is respected', () => {
  const decisions = rehearsalPlan(sampleMessages).decisions;
  decisions[0].lane = 'next';
  const applied = applyDecisions(newSession(sampleMessages), decisions);
  const restored = sessionSchema.parse(JSON.parse(JSON.stringify(applied)));
  assert.equal(restored.current.board[0].decision.lane, 'next');
  assert.deepEqual(undoSession(restored), newSession(sampleMessages));
});
test('rejects empty, stale, repeated, invented and invalid transactions without mutation', () => {
  const session = newSession(sampleMessages);
  const decisions = rehearsalPlan(sampleMessages).decisions;
  assert.throws(() => applyDecisions(session, []));
  assert.throws(() => applyDecisions(session, [decisions[0], decisions[0]]));
  assert.throws(() => applyDecisions(session, [{ ...decisions[0], evidence: 'Invented quote' }]));
  assert.throws(() => applyDecisions(applyDecisions(session, [decisions[0]]), [decisions[0]]));
  assert.equal(session.current.inbox.length, 8);
});
test('saved session validation rejects corrupted or inconsistent board data', () => {
  const session = applyDecisions(newSession(sampleMessages), rehearsalPlan(sampleMessages).decisions);
  assert.equal(sessionSchema.safeParse({ ...session, version: 9 }).success, false);
  const tampered = structuredClone(session); tampered.current.board[0].decision.evidence = 'Invented';
  assert.equal(sessionSchema.safeParse(tampered).success, false);
  const duplicate = structuredClone(session); duplicate.current.board.push(duplicate.current.board[0]);
  assert.equal(sessionSchema.safeParse(duplicate).success, false);
});
test('Markdown export contains selected actions and sources; unselected actions stay out', () => {
  const applied = applyDecisions(newSession(sampleMessages), rehearsalPlan(sampleMessages).decisions.slice(0, 1));
  const brief = exportBrief(applied.current);
  assert.match(brief, /## Do now/); assert.match(brief, /Source:/); assert.match(brief, /Still in inbox: 7/);
  assert.ok(!brief.includes('Quick review before'));
  assert.ok(!exportBrief({ inbox: [], board: [{ message: sampleMessages[0], decision: { ...applied.current.board[0].decision, action: '<script>alert(1)</script>' } }] }).includes('<script>'));
});
