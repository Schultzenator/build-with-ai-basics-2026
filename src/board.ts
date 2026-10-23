import { z } from 'zod';
import { decisionSchema, messageSchema, messagesSchema, laneNames, lanes, type Decision, type Message } from './shared.js';

const entrySchema = z.object({ message: messageSchema, decision: decisionSchema }).strict();
const snapshotSchema = z.object({ inbox: z.array(messageSchema).max(20), board: z.array(entrySchema).max(20) }).strict().superRefine((snapshot, ctx) => {
  const messages = [...snapshot.inbox, ...snapshot.board.map(entry => entry.message)];
  if (messages.length > 20 || new Set(messages.map(m => m.id)).size !== messages.length) ctx.addIssue({ code: 'custom', message: 'Invalid session message IDs.' });
  if (messages.length && !messagesSchema.safeParse(messages).success) ctx.addIssue({ code: 'custom', message: 'Invalid session message limits.' });
  for (const { message, decision } of snapshot.board) {
    if (message.id !== decision.messageId || !decision.evidence.trim() || !message.body.includes(decision.evidence)) ctx.addIssue({ code: 'custom', message: 'Invalid saved decision evidence.' });
  }
});
export const sessionSchema = z.object({ version: z.literal(1), current: snapshotSchema, history: z.array(snapshotSchema).max(10) }).strict();
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Session = z.infer<typeof sessionSchema>;
export const storageKey = 'flight-deck:v1';

export function newSession(messages: Message[]): Session {
  return sessionSchema.parse({ version: 1, current: { inbox: messages, board: [] }, history: [] });
}
export function applyDecisions(session: Session, decisions: Decision[]): Session {
  const validated = sessionSchema.parse(session);
  if (!decisions.length) throw new Error('Select at least one decision.');
  const chosen = z.array(decisionSchema).min(1).max(20).parse(decisions);
  if (new Set(chosen.map(d => d.messageId)).size !== chosen.length) throw new Error('Repeated decision.');
  const selected = new Set(chosen.map(d => d.messageId));
  const entries = chosen.map(decision => {
    const message = validated.current.inbox.find(m => m.id === decision.messageId);
    if (!message || !decision.evidence.trim() || !message.body.includes(decision.evidence)) throw new Error('Decision no longer matches the inbox.');
    return { message, decision };
  });
  return sessionSchema.parse({ version: 1, current: {
    inbox: validated.current.inbox.filter(m => !selected.has(m.id)), board: [...validated.current.board, ...entries]
  }, history: [...validated.history, validated.current].slice(-10) });
}
export function undoSession(session: Session): Session {
  const validated = sessionSchema.parse(session);
  if (!validated.history.length) return validated;
  return { ...validated, current: validated.history[validated.history.length - 1], history: validated.history.slice(0, -1) };
}
function markdownText(value: string): string {
  return value.replace(/[\\`*_{}\[\]()#+.!|<>-]/g, '\\$&').replace(/\r?\n/g, ' ');
}
export function exportBrief(snapshot: Snapshot): string {
  const lines = ['# Inbox Flight Deck — Action brief', '', 'Reviewed local board. No messages were sent or deleted.', ''];
  for (const lane of lanes) {
    const entries = snapshot.board.filter(e => e.decision.lane === lane);
    if (!entries.length) continue;
    lines.push(`## ${laneNames[lane]}`, '');
    for (const { message, decision } of entries) lines.push(`- [ ] ${markdownText(decision.action)}`, `  - From: ${markdownText(message.sender)} — ${markdownText(message.subject)}`, `  - Why: ${markdownText(decision.reason)}`, `  - Source: “${markdownText(decision.evidence)}”`, '');
  }
  lines.push(`Still in inbox: ${snapshot.inbox.length}.`, '');
  return lines.join('\n');
}
