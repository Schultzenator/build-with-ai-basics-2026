import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const port = process.env.TEST_PORT || '4173';
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['dist/server/server.js'], { env: { ...process.env, PORT: port }, stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
server.stdout.on('data', chunk => { output += chunk; });
server.stderr.on('data', chunk => { output += chunk; });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${output}`);
    try { if ((await fetch(`${base}/api/health`)).ok) { ready = true; break; } } catch {}
    await delay(100);
  }
  assert.ok(ready, `Server did not start: ${output}`);
  const executablePath = process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
  browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.getByRole('heading', { name: /Clear the noise/ }).waitFor();
  assert.equal(await page.getByTestId('inbox-count').textContent(), '8');
  assert.equal(await page.getByTestId('board-count').textContent(), '0');
  mkdirSync('docs/screenshots', { recursive: true });
  await page.screenshot({ path: 'docs/screenshots/01-inbox.png', fullPage: true });

  await page.getByRole('button', { name: 'Make a plan' }).click();
  await page.getByRole('button', { name: 'Apply 8 decisions' }).waitFor();
  assert.equal(await page.locator('.decision').count(), 8);
  assert.ok((await page.locator('.plan-summary').textContent()).includes('REHEARSAL'));
  await page.screenshot({ path: 'docs/screenshots/02-plan.png', fullPage: true });
  await page.getByRole('checkbox', { name: 'Apply decision for Your weekly roundup: 12 things to bookmark' }).uncheck();
  await page.getByRole('combobox', { name: 'Category for Launch is blocked — need your sign-off' }).selectOption('next');
  await page.getByRole('button', { name: 'Inspect original' }).first().click();
  assert.ok((await page.locator('#source-message').textContent()).includes('The demo link is broken'));
  await page.getByRole('button', { name: 'Apply 7 decisions' }).click();
  await page.getByRole('heading', { name: 'Your action board' }).waitFor();
  assert.equal(await page.getByTestId('inbox-count').textContent(), '1');
  assert.equal(await page.getByTestId('board-count').textContent(), '7');
  assert.equal(await page.locator('.decision').count(), 7);
  await page.screenshot({ path: 'docs/screenshots/03-board.png', fullPage: true });

  await page.reload();
  await page.getByRole('heading', { name: 'Your action board' }).waitFor();
  assert.equal(await page.getByTestId('inbox-count').textContent(), '1');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export brief' }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'inbox-flight-deck-brief.md');
  const brief = readFileSync(await download.path(), 'utf8');
  assert.ok(brief.includes('Source:')); assert.ok(brief.includes('Still in inbox: 1'));
  assert.ok(!brief.includes('12 things to bookmark'));
  await page.getByRole('button', { name: 'Undo batch' }).click();
  assert.equal(await page.getByTestId('inbox-count').textContent(), '8');
  assert.equal(await page.getByTestId('board-count').textContent(), '0');
  assert.ok(await page.getByRole('button', { name: 'Undo batch' }).isDisabled());

  await page.getByRole('button', { name: 'Make a plan' }).click();
  await page.getByRole('button', { name: 'Apply 8 decisions' }).click();
  assert.equal(await page.getByTestId('inbox-count').textContent(), '0');
  assert.ok(await page.getByRole('button', { name: 'Make a plan' }).isDisabled());
  await page.getByRole('heading', { name: 'Room to focus.' }).waitFor();
  await page.getByRole('button', { name: 'Reset sample' }).click();
  assert.equal(await page.getByTestId('board-count').textContent(), '8');
  await page.getByRole('button', { name: 'Confirm reset' }).click();
  assert.equal(await page.getByTestId('inbox-count').textContent(), '8');

  await page.getByText('+ Try your own messages', { exact: true }).click();
  await page.locator('#inbox-text').fill('Review <script>window.injected=true</script>\nPlease review this today.\n\nNewsletter\nYour weekly newsletter.');
  await page.getByRole('button', { name: 'Load messages' }).click();
  assert.equal(await page.getByTestId('inbox-count').textContent(), '2');
  assert.equal(await page.evaluate(() => window.injected), undefined);
  await page.getByRole('button', { name: 'Make a plan' }).click();
  await page.getByRole('button', { name: 'Apply 2 decisions' }).waitFor();
  await page.locator('#inbox-text').fill(Array(21).fill('Too many messages').join('\n\n'));
  await page.getByRole('button', { name: 'Load messages' }).click();
  assert.ok((await page.getByRole('alert').textContent()).includes('1–20 messages'));
  assert.equal(await page.getByTestId('inbox-count').textContent(), '2');

  await page.route('**/api/plan', route => route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'Simulated provider outage. Inbox unchanged.' }) }));
  await page.getByRole('button', { name: 'Make a plan' }).click();
  await page.getByRole('alert').filter({ hasText: 'Simulated provider outage' }).waitFor();
  assert.equal(await page.getByTestId('inbox-count').textContent(), '2');
  await page.unroute('**/api/plan');

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.evaluate(() => localStorage.setItem('flight-deck:v1', 'broken-json'));
  await page.reload();
  await page.getByRole('status').filter({ hasText: 'Saved workspace could not be loaded' }).waitFor();
  assert.equal(await page.getByTestId('inbox-count').textContent(), '8');

  await page.reload(); // Storage was repaired; capture a clean recovered sample session.
  await page.getByRole('heading', { name: /Clear the noise/ }).waitFor();
  await page.screenshot({ path: 'docs/screenshots/04-mobile.png', fullPage: true });

  if (process.env.LIVE_BROWSER === '1') {
    assert.ok(process.env.GEMINI_API_KEY, 'Live browser test needs GEMINI_API_KEY');
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.getByRole('combobox', { name: 'PLANNING ENGINE' }).selectOption('gemini');
    await page.getByRole('button', { name: 'Make a plan' }).click();
    await page.getByRole('button', { name: 'Apply 8 decisions' }).waitFor({ timeout: 55000 });
    assert.ok((await page.locator('.plan-summary').textContent()).includes('LIVE GEMINI'));
    await page.screenshot({ path: 'docs/screenshots/05-live-gemini.png', fullPage: true });
    await page.getByRole('button', { name: 'Apply 8 decisions' }).click();
    assert.equal(await page.getByTestId('board-count').textContent(), '8');
    await page.getByRole('button', { name: 'Undo batch' }).click();
    assert.equal(await page.getByTestId('inbox-count').textContent(), '8');
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ result: 'PASS', productionBrowser: true, checks: ['preview', 'exact-source-view', 'category-edit', 'subset-apply', 'reload', 'export', 'undo', 'empty-inbox', 'reset-confirmation', 'text-import', 'html-escaping', 'input-error', 'provider-error', 'mobile-no-overflow', 'corrupt-storage-recovery'], liveGeminiJourney: process.env.LIVE_BROWSER === '1', screenshots: 'docs/screenshots' }, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
