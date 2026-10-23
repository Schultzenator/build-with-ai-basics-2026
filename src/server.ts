import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requestSchema } from './shared.js';
import { AgentError, geminiPlan, rehearsalPlan } from './agent.js';

export function createApp(options: { livePlanner?: typeof geminiPlan; apiKey?: string } = {}) {
  const app = express();
  app.disable('x-powered-by');
  let liveBusy = false;
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    const hostname = req.hostname;
    if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) return res.status(403).json({ error: 'This app is for local use only.' });
    if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'POST') {
      const origin = req.get('origin');
      if (origin && origin !== `http://${req.get('host')}`) return res.status(403).json({ error: 'Cross-origin requests are not allowed.' });
      if (!req.is('application/json')) return res.status(415).json({ error: 'Send JSON.' });
    }
    next();
  });
  app.use(express.json({ limit: '128kb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true, liveAvailable: Boolean(options.apiKey ?? process.env.GEMINI_API_KEY), model: process.env.GEMINI_MODEL || 'gemini-3.8-flash' }));
  app.post('/api/plan', async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Use 1–20 unique messages, with at most 24,000 characters in total. Each message needs a sender, subject and body.' });
    const { engine, messages } = parsed.data;
    if (engine === 'gemini' && liveBusy) return res.status(429).json({ error: 'A live plan is already running. Please wait.' });
    const started = Date.now();
    try {
      if (engine === 'gemini') liveBusy = true;
      const plan = engine === 'rehearsal' ? rehearsalPlan(messages) : await (options.livePlanner ?? geminiPlan)(messages, { apiKey: options.apiKey });
      return res.json({ ...plan, engine, model: engine === 'rehearsal' ? 'Deterministic rules · no LLM' : process.env.GEMINI_MODEL || 'gemini-3.8-flash', elapsedMs: Date.now() - started });
    } catch (error) {
      return res.status(error instanceof AgentError ? error.status : 500).json({ error: error instanceof AgentError ? error.message : 'The plan could not be created. Your inbox has not changed.' });
    } finally { if (engine === 'gemini') liveBusy = false; }
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route.' }));
  app.use((error: { type?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error.type === 'entity.too.large' ? 413 : 400).json({ error: error.type === 'entity.too.large' ? 'Input is too large.' : 'Invalid JSON request.' });
  });
  return app;
}

async function start() {
  const app = createApp();
  const production = fileURLToPath(import.meta.url).includes(`${path.sep}dist${path.sep}`);
  if (production) {
    const client = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client');
    app.use(express.static(client));
    app.get('/', (_req, res) => res.sendFile(path.join(client, 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, '127.0.0.1', () => console.log(`Inbox Flight Deck ready at http://localhost:${port} (${production ? 'production' : 'development'})`));
  server.on('error', (error: NodeJS.ErrnoException) => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Set PORT to a free port.` : 'Could not start local server.'); process.exitCode = 1; });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) void start();
