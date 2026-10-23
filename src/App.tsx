import { useEffect, useState } from 'react';
import { lanes, laneNames, type Engine, type PlanResponse } from './shared.js';
import { sampleMessages } from './sample.js';

export default function App() {
  const [engine, setEngine] = useState<Engine>('rehearsal');
  const [live, setLive] = useState(false);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState('m1');
  useEffect(() => { fetch('/api/health').then(r => r.json()).then(data => setLive(data.liveAvailable)).catch(() => setError('The local server is unavailable.')); }, []);
  async function makePlan() {
    setBusy(true); setError(''); setPlan(null);
    try {
      const response = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ engine, messages: sampleMessages }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPlan(data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create the plan.'); }
    finally { setBusy(false); }
  }
  return <div className="app-shell">
    <header className="masthead"><a className="brand" href="/"><span className="brand-icon">↗</span> INBOX FLIGHT DECK</a><span className="edition">YOUR DAY, CLEARED FOR TAKEOFF</span><span className="local-badge"><i/> Local workspace</span></header>
    <main>
      <section className="hero"><div><div className="eyebrow">LESS SORTING. MORE DOING.</div><h1>Clear the noise.<br/><em>Find your next move.</em></h1><p>A considered plan for a cluttered inbox.<br/>Every action has a source. Every decision stays yours.</p></div><div className="flight-art" aria-hidden="true"><svg viewBox="0 0 240 190"><path d="M20 160C210 180 30 20 210 30"/><circle cx="20" cy="160" r="5"/><path className="plane" d="m199 26 24-12-9 26-4-11z"/><circle className="orbit" cx="120" cy="95" r="67"/></svg><span>FROM OVERWHELM → OVERVIEW</span></div></section>
      <section className="control-bar"><div className="engine"><label htmlFor="engine">PLANNING ENGINE</label><select id="engine" value={engine} disabled={busy} onChange={e => { setEngine(e.target.value as Engine); setPlan(null); }}><option value="rehearsal">Rehearsal · no API key</option><option value="gemini" disabled={!live}>Live Gemini{!live ? ' · key required' : ''}</option></select></div><p>{engine === 'rehearsal' ? 'Transparent rules. Fictional sample inbox. No LLM call.' : 'Sends these messages to Google Gemini when you make a plan.'}</p><button className="primary" disabled={busy} onClick={makePlan}>{busy ? 'Planning…' : 'Make a plan'} <span>↗</span></button></section>
      {error && <div className="notice error" role="alert">{error}</div>}
      <div className="workspace"><section className="inbox-panel"><div className="section-heading"><h2>The inbox <span>{sampleMessages.length}</span></h2><span className="micro">FICTIONAL SAMPLE</span></div><div className="message-list">{sampleMessages.map((m, i) => <button className={`message ${focused === m.id ? 'active' : ''}`} key={m.id} onClick={() => setFocused(m.id)}><span className="avatar">{m.sender[0]}</span><span><span className="sender">{m.sender}</span><strong>{m.subject}</strong><span className="snippet">{m.body}</span></span><span className="message-index">0{i + 1}</span></button>)}</div><div className="source-box"><div className="eyebrow">ORIGINAL MESSAGE</div><p>{sampleMessages.find(m => m.id === focused)?.body}</p></div></section>
      <section className="plan-panel"><div className="section-heading"><h2>Your flight plan</h2><span className="micro">REVIEW BEFORE YOU MOVE</span></div>{busy ? <div className="empty-state" role="status"><div className="radar">◎</div><h3>Finding the signal…</h3><p>Reading messages and checking the source behind each action.</p></div> : plan ? <><div className="plan-summary"><span className="ready-dot"/> {plan.decisions.length} source-backed decisions <span>{plan.engine === 'rehearsal' ? 'REHEARSAL' : 'LIVE GEMINI'}</span></div>{lanes.map(lane => <div key={lane}>{plan.decisions.filter(d => d.lane === lane).map(d => <article className={`decision ${lane}`} key={d.messageId}><span className="lane-label">{laneNames[d.lane]}</span><h3>{d.action}</h3><p>{d.reason}</p><blockquote>“{d.evidence}”</blockquote><button className="text-button" onClick={() => setFocused(d.messageId)}>Inspect original ↗</button></article>)}</div>)}</> : <div className="empty-state"><div className="radar">↗</div><span className="eyebrow">A LITTLE LESS MENTAL BAGGAGE</span><h3>Eight messages.<br/>One clear way forward.</h3><p>Let the agent find what needs you now,<br/>what can wait, and what’s just noise.</p><div className="empty-lanes">{lanes.map(l => <span key={l} className={l}>{laneNames[l]}</span>)}</div><div className="safety-note">◈ &nbsp; A plan first. Your approval always.</div></div>}</section></div>
    </main><footer><span>BUILT WITH INTENTION. POWERED BY YOUR JUDGMENT.</span><span>Inbox Flight Deck · Proof of concept</span></footer>
  </div>;
}
