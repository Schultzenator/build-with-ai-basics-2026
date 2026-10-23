---
doc: prd
status: approved
approval_basis: user delegated product decisions and implementation
---
# Inbox Flight Deck — Product Requirements

Source: `scope.md > The Unique Kernel`, `The Core Loop`, and `The POC Boundary`.

## The Core Journey
1. Open the app; see a fictional eight-message inbox and an honest engine indicator.
2. Choose rehearsal or live Gemini and optionally paste a replacement inbox (blank-line-separated messages).
3. Click Make a plan; see loading and then categorized proposal cards with one decision per message.
4. Inspect original text and an exact evidence quote; deselect or change a proposed category.
5. Apply selected decisions. See actual board counts, remaining inbox messages, an activity receipt, and export/undo controls.
6. Export a Markdown action brief. Undo restores the previous board; reset restores the sample session.

## Screens and Layout
One responsive desk: masthead and engine controls; hero with current counts; inbox/source column; wider plan/board column; activity strip. Narrow screens stack the columns. Import is a labeled expandable form.

## Look and Feel
Agent-selected under delegated authority: cream background, off-white cards, ink typography, orange primary action, green ready state, monospace metadata, serif headline. No external fonts/assets. Decorative flight path drawn in CSS/SVG. Interface and submitted materials in English.

## Features and Behavior
### Source Inbox
Sample messages are explicitly fictional. Paste text to replace the session; trim empty blocks and reject over 20 messages or 24,000 total characters. Source text remains visible. Import clears old plans/history only after deliberate submit.

### Evidence-backed Plan
Each proposal has messageId, lane (`now`, `next`, `waiting`, `archive`), action, rationale and verbatim quote. Reject plans with unknown/duplicate/missing IDs or invented evidence. Changing an input or engine invalidates the old proposal. Never quietly substitute rehearsal output after a live failure.

### Review and Apply
All cards start selected. Checkboxes choose which changes apply, and category dropdowns allow correction. Apply is disabled for zero selected cards. Selected messages leave the inbox and enter their chosen board lane. Unselected messages remain untouched. No reply is sent and no external mailbox is connected.

### Board, Undo and Export
Board survives reload in this browser, within a single tab workflow. A bounded history enables undo, including after reload. Export includes chosen actions and evidence; archive entries remain auditable. No artificial time-saved metrics.

## States and Boundaries
- Empty inbox: explain completion and invite reset/import; planning disabled.
- Planning: loading indicator; prevent overlapping operations and edits.
- Failure: readable error, retain source messages, enable retry or an explicit switch to rehearsal.
- Missing key: live mode unavailable with setup explanation; default to rehearsal.
- Storage unavailable/corrupt: fall back to a fresh in-memory session with a visible notice.
- User and model text render as text, never executable HTML.

## Acceptance Criteria
- Sample plan covers every inbox message with valid source evidence.
- Apply a subset: board and inbox counts reconcile; undo exactly restores the prior state.
- Reload preserves board and undo history; reset returns to eight sample messages.
- Invalid input/provider output cannot change the board.
- At 390px and desktop widths, controls remain usable without horizontal overflow.
- Typecheck, unit/API tests, production build and browser core journey pass.

## Product Decisions
Owner chose TS/Node, small scope, planning first, public MIT repo and owner-recorded video. Concept, layout and interaction details are agent choices under that delegated scope. No learner review is claimed.

## What We're Building
The journey and acceptance criteria above.

## Deferred From the POC
Mailbox sync, scheduling, multi-user collaboration, cloud storage and external actions require accounts/connectors beyond the small proof.

## Non-Goals
No automatic sending/deletion, no inbox credentials in the browser, no autonomous execution of model-supplied tools.

## Open Questions
Whether the available Gemini credential/model can run successfully is verified in the build, and honestly recorded. Video URL is supplied by PW later.
