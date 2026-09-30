# Tectonic × KBC — execution plan

**30 September 2026 · Leuven · Europe/Brussels (CEST)**
**Operator:** Angel, working alone with Parrot + Windows + iPad.
**Plan established around 19:00. Build cutoff: 22:30. Target final submission: 22:10.**

This is a proposed product and execution plan grounded in the supplied guide, tonight’s schedule, the current repository, and your earlier preparation. Product choices and targets below are recommendations, not organizer requirements or measured results. Organizer instructions received tonight take priority.

## 1. Start here: the next ten minutes

1. **Confirm solo eligibility with an organizer in person.** Earlier preparation shows Pato Pato Ganso with one member; the public FAQ describes teams of 3–4. Ask whether your registered solo entry can qualify, and how to correct registration if necessary. Also confirm 22:30 is the submission cutoff. Continue technical setup while this is resolved.
2. **Open Builderbase → your team → overview.** Inspect the actual submission fields, video/link requirements and current KBC resources. This plan has not verified those signed-in fields tonight.
3. **Set up the mandatory Aikido connection now.** Use the event link in section 8 and authorize the intended repository. Start the first meaningful code audit as soon as the first backend is pushed.
4. **Give Parrot the backend prompt in section 12.** First output: API contract, minimal server, deployment skeleton and synthetic fixtures. Push the shared contract before Windows invents its own interface.
5. **Give Windows ten minutes to become productive.** Follow `WINDOWS_SETUP_AND_FRONTEND_HANDOFF.md`. If setup exceeds ten minutes, make it the testing/recording laptop and build on Parrot.

Keep the iPad on this schedule, the submission checklist and the pitch script. Limit each new research question to five minutes and require it to change a build or presentation decision.

## 2. What is verified, and what changes from earlier handoffs

| Item | Verified state / consequence |
|---|---|
| Actual challenge | A scalable personalization approach: understand customer needs and timing, adapt experiences, work across products/channels, and explain a path to more than 2.3 million customers. Guide pp. 3–4. |
| Actual repository | `DKAA04/Tectonic-Hackathon-KBC`, branch `main`, clean local checkout tracking `origin/main`. GitHub and local checkout show one commit, `f454a77`, at 18:38 CEST, containing only `HACKATHON_PROJECT_HANDOFF.md`. |
| Repository visibility | **Private**, observed directly on GitHub tonight. The guide requires public access until judging ends. Change it before submission after reviewing contents/history for secrets. |
| Existing backend assumption | There is no application in this repository yet. Earlier references to preserving a FastAPI backend describe the separate Handover/Tenant Guard project. Build this event’s application here; do not assume its routes, tests or business logic exist. |
| Parrot | Your terminal logs confirm Git, Node 22.23.3/npm 10.9.9, Python 3.13.5, Codex, FFmpeg, Archify, brag, HyperFrames browser and Railway sign-in. Application build, DB connection and deployment are still unverified. |
| Windows | Earlier chat showed Git missing. Tonight’s installation status has not been verified. The setup handoff specifies its frontend role, but does not provide Windows hardware specifications. |
| Required presentation | A demo video **under three minutes**, description, GitHub link and Aikido before/after screenshots. A 20-second brag promo alone does not demonstrate enough of the solution. Guide p. 11. |
| Security | Aikido AI Code Audit is mandatory and worth **10%**. Other criterion weights are not provided. Guide pp. 6–7. |
| Submission lock | Once submitted as final, no code or submission edits. Plan all pushes, fixes and evidence before that action. Guide p. 12. |

Tonight’s photo: opening 18:00; building 18:30–22:30; food pickup 19:30–20:30; reception 22:30–23:45. Use the four-hour build window, not the website’s broader event hours.

