---
doc: checklist
status: approved
approval_basis: user authorized complete autonomous build
---
# Build Checklist

Build mode: fast, adapted to explicit owner delegation. Agent verification replaces interactive pauses for this delivery; no learner feedback is fabricated.

## Slices
- [x] **1. Inspect a source-backed triage plan**
  Becomes usable: App loads sample inbox and generates a reviewable rehearsal plan.
  Why now: Proves the distinctive evidence kernel through the full browser/server path.
  PRD ref: `prd.md > Source Inbox`, `Evidence-backed Plan`
  Spec ref: `spec.md > Components`, `External Services and Dependencies`
  Build: Bootstrap app, validated input/planners/API and source/proposal interface.
  Verify (mechanical): Typecheck, planner/API tests and production build.
  Learner check: Load sample, request plan, compare an action with its source quote.
  Commit: `Build evidence-backed inbox triage preview`
- [x] **2. Apply decisions, export and undo**
  Becomes usable: Selected proposals become local board actions; undo restores inbox.
  Why now: Closes the demonstrated loop without external inbox effects.
  PRD ref: `prd.md > Review and Apply`, `Board, Undo and Export`
  Spec ref: `spec.md > Data Model`, `Verification`
  Build: Board transactions, storage, reset, import and brief export; live inference smoke.
  Verify (mechanical): Board tests; browser journey, reload, export, undo; live smoke separately.
  Learner check: Exclude one decision, apply, export, reload, undo.
  Commit: `Complete reviewed board workflow and verification`
- [x] **3. Prepare public source and submission handoff**
  Becomes usable: New reviewer can launch in three steps; PW can record and submit.
  Why now: Package verified behavior and expose planning evidence.
  PRD ref: `prd.md > Acceptance Criteria`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`
  Build: README, MIT, demo instructions, submission kit, app map, work state; audit and publish.
  Verify (mechanical): Full checks, secret/history audit and anonymous GitHub access.
  Learner check: Follow README, record 1–3 minute video, fill final form and submit.
  Commit: `Prepare hackathon submission and public handoff`

## Hands-on Checkpoints
- [ ] Owner hands-on exploration — reserved for PW before recording; not performed by the agent.

## Final Review
- [ ] Owner confirms ready after recording — pending owner action, separate from agent implementation completion.

## Code Tour and App Map
- [x] Reference route and concrete verification lesson documented in `devpost/app-map.html`.
- [ ] Optional owner learning reflection — not performed; no reflection authored on their behalf.

Activity and evidence: reference-only app map generated from code snapshot 851331b; opened in Chrome with JavaScript disabled. Route: App.tsx makePlan → agent.ts validatePlan → board.ts applyDecisions/undoSession. Concrete practice: convert “only selected decisions apply” into a subset/undo invariant and test it in pure functions and the browser. No interactive tour, edit, or learner reflection was performed.

## Revisions

- Gemini default changed from 2.5 Flash to 3.8 Flash: the provider returned 404 for new-user 2.5 access and explicitly recommended 3.8. Real 3.8 inference passed with eight exact source quotes validated (10,995 ms).
- Sandbox TMPDIR points outside writable roots; runner commands use TMPDIR=/tmp. This is an environment adaptation, not an app dependency.
