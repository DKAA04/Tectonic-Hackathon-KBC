# KBC Moment — verification and recording runbook

## Current status

- Accepted source remains `7e1e5f9da82f90e830d395a39b0636c2886bdcfd` on `feature/frontend`.
- No application code was changed for this rehearsal. No new feature, dependency, Supabase SDK, key, auth flow, deployment or merge was introduced.
- Local preview checked: **http://127.0.0.1:5173**, HTTP 200, development fixture mode enabled.
- The rehearsal below passed against that running Vite fixture adapter using isolated HTTP cookie sessions. It did not change the operator's browser cookie/session.
- Browser automation inventory returned no connected browsers. Manual Chrome recording with the operator's existing screen recorder can proceed. Visual clicks, actual incognito behavior, browser download and capture framing are **pending operator verification**. No video has been recorded by the agent.
- Public integrated app URL: **awaiting Parrot/operator**. Do not mistake `https://jevuhcihgcevihbvelbr.supabase.co` for the deployed frontend URL.
- Expected deployment architecture: browser → Railway FastAPI → Supabase PostgreSQL. Frontend traffic stays on relative `/api`; database credentials remain on the backend.

## Rehearsal results actually observed

The following output was captured from the local fixture HTTP rehearsal at **2026-09-30 21:34:49 CEST** (19:34:49 UTC). All 12 checks passed; exit code 0. Angel accepted these results. Do not rerun unchanged tests or hold up deployment for this documentation/rehearsal commit. The saved `rehearsal/fixture-last-result.txt` contains only the timestamp and static result messages; it was inspected for credentials, cookies and session tokens before inclusion.

```text
PASS initial question and two permitted evidence items
PASS confirm 15 November 2026; address and home-cover preparation returned
PASS briefing content generation excludes session IDs, CSRF and evidence IDs (browser download not exercised)
PASS change to 22 November 2026; advisor context and version match
PASS existing cookie recovers corrected context without new bootstrap (HTTP refresh equivalent)
PASS 10 November help date suppresses steps; Help me now resumes them
PASS signal consent removes synthetic signals and preserves explicit intent
PASS cancellation withdraws obsolete steps in customer and advisor contexts
PASS advisor consent revocation returns exact 403 ADVISOR_CONSENT_REQUIRED
PASS personalization revocation hides evidence/help and removes exported preparation
PASS independent HTTP cookie sessions remain isolated (actual incognito browser pending)
PASS tentative signal revocation removes the inference
REHEARSAL COMPLETE: local development fixtures only; no live deployment or visual recording verified.
```

The advisor 403 above is the expected consent-denial result, not a failure. No reproducible application defect was found at the tested HTTP/presentation-function boundary. The fixture is not evidence of a working Railway/Supabase deployment or PostgreSQL persistence.

## Capture preparation — operator actions still to perform

1. Open Chrome manually. Until the public app URL is supplied, open **http://127.0.0.1:5173** for a clearly labeled backup recording and leave **Development fixtures** visible. Keep the existing fixture server running; restart it only if unavailable, using the command in `SESSION_RESTART_HANDOFF.md`. Once supplied, use the verified integrated HTTPS app for the integrated take. Never present a fixture recording as the integrated app.
2. Use the existing screen recorder to capture only the intended app/browser window. Avoid capturing terminals, browser developer tools, credentials or unrelated tabs.
3. Start at 100% browser zoom in a roughly 1440×900 or larger window. For a 1920×1080 capture, try 110–125% zoom if needed, retaining both desktop columns. Check the actual preview rather than assuming a percentage is readable.
4. Make a 10-second test capture with narration. Play it back to check text, microphone, cursor visibility and the absence of clipped drawers. No recording configuration has been changed automatically.
5. For the integrated take, complete the live acceptance checks below. For the fixture backup, manually rehearse the same visible controls and record results as fixture-only observations. Then use **Reset demo → Start a new demo** in the dedicated recording browser to get an unambiguous opening state. The saved HTTP rehearsal uses separate cookies and does not reset this browser session.
6. Keep the prototype/synthetic label visible. Use a steady cursor and pause briefly after a server-confirmed update. Avoid speaking over loading or error states.
7. Target **2 minutes 35 seconds**, with five seconds of closing margin. The delivered video must be strictly **under 3 minutes**. Measure the exported file's duration and watch the whole result before delivery.
8. Secure the complete functional recording first. Any optional intro must fit inside the same under-three-minute total. No intro or brag work has been started.

### Manual fixture backup while deployment continues

Use the same 2:35 shot list below, with these narration substitutions inside the existing time slots:

- **0:00–0:15:** “This is the local development-fixture backup of KBC Moment. Example signals suggest a move; Alex decides what is true.” Keep the fixture label visible throughout the take.
- **1:20–1:35:** “The corrected date survives refresh in this running local fixture server. This does not demonstrate database persistence.”
- **2:20–2:35:** “This synthetic fixture backup shows the interaction flow. It does not verify Railway, Supabase or PostgreSQL. No banking transaction, address update or insurance purchase occurs.”