The aim tonight is qualification. The official event information says 32 teams qualify, 16 per track, for the 20 October final. Winning cannot be guaranteed; this plan maximizes demonstrable value within the remaining time. [Event FAQ](https://www.tectonicconf.eu/faq)

## 3. Recommended concept: KBC Moment

**Pitch:** “Correct once. Be understood everywhere.”

KBC Moment is a shared, customer-correctable understanding of a life situation. It combines explicit intent and consented signals, decides whether to help, ask a question or stay silent, and keeps the customer and advisor views consistent after a correction.

**Ideal experience:** “My bank helps me prepare for a change in my life, explains what it thinks is happening, and immediately adapts everywhere when I tell it something different.”

### Why this is a promising angle

KBC already describes Kate as proactive across more than 140 situations, with generative AI and actions subject to customer approval. Proactivity, a chatbot, consent and life-event assistance alone are weak originality claims. [KBC’s Kate overview](https://newsroom.kbc.com/kate-five-years-and-five-milestones)

Our proposed emphasis is **visible correction, explicit uncertainty and continuity across channels**. Show the mechanism working, including when help should stop. This is a differentiation hypothesis; we have not established that KBC or other competitors lack similar internal capabilities.

### The 90-second product story

1. **Signals:** a clearly labeled synthetic customer, Alex, has saved a moving-related goal and has ambiguous spending signals. The UI labels the situation as tentative and cites the actual fixture events used.
2. **Clarify:** “Are you planning a move?” Alex confirms a date. The backend records confirmed intent and builds a short readiness plan across banking administration and insurance preparation. No financial product purchase or real bank transaction occurs.
3. **Deliver help:** show one useful next step, with its reason and timing. The customer controls when to be reminded. The advisor preview reads the same situation version.
4. **The memorable moment:** Alex chooses **“The move is cancelled.”** One backend update withdraws obsolete suggestions; both customer and advisor views show the changed state. Show the before/after difference visibly.
5. **Trust:** revoke personalization consent. The API returns a suppressed decision and both views stop using the revoked signals. Refresh the browser to prove it persists.

Keep the interface centered on the person’s situation and useful next step. Put technical traces and evaluation behind a separate “How it works” view for judges.

### Build order and scope

| Priority | Scope | Completion evidence |
|---|---|---|
| Essential | One moving-life-event journey, synthetic events, confirmation/cancellation, persisted state | Real API round trip survives refresh |
| Essential | Customer view plus a read-only advisor **demo preview** | Both retrieve the same backend version; no independent hardcoded result |
| Essential | Decisions `ask`, `help`, `suppress`; reasons linked to evidence | Ambiguous input asks; cancelled/revoked state suppresses |
| Essential | Per-session demo isolation, bounded input, safe rendering | Cross-session access fails; backend tests cover it |
| Essential | Aikido evidence, README, reproducible demo, <3-minute video | Submission checklist complete |
| After essentials | A second intent fixture, such as a first job | Reuses the same engine contract; no separate app |
| Optional | Natural-language correction with a real model API | Validated structured output; human confirmation; timeout fallback |
| Optional | Magic UI highlight, Archify diagram, short brag clip | Truthful assets generated from working code |

Do not add real banking access, account aggregation, credit decisions, payments, an upload pipeline, a vector database or a multi-service agent system tonight. Those introduce work that is unnecessary to prove this mechanism.

**AI use:** a reliable rules-based decision engine is an honest first POC. If a model connection is already available, use it only to propose a structured interpretation of a customer sentence, then confirm before changing state. Never describe deterministic rules or a mocked provider response as live AI. Codex access does not establish that this application has a funded model API key.

## 4. Deliverable timeline

**Deadlines are fixed gates, not estimates to keep shifting.** If a gate is missed, cut optional scope while preserving security and submission time.

| Time (CEST) | Presentable at the gate | Parrot / coding work | Your human action |
|---|---|---|---|
| Now–19:10 | One-sentence proposition + API contract + ownership | Create shared contracts and backend shell; Windows setup/scaffold | Confirm eligibility/cutoff, inspect Builderbase, connect Aikido |
| 19:10–19:35 | Publicly reachable app shell and `/api/health`; customer layout | First Railway deployment, PostgreSQL connection; frontend fixture view | Test URL from the other laptop; start baseline audit on first meaningful backend commit |
| 19:35–20:05 | Complete customer journey using the real backend | Persist confirmation/cancellation; integrate frontend branch | Record a short rough screen capture; save baseline audit screenshot |
| 20:05–20:35 | Live correction visibly updates customer and advisor views | Add suppression rules, consent controls, session isolation and focused checks | Pick up food during 19:30–20:30; use one bounded build block while away |
| 20:35–20:45 | Demo runs twice without intervention | Fix integration issues; commit stable candidate | Decide whether any optional feature can safely remain |
| **20:45** | **Feature freeze** | No new product scope; repairs and verification only | Begin final narrative and evidence capture |
| 20:45–21:10 | Verified tests, Aikido remediation and measured evidence | Fix findings; rescan; small synthetic benchmark if time | Save before/after evidence; review app in another browser session |
| 21:10–21:35 | 2:30–2:50 narrated demo video + one architecture visual | Produce diagram from actual app; support recording | Record two takes, choose one; do not start a new media toolchain |
| 21:35–22:00 | Complete submission package ready to review | README, final push/deploy, check commit matches deployed version | Make repo public; verify repo/video/demo access and audio; fill draft fields |
| 22:00–22:10 | Final checked submission | Stop all editing sessions before submitting | Submit once when complete; save confirmation and final commit SHA |
| 22:10–22:30 | Buffer if submission is still pending | Resolve upload/access blockers **before final submission** | After final submission, preserve the submitted version unchanged |

### Cut rules

- Windows setup >10 minutes: Windows becomes QA/recording; Parrot builds the frontend sequentially.
- No deployment at 19:35: stop UI polish and repair the simplest one-service deployment. Keep a working local demo for recording; do not imply a public deployment exists if it fails.
- No integrated flow at 20:05: remove natural-language input, second intent and all decorative motion. Keep confirm/cancel buttons and the correction story.
- Any optional AI/provider integration consumes >15 minutes: remove it from the critical path; state the remaining implementation accurately.
- At 20:45: freeze features even if optional components are unfinished.
- Aikido stalled: ask event staff early for help; retain genuine screenshots and do not claim a completed audit. Do not postpone the whole submission without an organizer’s instruction.
- At 21:35: abandon promo editing. Deliver a clean narrated screen recording with correct audio and readable text.

## 5. Architecture and ownership

Keep the locked stack: FastAPI, PostgreSQL, Railway; React/TypeScript/Vite/Tailwind/shadcn; selected Magic UI components. Archify and brag run after the product works.

```text
Browser customer view ─┐
                       ├─ same-origin /api ─ FastAPI ─ PostgreSQL
Browser advisor preview┘                       │
                                              ├─ synthetic event adapters
                                              ├─ consent + situation reducer
                                              └─ ask/help/suppress decision policy

Railway web service: FastAPI + built Vite assets
Railway database service: PostgreSQL
Optional model adapter: bounded intent proposal, never the authority for consent
```

The advisor view is a second-channel simulation within the same demo session. It does not prove production staff identity, entitlements or actual KBC integrations. Say this in the README.

### Proposed repository structure

```text
Tectonic-Hackathon-KBC/
  AGENTS.md                         # short ownership + execution instructions
  README.md                         # judge entry point, run steps, limits
  HACKATHON_PROJECT_HANDOFF.md       # earlier tooling reference; stale app assumptions
  docs/
    EXECUTION_PLAN.md
    API_CONTRACT.md                  # agreed before independent frontend work
    EVIDENCE.md                      # measured results + commit/environment
    PROVENANCE.md                    # libraries, tools, prior preparation used
    architecture.html               # Archify, optional
    security/before.png
    security/after.png
  app/                              # FastAPI + policy + persistence
  tests/                            # policy, session isolation, contract
  fixtures/                         # synthetic only
  frontend/                         # Vite source + package-lock.json
  requirements.txt                  # or one chosen Python dependency format
  Dockerfile
  .dockerignore
  .gitignore
  .env.example                      # names/placeholders only
```

| Owner/device | Branch | Exclusive responsibility |
|---|---|---|
| Parrot | `feature/core` | `app/`, `tests/`, `fixtures/`, shared contract/docs, root config, DB, integration, deployment |
| Windows | `feature/frontend` | `frontend/`, including its lockfile, components and typed API client |
| You / iPad | No concurrent code edits | Product decisions, organizer questions, account approval, actual UI verification, video and submission |

Branch separation alone does not prevent conflicts. Directory ownership and a shared contract are required. Do not run two editing sessions on the same checkout. Pause editing and commit intended changes before switching branches for integration.

### Minimum API contract to agree first

Suggested routes, to be frozen by Parrot before Windows starts its API client:

| Route | Behavior |
|---|---|
| `GET /api/health` | Server readiness; distinguish DB ready from process alive |
| `POST /api/demo/session` | Create isolated synthetic session using a server-generated random session credential |
| `GET /api/context` | Return current session’s situation, evidence, decision, consent and version |
| `POST /api/context/correction` | Validated explicit confirm/cancel/date correction; return updated context |
| `POST /api/consent` | Change allowed synthetic signal usage and recompute decisions |
| `GET /api/advisor-preview` | Read the same session’s situation/version for second-channel demo |

Agree exact request/response JSON in `docs/API_CONTRACT.md`: typed enums, evidence IDs, dates, `version`, and error shape. Use `409` for stale writes if optimistic version checks are implemented. Do not accept arbitrary customer IDs as authorization. Let the server session determine ownership.

In production, use same-origin cookies with appropriate secure/HttpOnly/SameSite settings and protect state-changing endpoints against cross-site requests. Development uses the Vite proxy. Apply consent filtering before interpretation and again before delivering help. Render supplied text as text, bound its length, keep secrets on the backend, and scope reset/reseed to the caller’s session.

### Integration commands on Parrot

After the relevant branch work is committed and the working tree is clean:

```bash
cd "$HOME/Documents/Hackathon/Tectonic Hackathon"
git fetch origin
git switch main
git pull --ff-only origin main
git merge --no-edit origin/feature/core
git merge --no-edit origin/feature/frontend
```

Merge only branches that have actually been pushed. Resolve conflicts deliberately; do not discard changes or force push. Run the backend checks and frontend production build, exercise the combined journey, then:

```bash
git push origin main
```

Both workers then fetch and merge the integrated `origin/main` into their own feature branch before the next chunk. Parrot performs deployment. Confirm whether Railway auto-deploys `main` to avoid unintended duplicate deployments.

## 6. Evidence that supports a strong judging story

| Judging criterion | What judges should see | Evidence to save |
|---|---|---|
| Creativity | Customer correction changes the shared understanding and removes outdated help | Before/after interaction in the actual app |
| Technical ability | Two views use one persisted state; refresh works; errors are handled | Demo, API checks, focused tests, deployment commit |
| Challenge fit | Signals → intent → adapted experience → channels → scalable design | One journey plus architecture explanation |
| Security (10%) | Ownership isolation, consent enforcement, genuine audit/remediation | Aikido before/after, test results, remaining limitations |

### Focused acceptance cases

1. Ambiguous signals produce a question, not a asserted life event.
2. Confirmed intent produces a relevant next step with source evidence.
3. Cancellation withdraws outdated steps in both views and after refresh.
4. Revoked consent suppresses personalization using the revoked signals.
5. Stale signals cannot silently override a newer explicit correction.
6. Repeated event submission does not duplicate actions, if event ingestion is exposed.
7. One browser session cannot read or mutate another session’s state.
8. Invalid/oversized payloads are rejected, and untrusted text cannot inject HTML.

These are completion targets, not tests already passed. Record actual results only.

### Scale without pretending to have deployed for 2.3 million people

- Execute the same policy over a reproducible synthetic batch if time remains. Record dataset size, machine, command, elapsed time and failures. Include database work if the reported metric claims end-to-end throughput.
- Report observed p50/p95 latency only if measured. A tiny test is not a production capacity claim.
- Show that expensive model calls can be restricted to ambiguous cases; deterministic consent/timing rules handle every case.
- Describe the future path: event ingestion, partitioned customer state, idempotent updates, bounded processing, channel adapters, monitoring and tested authorization. Label future components clearly in the diagram.
- If using a capacity illustration: 2.3 million customers × an **assumed** 10 events/day ≈ 266 events/second on average. This is a workload assumption, not KBC telemetry; peaks and headroom need separate measurement.
- Business outcome targets for a future pilot: fewer irrelevant prompts, lower repeated explanations, useful-action completion and time to resolve a corrected situation. Do not invent conversion or savings results.

## 7. Product polish that earns its time

Use a calm, readable interface: one customer situation, one prominent next step, short evidence explanations, visible control to correct or revoke. Start with white/slate surfaces and a restrained teal/blue accent. Mark all data and channel simulations as demo content.

The signature visual is a brief transition showing a correction reaching both views. It should represent a confirmed server update. Do not show fake progress or animated counts that imply unmeasured scale. Make the view readable in a 1080p video and usable on the second laptop.

Use shadcn for controls. Magic UI is optional polish after integration. No dependency or theme overhaul after feature freeze.

## 8. Mandatory Aikido workflow

Guide pp. 6–7 specifies this event link:

[Aikido hackathon access](https://app.aikido.dev/ai-pentests/discounts/hackathon-tectonic-aikido)

1. You complete “Continue with GitHub” and approve access to the hackathon repo.
2. Push the first meaningful backend and run **AI Code Audit**. Save its baseline screenshot before resolving findings; record scanned commit and time.
3. Fix findings in code. Add focused checks for the actual access/control flaw when appropriate.
4. Mark findings resolved truthfully and rerun/verify where available. Save the after screenshot and final scanned commit/status.
5. Include both screenshots in the submission and explain any remaining issues. A pending scan is not a clean scan.

If the baseline is clean, retain the genuine clean result. Never add a vulnerability to manufacture a before/after story. Confirm what the platform scanned; an audit of the initial handoff-only commit is not evidence for the finished application.

Account creation, OAuth access and event-credit activation are human account steps. Code review, fixes, tests and evidence preparation can be handled by Codex after findings are accessible.

## 9. The required video: target 2:40

Use screen recording plus your own clear narration. Test a 10-second recording now: readable UI, audible voice, no notifications or credentials. The installed HyperFrames browser passing doctor does not verify microphone or screen capture.

| Timestamp | Content |
|---|---|
| 0:00–0:15 | Problem and promise: customers should be able to correct the bank’s understanding once |
| 0:15–0:40 | Alex’s synthetic signals; why the system asks for clarification |
| 0:40–1:10 | Confirmed intent, useful next step, evidence and timing |
| 1:10–1:45 | Cancel the move; watch both views update; refresh |
| 1:45–2:00 | Revoke consent / one hard case; demonstrate suppression |
| 2:00–2:25 | Actual architecture, measured evidence, Aikido result |
| 2:25–2:40 | Limits, path to scale and closing promise |

Replace claims with the final measured results. If a feature is missing, remove it from narration. Leave margin under three minutes and check the exported duration with FFprobe or the video player.

**Archify:** generate one diagram from the final repository. Distinguish implemented components from proposed production integrations. Export a readable image for the video and keep explorable HTML optional.

**brag:** optional 15–25-second promo only after the complete required video exists. It can supply a short opening or later social asset, but do not let it consume the final recording window. Avoid voice/music model downloads tonight; human narration is sufficient.

Suggested final line: “KBC Moment turns a customer correction into a consistent experience—across the next action, the next conversation and the next channel.”

## 10. Submission pack and final lock

- [ ] Short description accurately states what works and why it fits scalable personalization.
- [ ] Demo video is under three minutes; audio and text checked; link works without your account.
- [ ] Repository is public, accessible and remains so through judging.
- [ ] README explains purpose, setup, environment variables, synthetic data, demo steps and unfinished work.
- [ ] Aikido before and after screenshots are readable and correspond to relevant code.
- [ ] Demo URL works on another device/browser, if included; otherwise clearly state local-demo availability.
- [ ] No secrets, confidential files, real banking data or private information are present in current files or Git history.
- [ ] Final source is pushed; deployed app and recording match the submitted implementation.
- [ ] Optional evaluation results include actual environment and commit, not targets presented as facts.
- [ ] All editing sessions are stopped before final submission.
- [ ] Save submission confirmation, final commit SHA and submission time.

The GitHub repository currently being private is an actual outstanding task. In GitHub repository Settings → General → Danger Zone, review the visibility change and make it public yourself before judging. Do not delete or rewrite history to conceal prior preparation; disclose relevant reused material and follow the organizer’s ruling.

After the final submission, preserve the submitted code and submission unchanged. The 22:10–22:30 buffer is for completing a submission that has not yet been finalized, not for improving a finalized entry.

## 11. What you do vs. what Codex does

| You | Codex can automate when started in the right repo |
|---|---|
| Confirm registration, eligibility, rules and mentor feedback | Inspect source, implement backend/frontend, create contract/fixtures |
| Choose the product direction and verify that the journey makes sense | Install project dependencies, configure builds, run meaningful checks |
| Complete account sign-in, OAuth, administrator prompts and any spending approval | Diagnose deployment configuration and prepare a reviewable deploy |
| Authorize required repo visibility/access changes | Inspect for accidental secrets and prepare README/evidence |
| Narrate, assess the actual recording and submit in Builderbase | Produce diagrams/promo assets and fix code findings |

Keep only two bounded coding streams. Your attention is the scarce resource: check each stream at integration gates, give concrete corrections, then let it finish a defined unit.

## 12. Ready-to-use Parrot instructions

Copy this plan into the project as `docs/EXECUTION_PLAN.md`, then launch your existing project Codex session from the actual repo directory. Use this prompt:

```text
Read docs/EXECUTION_PLAN.md and inspect the current repository before editing.
This is the Tectonic KBC hackathon, with a 22:30 CEST cutoff tonight and
20:45 feature freeze. The repository was empty except for a planning handoff;
do not assume the separate Handover application exists here.

Implement the essential KBC Moment backend: an isolated synthetic demo session,
customer-correctable moving intent, evidence-linked ask/help/suppress decisions,
consent enforcement, persisted context and a read-only advisor demo preview.
Use FastAPI + PostgreSQL + Railway. No real bank data or transactions.

Work on feature/core. Own app/, tests/, fixtures/, docs/, and root deployment
configuration. Windows owns frontend/ and its lockfile. First write and push
docs/API_CONTRACT.md with exact JSON examples, ownership/session rules,
versioning and errors, so the frontend can implement against it. Keep AGENTS.md
short and record this ownership. Do not spawn extra agents.

Deliver first: runnable backend, meaningful health check, synthetic seed and
minimal deployable configuration. Then implement correction and consent tests,
session isolation and the shared advisor state. Use relative /api routes.
Prepare the web service to serve frontend/dist once Windows pushes it.

Use the current working dependency versions and commit lock/dependency files.
Inspect diffs before committing. Report tested commands, actual results and
remaining blockers. Do not claim deployment, security clearance or scale that
was not verified. Stop for account authorization or spending when genuinely
required; continue independent local work. Do not finalize the competition
submission or change repository visibility on my behalf.
```

If Windows misses its setup gate, explicitly transfer frontend ownership to Parrot and stop the Windows coding session before Parrot edits `frontend/`.

## 13. Prior handoffs consulted and their use

| Chat/file | Relevant contribution | Treatment tonight |
|---|---|---|
| “Hackathon Workflow Setup” + attached work setup handoff | Parrot integration, Windows frontend, iPad decisions | Retained; added ten-minute fallback, exact file ownership and remote-branch fetch |
| “Github Repo Recommendation” | Vite/shadcn/Magic UI, Archify, brag | Retained; required demo takes priority over promo |
| “Easy Professional Deployment” | FastAPI/Postgres/Railway, one public web service | Retained architecture; removed assumption that an app already exists |
| “Connect Folder GitHub Repo” | Initial Git connection | Verified locally and on GitHub; do not reinitialize |
| “Research Tectonic KBC Hackathon” + local preparation kit | Registration uncertainty, KBC overlap, demo discipline, prior-work provenance | Updated with the now-released brief and mandatory audit/video |
| “Continue Handover Implementation” | Earlier unrelated application | Excluded its product logic and tests from this fresh event repo |

No other chat was messaged, no organizer was contacted, no account access was granted, and no application code or repository settings were changed while creating this plan.

## Sources and verification

- Supplied `tectonic-hackathon-participants-guide.pdf`: challenge pp. 3–4; audit pp. 6–7; submission p. 11; rules p. 12. [Official download linked by the event page](https://www.tectonicconf.eu/assets/hackathon/tectonic-hackathon-participants-guide.pdf).
- Supplied `IMG_4764.jpeg`: tonight’s Leuven timetable, 18:30–22:30 build window.
- [First-round event page](https://www.tectonicconf.eu/hackathon-first-round): opened directly in the browser on 30 September.
- [Event FAQ](https://www.tectonicconf.eu/faq): qualification/team information. Solo eligibility remains an organizer question.
- [Current repository](https://github.com/DKAA04/Tectonic-Hackathon-KBC): authenticated browser inspection showed Private, one commit and only the handoff; local Git matched.
- [KBC Kate overview](https://newsroom.kbc.com/kate-five-years-and-five-milestones): competitive context; no inference that its undocumented internal capabilities are absent.
- Windows/frontend command sources are linked in the companion setup document. The machine itself has not been accessed or provisioned during this planning task.
