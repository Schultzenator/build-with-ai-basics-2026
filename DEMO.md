# Demo recording guide — owner/PW

Target: **2:00–2:30**, English screen recording, 1080p, with the functioning app visible. Upload publicly to YouTube or Vimeo. The video has not been recorded by the agent.

## Setup

Start with the README's three commands. Open http://localhost:3000 in Chrome. Use a clean browser window, hide credentials/notifications, and reset the sample. At 1440px, 100% zoom is suitable; scroll to show evidence and actions clearly. Optionally record at 1280×900 with 110% zoom for larger text.

For a real AI demo, configure the server-side Gemini key and select **Live Gemini**. Test once immediately before recording. Never display `.env`, terminal environment values, or API credentials. Recording in rehearsal is useful for practice, but it must be described as rules, not as live AI. Prefer showing live inference in the final hackathon video.

## Shot list

| Time | Show on screen | Point to explain in your own words |
| --- | --- | --- |
| 0:00–0:15 | Sample inbox and app name | Specific audience: a solo consultant juggling blockers, requests and newsletters. |
| 0:15–0:35 | Select Live Gemini; click Make a plan; show actual loading and result | Agent proposes one decision per message. If trimming waiting time, mark the cut honestly. |
| 0:35–1:00 | An urgent action, quote, then Inspect original | Every source quote is checked against the original; judgment still belongs to the person. |
| 1:00–1:25 | Uncheck the newsletter; optionally change one category; Apply 7 decisions | Selected decisions move to the board, and one message stays in the inbox. |
| 1:25–1:45 | Board lanes; Export brief; open downloaded Markdown | A real artifact with actions, reasons and evidence. |
| 1:45–2:05 | Reload, then Undo batch; counts return to 8/0 | Stored workspace and reversible batch execution. |
| 2:05–2:25 | Public repo, planning docs and app map | New project, plan-first workflow, what you personally learned. |

This is a shot list, not a claim about the owner's learning. Use your own account of the process and what changed your thinking.

## Recording checks

- Keep below 3 minutes; aim for at least 1 minute as requested by the event overview.
- Show working behavior rather than a slide-only pitch.
- Keep the engine badge visible when discussing AI. Do not present rehearsal as LLM output.
- Make small text legible; pause on the source quote and before/after counts.
- Use no third-party music or assets without permission.
- Open the uploaded YouTube/Vimeo link in a logged-out window and verify it is publicly visible and playable.
- Paste its URL into `SUBMISSION-KIT.md` and Devpost. The repository URL does not replace the video.

## If live inference fails during recording

The app displays a readable error without changing the inbox. Check quota, model access and network. You can explicitly switch to rehearsal to continue demonstrating UI behavior, but label that part accurately and include working live inference in the final recording if pitching the LLM agent.
