# Submission kit — PW / Schultzenator

Agent implementation handoff: **COMPLETE after the verification and publication evidence in WORK-STATE.md**. Submission itself remains with the owner/PW. Final video URL is intentionally owner-provided.

## Where and when

- Event: https://learn-ai-basics.devpost.com/
- Official rules, checked at build start: https://learn-ai-basics.devpost.com/rules
- Deadline: **Monday, October 26, 2026, 5:00 PM EDT = 21:00 UTC = 22:00 Warsaw**.
- Account: **Schultzenator**. Join the hackathon if not already registered, then create/complete the project entry.
- Public source: **https://github.com/Schultzenator/build-with-ai-basics-2026**
- License: MIT.
- Video URL: **[PW: REPLACE WITH PUBLIC YOUTUBE OR VIMEO LINK]**
- App URL: local application; no hosted deployment claimed. Use repository as code link, not as a live demo URL.

The authenticated submission form was not accessed in this session. The sections below map to common Devpost fields; follow the actual current labels and any required prompts. PW supplies truthful personal/organization details and exit-survey answers.

## Project name

Inbox Flight Deck

## Elevator pitch

An inbox triage agent that turns message chaos into a source-backed action plan you review, apply and undo.

## About the project — paste-ready draft

The owner explicitly requested this draft. Review it for accuracy before publishing, and add personal learning reflections in your own words.

### Inspiration

For an independent consultant, one inbox can hold a launch blocker, a request for next week, a dependency on a client, and a newsletter. The practical problem is deciding what deserves attention while keeping the original context close enough to check.

### What it does

Inbox Flight Deck turns sample or pasted messages into four lanes: Do now, Up next, Waiting, and Filed away. In live mode, a Gemini agent proposes a concrete next action and rationale for each message. Every proposal includes an exact source quote that the server verifies against the original message body.

The person reviews the plan, changes categories if needed, and selects which decisions to apply. Those decisions move to a local action board; unselected messages stay in the inbox. The board survives a reload, exports a Markdown brief with evidence, and supports undoing the last batch. The proof of concept never sends replies or deletes mail.

### How it was built

The project started in a new empty folder during the submission window. Codex was the coding agent. The Devpost Learn Skill Pack was installed and used to structure scope, product requirements, technical specification, implementation slices, verification and shipping. Planning documents were committed before application code. The owner delegated concept selection and implementation; workflow adaptations are disclosed in the repository.

The stack is TypeScript, Node.js, Express, React, Vite and Zod. A server-side Gemini call returns structured decisions. Validation rejects invented or duplicate message IDs, missing decisions and quotes that do not occur in the source. A separate deterministic rehearsal mode is visibly labeled and works without credentials. Source and fictional sample data were created for this project; standard dependencies and the required Skill Pack are disclosed.

### Challenges

One real integration issue was model availability: the initial Gemini 2.5 endpoint rejected new-user access and recommended Gemini 3.8 Flash. The model was changed and checked with a real API call before handoff. Another design constraint was separating an AI proposal from execution: selecting and applying a batch is a distinct human action, and the prior state remains available for undo.

### Accomplishments

The implemented loop runs from inbox to validated plan to selected board changes, export and undo. Verification covers strict typechecking, planner/API/transaction tests, a production Chrome journey, mobile layout and a real Gemini-backed browser journey. Exact results are documented in the repository rather than presented as performance or user-study claims.

### What was learned

**[OWNER: replace this paragraph with your own truthful reflection before submission. Suggested topics to address: which planning decision mattered; what you personally reviewed or changed; what the model-access issue taught you. Do not claim hands-on steps you did not perform.]**

### What's next

Possible extensions are a read-only mailbox connector, better handling of relative deadlines, and richer review controls. They are not part of the current proof of concept.

## Built with

TypeScript, Node.js, React, Express, Vite, Zod, Google Gemini API, Gemini 3.8 Flash, Codex, Devpost Learn Skill Pack, Playwright.

## Testing instructions

Requires Node.js 22+. From the public repository: `npm ci`, `npm run build`, `npm start`; open http://localhost:3000. Rehearsal works without credentials. Make a plan, inspect a quote, uncheck one proposal, apply seven decisions, export, reload, and undo. Configure server-side `GEMINI_API_KEY` in `.env` and restart to enable Live Gemini. Never paste a key into Devpost. The recorded video must show the working project because reviewers may judge without running the repository.

## Images

Use the actual app screenshots in `docs/screenshots/`. Recommended: `01-inbox.png`, `05-live-gemini.png`, and `03-board.png`. They contain fictional sample data. The screenshots are evidence, not a replacement for the video.

## PW's final checklist

- [ ] Open the repository logged out; verify planning docs and MIT license are visible.
- [ ] Follow the three startup steps and perform the core loop yourself.
- [ ] Read the workflow adaptations; confirm submission statements match your actual participation.
- [ ] Replace the personal learning placeholder; complete all required form and exit-survey answers truthfully.
- [ ] Record 1–3 minutes in English, below 3 minutes, showing the functioning app; see `DEMO.md`.
- [ ] Upload publicly to YouTube or Vimeo and check playback logged out.
- [ ] Replace the video placeholder above and paste the real video/repository URLs into Devpost.
- [ ] Confirm entrant details and eligibility. Rules allow individuals, teams and organizations subject to country/conflict exclusions; this does not certify any particular organization. An organization/team must authorize its representative.
- [ ] Submit before the deadline and retain confirmation. Keep source and video available through judging ending October 30, 2026 at 5:00 PM EDT.

No Devpost entry, learner survey, organization representation, recording or final submission was completed by the agent.