Save the backup as `kbc-moment-fixture-backup-2026-09-30.mp4` (or the recorder's native video format). Save the later integrated take separately as `kbc-moment-integrated-2026-09-30.mp4`. Do not overwrite or relabel the fixture backup as integrated. Play the complete export, verify duration is **less than 3:00**, readable controls, audible narration, visible fixture/synthetic labels and no unrelated windows or secrets.

Record these facts after manual review; leave unobserved items pending:

```text
Mode and actual URL:
Operator and local time:
Chrome version and viewport:
Manual checks passed / failed / pending:
Export filename and measured duration:
Full playback reviewed (text, sound, framing, labels):
Remaining limitations:
```

## Final take — 2:35 shot list and narration

These are planned actions and proposed narration, not claims that the integrated app has already passed.

| Time | On-screen action | Suggested narration |
| --- | --- | --- |
| 0:00–0:15 | Show the initial question. Open **Why this moment?**, display the two synthetic signals, then close the drawer. | “KBC Moment starts with a question, not an assumption. These example signals might suggest a move, but ordinary shopping could explain them too. Alex decides what is true.” |
| 0:15–0:35 | **Plan my move** → choose **15 November 2026** → **Confirm & build my plan**. Wait for the returned plan. | “Alex confirms a date. The shared context now reflects explicit intent, and returns two relevant preparation steps.” |
| 0:35–1:00 | **Open checklist** → tick one preparation item → close. **Prepare questions** → show the dated questions → close. | “One step helps Alex prepare address updates. These ticks are an unsaved draft; no address is changed. The other prepares questions about home cover, without claiming cover or buying a product.” |
| 1:00–1:20 | **Change date** → **22 November 2026** → save. Show the advisor column, then the **Advisor** view if useful. | “Plans change. Alex corrects the date once. The read-only advisor preview is fetched from the same session and reflects the correction.” |
| 1:20–1:35 | Refresh the browser. Show **22 November 2026** still present; return to **Customer** if necessary. | “A refresh recovers the existing session. The corrected date remains.” |
| 1:35–2:00 | **Cancel move** → **Confirm cancellation**. Pause on withdrawn customer steps and the updated advisor summary. | “When the move is cancelled, the accepted update withdraws obsolete suggestions from both views. Old signals do not override Alex’s correction.” |
| 2:00–2:20 | **Privacy & consent** → turn **Advisor preview** off → close drawer → choose **Advisor**. | “Alex can also withdraw permission for the advisor preview. It becomes unavailable rather than retaining the previous details.” |
| 2:20–2:35 | Hold the consent-unavailable view or return to the customer workspace. | “This is a synthetic hackathon prototype: no real banking transaction, address update or insurance purchase. Its central idea is simple—correct once, and the next step and next conversation stay consistent.” |

Use the persistence narration only after the integrated live refresh check has passed. Fixture state survives refresh only while its development server runs; do not describe that as database persistence.

## Live acceptance checks once the public HTTPS URL arrives

Record the actual URL, deployed commit if available, test time and browser. Start with a dedicated synthetic session.

- [ ] The public app loads over HTTPS, visibly identifies synthetic/demo scope and is not labeled Development fixtures.
- [ ] Initial question/evidence match the returned tentative state.
- [ ] Confirm **2026-11-15**; both returned preparation cards appear with human-readable dates.
- [ ] Address drawer opens; checklist ticks work and are labeled unsaved draft progress.
- [ ] Home-cover drawer opens with questions tied to the confirmed date; it makes no purchase or coverage claim.
- [ ] Change the move to **2026-11-22**; advisor date/state/version reflect the accepted response. Old draft ticks are invalidated.
- [ ] Refresh recovers the same session and corrected date without starting a new demo.
- [ ] **Help at the right time → Manage**: choose **2026-11-10**. The response suppresses preparation steps. No external reminder is claimed.
- [ ] **Help me now** clears the reminder and restores permitted returned steps.
- [ ] Turn **Synthetic signals** off. Signal evidence disappears, while explicit confirmed intent remains. In a separate tentative test session, removing signals removes the inference.
- [ ] Use **Save briefing**. Inspect the actual downloaded text: current date/situation/permitted preparation only, no CSRF, session ID, credentials or evidence. Nothing is sent to an advisor.
- [ ] Cancel the move. Customer cards and stale drafts disappear; advisor shows cancelled state with no obsolete steps. Refresh preserves cancellation.
- [ ] Revoke advisor consent. The preview becomes unavailable; expected endpoint result is **403 `ADVISOR_CONSENT_REQUIRED`**. No stale advisor context remains visible.
- [ ] Toggle personalization off: no evidence or preparation suggestions. Explicit customer correction remains. Re-enabling personalization must not resurrect the cancelled move.
- [ ] Open a genuinely separate incognito/private browser session: it should require its own Start demo, receive its own synthetic context, and remain independent of changes/resets in the ordinary browser. Separate ordinary tabs share the same cookie and are not an isolation test.
- [ ] Inspect desktop layout at **1440×900** and mobile at **390px**. Verify drawer visibility, controls, dates, horizontal overflow and focus/close behavior.
- [ ] Record and review the integrated app only after these checks pass or exact limitations are explicitly agreed.

## Reproducible defect handoff

For any failure, capture:

```text
URL and mode:
Browser/viewport and local time:
Starting situation/version/consent (no credentials):
Exact actions and date inputs:
Expected result:
Observed result:
HTTP method/path, status and safe error code/message if available:
Does it reproduce after a clean synthetic session?:
Frontend / backend / not yet classified:
```

Never include cookies, CSRF tokens, database credentials or secret configuration in the report. Never hide a live failure by enabling fixtures. Backend failures go to Parrot with reproduction details; backend files and deployment configuration stay untouched.

Only if a frontend defect is reproduced: fix it on `feature/frontend`, run `npm.cmd test` and `npm.cmd run build`, inspect the diff, commit only the intended frontend fix, push, and report its SHA for Parrot to integrate. Do not include local handoff/runbook documents in a code-fix commit unless explicitly intended. Do not merge main, deploy or submit.
