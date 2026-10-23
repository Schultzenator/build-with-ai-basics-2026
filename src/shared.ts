import { z } from 'zod';

export const lanes = ['now', 'next', 'waiting', 'archive'] as const;
export type Lane = typeof lanes[number];
export const laneNames: Record<Lane, string> = { now: 'Do now', next: 'Up next', waiting: 'Waiting', archive: 'Filed away' };
export const messageSchema = z.object({
  id: z.string().min(1).max(80), sender: z.string().min(1).max(120),
  subject: z.string().min(1).max(200), body: z.string().min(1).max(6000)
}).strict();
export type Message = z.infer<typeof messageSchema>;
export const decisionSchema = z.object({
  messageId: z.string().min(1).max(80), lane: z.enum(lanes),
  action: z.string().min(1).max(180), reason: z.string().min(1).max(400),
  evidence: z.string().min(1).max(500)
}).strict();
export type Decision = z.infer<typeof decisionSchema>;
export const planSchema = z.object({ decisions: z.array(decisionSchema).min(1).max(20) }).strict();
export type Plan = z.infer<typeof planSchema>;
export const messagesSchema = z.array(messageSchema).min(1).max(20).superRefine((messages, ctx) => {
  if (new Set(messages.map(m => m.id)).size !== messages.length) ctx.addIssue({ code: 'custom', message: 'Message IDs must be unique.' });
  if (messages.reduce((n, m) => n + m.body.length + m.subject.length + m.sender.length, 0) > 24000) ctx.addIssue({ code: 'custom', message: 'Inbox must be 24,000 characters or fewer.' });
});
export const requestSchema = z.object({ engine: z.enum(['rehearsal', 'gemini']), messages: messagesSchema }).strict();
export type Engine = z.infer<typeof requestSchema>['engine'];
export type PlanResponse = Plan & { engine: Engine; model: string; elapsedMs: number };

export function parseInbox(text: string): Message[] {
  const messages = text.trim().split(/\n\s*\n/).filter(Boolean).map((block, index) => {
    const lines = block.trim().split('\n');
    return { id: `import-${index + 1}`, sender: 'Pasted message', subject: lines[0].slice(0, 200), body: block.trim() };
  });
  return messagesSchema.parse(messages);
}
