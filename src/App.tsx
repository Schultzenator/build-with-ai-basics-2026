import { useEffect, useState } from 'react';
import { lanes, laneNames, parseInbox, planSchema, type Decision, type Engine, type Lane, type PlanResponse } from './shared.js';
import { sampleMessages } from './sample.js';
import { applyDecisions, exportBrief, newSession, sessionSchema, storageKey, undoSession, type Session } from './board.js';

function loadSession(): { session: Session; notice: string } {
  try {
    const saved = localStorage.getItem(storageKey);
    return { session: saved ? sessionSchema.parse(JSON.parse(saved)) : newSession(sampleMessages), notice: '' };
  } catch { return { session: newSession(sampleMessages), notice: 'Saved workspace could not be loaded. A fresh sample session is open.' }; }
}

export default function App() {
  const [initial] = useState(loadSession);
  const [session, setSession] = useState(initial.session);
  const [notice, setNotice] = useState(initial.notice);
  const [engine, setEngine] = useState<Engine>('rehearsal');
  const [live, setLive] = useState(false);
  const [model, setModel] = useState('');
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState('m1');
  const [view, setView] = useState<'plan' | 'board'>(session.current.board.length ? 'board' : 'plan');
  const [importText, setImportText] = useState('');
  const [receipt, setReceipt] = useState('');
  const [resetArmed, setResetArmed] = useState(false);
  const [importArmed, setImportArmed] = useState(false);
  const { inbox, board } = session.current;
  const allMessages = [...inbox, ...board.map(entry => entry.message)];
  const source = allMessages.find(message => message.id === focused) ?? allMessages[0];
  const sample = allMessages.length === 8 && allMessages.every(message => message.id.startsWith('m'));

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(data => { setLive(data.liveAvailable); setModel(data.model); })
      .catch(() => setError('The local server is unavailable. Start it with npm start.'));
  }, []);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(session)); }
    catch { setNotice('Browser storage is unavailable or full. This session works in memory; export your brief before closing.'); }
  }, [session]);

  async function makePlan() {
    setBusy(true); setError(''); setPlan(null); setView('plan'); setReceipt('');
    try {
      const response = await fetch('/api/plan', { method: 'POST', signal: AbortSignal.timeout(50000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ engine, messages: inbox }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The planner is unavailable.');
      const parsed = planSchema.parse(data.decisions ? { decisions: data.decisions } : data);
      setPlan({ ...data, ...parsed }); setSelected(new Set(parsed.decisions.map(d => d.messageId)));
    } catch (e) { setError(e instanceof Error && e.name === 'TimeoutError' ? 'The request timed out. Your inbox has not changed.' : e instanceof Error ? e.message : 'Could not create the plan.'); }
    finally { setBusy(false); }
  }
  function apply() {
    if (!plan) return;
    try {
      const decisions = plan.decisions.filter(d => selected.has(d.messageId));
      const next = applyDecisions(session, decisions);
      setSession(next); setPlan(null); setView('board'); setError('');
      setReceipt(`${decisions.length} decision${decisions.length === 1 ? '' : 's'} applied to your local board. ${next.current.inbox.length} left in the inbox. Nothing sent or deleted.`);
    } catch { setError('These decisions could not be applied. Please make a fresh plan.'); }
  }
  function undo() {
    setSession(undoSession(session)); setPlan(null); setError(''); setReceipt('Last batch undone. Your previous inbox and board have been restored.'); setView('board');
  }
  function reset() {
    if (!resetArmed && (board.length || !sample)) { setResetArmed(true); return; }
    setSession(newSession(sampleMessages)); setPlan(null); setError(''); setFocused('m1'); setView('plan'); setReceipt('Sample inbox restored.'); setResetArmed(false); setImportArmed(false);
  }
  function importInbox(event: React.FormEvent) {
    event.preventDefault();
    try {
      const messages = parseInbox(importText);
      if (!importArmed && (board.length || !sample)) { setImportArmed(true); return; }
      setSession(newSession(messages)); setPlan(null); setError(''); setFocused(messages[0].id); setView('plan'); setImportText(''); setReceipt(`${messages.length} pasted messages loaded. Previous session replaced.`); setImportArmed(false); setResetArmed(false);
    } catch { setError('Paste 1–20 messages separated by blank lines, at most 6,000 characters each and 24,000 total.'); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([exportBrief(session.current)], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'inbox-flight-deck-brief.md'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setReceipt('Action brief exported with the source behind every decision.');
  }
  function changeLane(id: string, lane: Lane) {
    setPlan(previous => previous ? { ...previous, decisions: previous.decisions.map(d => d.messageId === id ? { ...d, lane } : d) } : null);
  }
  function toggle(id: string) { setSelected(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  function decisionCard(decision: Decision, review: boolean) {
    const message = allMessages.find(m => m.id === decision.messageId)!;
    return <article className={`decision ${decision.lane} ${review && !selected.has(decision.messageId) ? 'excluded' : ''}`} key={decision.messageId}>
      <div className="decision-top">{review ? <label className="selection"><input type="checkbox" checked={selected.has(decision.messageId)} onChange={() => toggle(decision.messageId)} aria-label={`Apply decision for ${message.subject}`}/><span>Include in plan</span></label> : <span className={`lane-label ${decision.lane}`}>{laneNames[decision.lane]}</span>}
      {review && <select aria-label={`Category for ${message.subject}`} value={decision.lane} onChange={e => changeLane(decision.messageId, e.target.value as Lane)}>{lanes.map(lane => <option key={lane} value={lane}>{laneNames[lane]}</option>)}</select>}</div>
      <h3>{decision.action}</h3><p>{decision.reason}</p><blockquote>“{decision.evidence}”</blockquote>
      <div className="decision-bottom"><span>{message.sender}</span><button className="text-button" onClick={() => { setFocused(decision.messageId); document.getElementById('source-message')?.scrollIntoView({ block: 'nearest', behavior: 'instant' }); }}>Inspect original ↗</button></div>
    </article>;
  }

  return <div className="app-shell">
    <header className="masthead"><a className="brand" href="/"><span className="brand-icon">↗</span> INBOX FLIGHT DECK</a><span className="edition">YOUR DAY, CLEARED FOR TAKEOFF</span><span className="local-badge"><i/> Local workspace</span></header>
    <main>
      <section className="hero"><div><div className="eyebrow">LESS SORTING. MORE DOING.</div><h1>Clear the noise.<br/><em>Find your next move.</em></h1><p>A considered plan for a cluttered inbox.<br/>Every action has a source. Every decision stays yours.</p></div><div className="flight-art" aria-hidden="true"><svg viewBox="0 0 240 190"><path d="M20 160C210 180 30 20 210 30"/><circle cx="20" cy="160" r="5"/><path className="plane" d="m199 26 24-12-9 26-4-11z"/><circle className="orbit" cx="120" cy="95" r="67"/></svg><span>FROM OVERWHELM → OVERVIEW</span></div></section>
      <section className="control-bar"><div className="engine"><label htmlFor="engine">PLANNING ENGINE</label><select id="engine" value={engine} disabled={busy} onChange={e => { setEngine(e.target.value as Engine); setPlan(null); setError(''); }}><option value="rehearsal">Rehearsal · no API key</option><option value="gemini" disabled={!live}>Live Gemini{!live ? ' · key required' : ''}</option></select></div><p>{engine === 'rehearsal' ? 'Transparent rules. No LLM call. Choose Live Gemini for AI inference.' : `Uses ${model}. Sends this inbox to Google only when you make a plan.`}</p><button className="primary" disabled={busy || !inbox.length} onClick={makePlan}>{busy ? 'Planning…' : 'Make a plan'} <span>↗</span></button></section>
      {!live && <div className="setup-note">Live AI: set <code>GEMINI_API_KEY</code> in the server’s <code>.env</code> and restart. Rehearsal works now.</div>}
      {notice && <div className="notice" role="status">{notice}</div>}
      {error && <div className="notice error" role="alert">{error}</div>}
      <div className="workspace-tools"><div className="counts"><span><b data-testid="inbox-count">{inbox.length}</b> in inbox</span><span><b data-testid="board-count">{board.length}</b> on board</span></div><div className="tool-buttons"><button onClick={undo} disabled={busy || !session.history.length}>↶ Undo batch</button><button onClick={download} disabled={busy || !board.length}>↓ Export brief</button><button onClick={reset} disabled={busy}>{resetArmed ? 'Confirm reset' : 'Reset sample'}</button>{resetArmed && <button onClick={() => setResetArmed(false)}>Cancel</button>}</div></div>
      <div className="workspace"><section className="inbox-panel"><div className="section-heading"><h2>The inbox <span>{inbox.length}</span></h2><span className="micro">{sample ? 'FICTIONAL SAMPLE' : 'PASTED MESSAGES'}</span></div>
        {inbox.length ? <div className="message-list">{inbox.map((message, i) => <button className={`message ${focused === message.id ? 'active' : ''}`} key={message.id} onClick={() => setFocused(message.id)}><span className="avatar">{message.sender[0]}</span><span><span className="sender">{message.sender}</span><strong>{message.subject}</strong><span className="snippet">{message.body}</span></span><span className="message-index">{String(i + 1).padStart(2, '0')}</span></button>)}</div> : <div className="inbox-clear"><span>✓</span><h3>Room to focus.</h3><p>Your inbox is clear. Your decisions are on the board.</p></div>}
        {source && <div className="source-box" id="source-message" tabIndex={-1}><div className="eyebrow">ORIGINAL MESSAGE · {source.sender}</div><strong>{source.subject}</strong><p>{source.body}</p></div>}
        <details className="import-panel"><summary>+ Try your own messages</summary><form onSubmit={importInbox}><label htmlFor="inbox-text">One message per block, separated by a blank line. The first line becomes the subject.</label><textarea id="inbox-text" rows={6} value={importText} disabled={busy} maxLength={24000} onChange={e => { setImportText(e.target.value); setImportArmed(false); }} placeholder={'Launch review\nPlease approve the new copy today.\n\nDesign digest\nYour weekly newsletter is here.'}/><p>Replaces this local session and its undo history. In live mode, pasted text is sent to Google only when you make a plan.</p><button className="secondary" disabled={busy || !importText.trim()}>{importArmed ? 'Confirm replace session' : 'Load messages'}</button>{importArmed && <button type="button" className="text-button" onClick={() => setImportArmed(false)}>Cancel</button>}</form></details>
      </section>
      <section className="plan-panel"><div className="section-heading"><h2>{view === 'board' ? 'Your action board' : 'Your flight plan'}</h2>{board.length > 0 ? <div className="view-switch"><button aria-pressed={view === 'plan'} disabled={busy} onClick={() => setView('plan')}>Plan</button><button aria-pressed={view === 'board'} disabled={busy} onClick={() => setView('board')}>Board</button></div> : <span className="micro">REVIEW BEFORE YOU MOVE</span>}</div>
      {receipt && <div className="notice receipt" role="status">✓ {receipt}</div>}
      {busy ? <div className="empty-state" role="status"><div className="radar planning">◎</div><h3>Finding the signal…</h3><p>Reading messages and checking the source behind each action.<br/>Live requests can take up to 45 seconds.</p></div> : view === 'board' && board.length ? <>
        <div className="plan-summary"><span className="ready-dot"/> {board.length} reviewed decisions <span>LOCAL BOARD</span></div>
        {lanes.map(lane => { const entries = board.filter(entry => entry.decision.lane === lane); return entries.length > 0 && <section className="board-lane" key={lane}><h3 className={`board-lane-title ${lane}`}>{laneNames[lane]} <span>{entries.length}</span></h3>{entries.map(entry => decisionCard(entry.decision, false))}</section>; })}
      </> : plan ? <>
        <div className="plan-summary"><span className="ready-dot"/> {plan.decisions.length} source-backed decisions <span>{plan.engine === 'rehearsal' ? 'REHEARSAL · RULES' : 'LIVE GEMINI'}</span></div>
        <div className="review-toolbar"><label className="selection"><input type="checkbox" checked={selected.size === plan.decisions.length} onChange={() => setSelected(selected.size === plan.decisions.length ? new Set() : new Set(plan.decisions.map(d => d.messageId)))}/> {selected.size} of {plan.decisions.length} selected</label><button className="primary" disabled={!selected.size} onClick={apply}>Apply {selected.size} decision{selected.size === 1 ? '' : 's'} <span>→</span></button></div>
        <p className="review-help">Review the quote. Adjust the category. Only checked decisions move.</p>
        {[...plan.decisions].sort((a, b) => lanes.indexOf(a.lane) - lanes.indexOf(b.lane)).map(decision => decisionCard(decision, true))}
      </> : <div className="empty-state"><div className="radar">↗</div><span className="eyebrow">A LITTLE LESS MENTAL BAGGAGE</span><h3>{inbox.length ? `${inbox.length} messages.` : 'A clear inbox.'}<br/>{inbox.length ? 'One clear way forward.' : 'A calmer kind of day.'}</h3><p>{inbox.length ? <>Let the agent find what needs you now,<br/>what can wait, and what’s just noise.</> : 'Reset the sample or paste messages to try another round.'}</p><div className="empty-lanes">{lanes.map(lane => <span key={lane} className={lane}>{laneNames[lane]}</span>)}</div><div className="safety-note">◈ &nbsp; A plan first. Your approval always.</div></div>}
      </section></div>
    </main><footer><span>BUILT WITH INTENTION. POWERED BY YOUR JUDGMENT.</span><span>Single browser workspace · Stored on this device</span></footer>
  </div>;
}
