---
doc: spec
status: approved
approval_basis: user specified TS/Node and delegated implementation choices
---
# Inbox Flight Deck — Technical Spec

## How This Works, In Plain Language
The browser holds a small local inbox and board. A Node server asks Gemini to propose one decision per message. The server checks every ID and quote before returning a preview. The browser applies only the decisions selected by the person. Rehearsal mode uses transparent rules and makes no model call.

## The Core Journey Through the System
`prd.md > The Core Journey`: browser inbox → POST `/api/plan` → server validates input → selected planner → output/evidence validation → review cards → pure board transaction → browser storage and downloadable brief. Undo restores a saved snapshot.

## Stack
- Node 22+, TypeScript strict mode, React, Vite, Express, Zod. Exact installed versions recorded in package-lock.json.
- Node built-in test runner via tsx; Playwright for real browser verification.
- Native fetch for Gemini: no AI SDK required.
- References: https://nodejs.org/docs/latest-v22.x/api/ ; https://react.dev/ ; https://vite.dev/guide/ ; https://expressjs.com/ ; https://zod.dev/ .

## Where It Runs and How Someone Tries It
Local single-user desktop browser. `npm ci`, `npm run build`, `npm start`; open http://localhost:3000. Development: `npm run dev` (Vite middleware served by the same Node process). Node loads an optional `.env`; never bundle keys into browser code. Rehearsal always works without a key. Live requires `GEMINI_API_KEY`; `GEMINI_MODEL` defaults to `gemini-2.5-flash`, configurable if unavailable to the account.

Public repository target: https://github.com/Schultzenator/build-with-ai-basics-2026 . Video is required and owner-provided; no deployment planned.

## Look and Feel
Implements `prd.md > Look and Feel`: CSS variables, system sans and Georgia serif, monospace labels, 12-column desktop layout, stacked mobile; CSS/SVG only. Keyboard focus, semantic buttons, live status/error regions, accessible labels and reduced-motion support.

## Components
- `src/shared.ts`: Zod input/output contracts, message and decision types.
- `src/agent.ts`: evidence validator, deterministic rehearsal planner, bounded live Gemini call.
- `src/board.ts`: pure apply/undo, session validation, Markdown export; serves Review and Apply and Board, Undo and Export.
- `src/server.ts`: API, request-size and local origin/host checks, production static serving or Vite development middleware.
- `src/App.tsx`: single desk, source viewer, proposal editor, board, import/export and status.

## Data Model
Message `{id, sender, subject, body}`. Decision `{messageId, lane, action, reason, evidence}`. Plan `{decisions}`. Snapshot `{inbox, board}`; board entries retain full message and applied decision. Session `{version:1, current, history}` with bounded history. Validate persisted shape and invariants before use. Model plan is ephemeral and never survives reload. Storage key `flight-deck:v1`; browser-only persistence, resettable. No server persistence/logging of messages or API keys.

## File Structure
```
src/{shared,agent,board,server,sample}.ts
src/{App,main}.tsx
src/style.css
tests/{agent,board,api}.test.ts
tests/browser.mjs
devpost/{scope,prd,spec,checklist}.md
devpost/app-map.html
README.md / DEMO.md / SUBMISSION-KIT.md / WORK-STATE.md
```

## External Services and Dependencies
POST `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, key in `x-goog-api-key` header, systemInstruction and user JSON contents; generationConfig uses `responseMimeType: application/json`, `responseJsonSchema` for decisions, bounded output and timeout. Parse candidate text; validate against Zod and original messages. https://ai.google.dev/api/generate-content and https://ai.google.dev/gemini-api/docs/generate-content/structured-output . Availability, billing and rate limits vary by account; no specific quota/cost promised. One call per click, at most one live request in flight on this local server; no automatic retries. Input content goes to Google only after explicitly selecting live mode and requesting a plan.

## Important Failure Modes
- Missing credential / quota / network / timeout → clear error, keep inbox, never silently downgrade.
- Hallucinated quotes / bad IDs / malformed JSON → reject plan before board mutation.
- Corrupt or blocked local storage → visible notice, safe fresh in-memory session.

## What Was Simplified and Why
Text import replaces OAuth; browser storage replaces accounts; human-approved local board replaces destructive mailbox operations. These retain the inspectable triage kernel.

## Decisions and Open Issues
Architecture decisions are agent implementation choices within the explicitly delegated TS/Node scope. No learner uncertainty was supplied. Real engineering uncertainty: live model access; test the existing credential with fictional data and record the outcome without exposing credentials. Workspace sandbox prevents writing the requested HCTN path; build in a new empty child directory and provide relocation instructions.

## Verification
Unit tests cover invalid IDs/evidence, provider failures, selection/apply/undo and persisted data. API tests use an ephemeral local server and mock the provider. A real browser performs plan → source review → subset apply → reload → export → undo, plus import/errors and narrow viewport. A separate opt-in live smoke checks real inference. No claim of user hands-on review.
