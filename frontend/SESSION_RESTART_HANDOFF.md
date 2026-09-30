# Start here — KBC Moment session restart

This file is the compact continuation context for Angel's next AI session. Do not redo setup or redesign the accepted app.

## Current objective (latest user instruction)

The KBC Moment redesign and the 12 passing fixture checks are accepted. Preserve the completed frontend through `7e1e5f9`; fix only reproducible defects. Prepare manual Chrome/window recording using the existing screen recorder and runbook. Once Angel supplies Parrot's public HTTPS application URL, verify the integrated application and record it in **under three minutes**. Until then, keep the local fixture preview available for a clearly labeled backup recording. Do not add features, redesign, merge main, deploy or submit. Do not spawn agents. This documentation/rehearsal commit must not delay Parrot's deployment.

Parrot is integrating and deploying:

```text
Browser → Railway FastAPI → Supabase PostgreSQL
```

Supabase project URL: `https://jevuhcihgcevihbvelbr.supabase.co`

Project ref: `jevuhcihgcevihbvelbr`

**That is not the deployed frontend URL.** The public Railway/application HTTPS URL has not yet been supplied. Do not guess it. Ask Angel for it when continuing live verification. The frontend must continue using the existing relative `/api` endpoints. No frontend Supabase SDK, keys, CLI setup or new authentication system is needed. Database credentials stay on the backend.

## Workspace and source checkpoint

```text
C:\Users\angel\OneDrive\Documentos\Personal\Hackathons\tectonic
```

- Branch: `feature/frontend` (tracks `origin/feature/frontend`).
- Accepted, pushed application checkpoint: `7e1e5f9da82f90e830d395a39b0636c2886bdcfd`. Documentation/rehearsal commits may follow it.
- First redesign checkpoint: `2e634b62392224ea46faeb97d626edeae4a70405`.
- Windows owns only `frontend/` and its lockfile. Parrot owns backend, integration, shared docs, root/deployment configuration.
- Read root `AGENTS.md`, `docs/EXECUTION_PLAN.md`, `docs/API_CONTRACT.md` and `frontend/README.md` before changing behavior. Respect the user's explicit frontend ownership even though one sentence in AGENTS is written from Parrot's perspective.
- The accepted tracked application files remain unchanged since `7e1e5f9`. Angel authorized committing this handoff, the recording runbook, the saved rehearsal script and its inspected sanitized results. Leave `frontend/HANDOFF_REDESIGN_2026-09-30.md` uncommitted; do not stage unrelated artifacts or the whole rehearsal directory.
- The planned feature freeze was 20:45 CEST on 30 September 2026. Continue verification and repairs only. Check actual current time rather than extending event deadlines.

## Installed and working

- Git 2.55.0.windows.5.
- Node 22.23.3 at `C:\Program Files\nodejs\node.exe`; npm 10.9.9.
- Codex CLI 0.159.2 and the existing desktop environment worked.
- The repo is already cloned; do not create another copy.
- Frontend dependencies and lockfile already exist. Do not scaffold or replace the stack.
- Stack: React, TypeScript, Vite, Tailwind, shadcn/Base UI, Lucide.
- Use `npm.cmd` in PowerShell. If an inherited shell cannot see Node, prepend `C:\Program Files\nodejs` to that process's PATH; no execution-policy change is needed.

## Resume commands

First inspect state:

```powershell
Set-Location 'C:\Users\angel\OneDrive\Documentos\Personal\Hackathons\tectonic'
git status --short --branch
git rev-parse HEAD
```

The fixture preview returned HTTP 200 at handoff time:

```text
http://127.0.0.1:5173
```

Do not start a duplicate server if that URL already works. If it stopped when the old AI session ended, run this in a terminal and keep it open:

```powershell
Set-Location 'C:\Users\angel\OneDrive\Documentos\Personal\Hackathons\tectonic\frontend'
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
npm.cmd run dev:fixture -- --port 5173 --strictPort
```

The visible UI must identify **Development fixtures**. Production and normal `npm.cmd run dev` use the real API transport, with no fixture fallback. The development proxy normally targets `http://127.0.0.1:8000`; do not assume Parrot's server is local.

### Saved fixture rehearsal (rerun only when needed)

The run at **2026-09-30 21:34:49 CEST** passed all 12 checks with exit code 0 and is accepted. Do not repeatedly rerun unchanged tests. The instructions below are available for a future relevant change or failure investigation.

The exact HTTP sequence used in the previous session is now saved as a reusable script, with a local fixture-mode guard. It creates its own isolated cookie sessions and does not reuse the operator's browser session.

In a second terminal:

```powershell
Set-Location 'C:\Users\angel\OneDrive\Documentos\Personal\Hackathons\tectonic\frontend'
& 'C:\Program Files\nodejs\node.exe' --experimental-strip-types rehearsal/run-fixture.mjs
```

To also save its output:

```powershell
& 'C:\Program Files\nodejs\node.exe' --experimental-strip-types rehearsal/run-fixture.mjs | Tee-Object -FilePath rehearsal/fixture-last-result.txt
```

Successful completion prints 12 `PASS` lines and `REHEARSAL COMPLETE`, and exits 0. Failures must be investigated rather than hidden with fixture fallback. The fixed demo dates are intended for the 30 September 2026 event; after the reminder date approaches, update the rehearsal dates rather than treating a past-date rejection as an app defect.

## What is implemented and accepted

- Compact KBC-inspired blue/cyan/navy workspace; public official KBC logo; persistent synthetic/hackathon label.
- Customer/Advisor view switch; roughly 2:1 desktop layout; mobile styling.
- `Plan my move` date drawer, then small `Change date` detail.
- Real returned preparation cards open an unsaved address checklist and dated home-cover question guide.
- `Help at the right time → Manage` uses documented `set_reminder`, current version and CSRF; `Help me now` sends null. No external notifications are claimed.
- Safe local plain-text briefing download with no session ID, credentials, CSRF or evidence.
- Evidence/history/privacy drawers; explicit cancellation; consent controls; advisor context refetched after changes.
- Cookie session recovery, same-origin relative API calls, CSRF protection, version checks and error handling remain intact.
- Draft progress is React-only and invalidated on relevant context changes. No address, policy or product is updated or purchased.

## Results already obtained — distinguish their scope

### Accepted redesign verification

- `npm.cmd test`: all **8 tests passed** (original 6 contract/client tests + 2 presentation/export/draft tests).
- `npm.cmd run build`: passed.
- Local page, transformed React module and logo each returned HTTP 200.
- Both accepted commits were pushed to `feature/frontend` before 20:45 CEST.

### Latest fixture rehearsal

Passed against the running Vite fixture server:

1. Initial tentative question with two evidence items.
2. Confirm **15 November 2026** and receive both preparation steps.
3. Briefing text generation excludes session/CSRF/evidence identifiers.
4. Change to **22 November 2026**; advisor context/version match.
5. Existing cookie recovers the corrected session without a new bootstrap.
6. Set help date **10 November 2026** → steps suppressed; Help me now → steps restored.
7. Signal consent filters synthetic evidence without undoing explicit intent.
8. Cancel → obsolete customer/advisor suggestions disappear.
9. Revoke advisor consent → expected **403 `ADVISOR_CONSENT_REQUIRED`**.
10. Revoke personalization → evidence/help/exported preparation removed.
11. Separate HTTP cookie sessions remain independent.
12. Removing signals from a tentative session removes the inference.

No frontend defect was reproduced in those checks. No application source fixes were made after acceptance.

**Limitations:** these were HTTP and presentation-function checks, not browser clicks. Actual drawer behavior, rendered layouts, downloaded-file behavior, incognito-browser isolation and recording framing remain unverified. Fixtures are not proof of Railway/Supabase connectivity or PostgreSQL persistence.

## Manual browser recording

The browser automation inventory returned `[]` (no connected browsers). This limits automated visual verification; it does not prevent Angel from using Chrome and a screen recorder manually. Follow the runbook's manual recording steps now for a clearly labeled fixture backup. Do not claim visual verification from HTTP checks or spend the event repairing browser tooling. Record operator-observed checks separately from automated results.

No video has been recorded. A **2:35 shot list, narration, capture setup and full live checklist** are ready in:

```text
frontend/RECORDING_RUNBOOK_2026-09-30.md
```

Required final sequence:

```text
Initial question + evidence
→ confirm move (15 November)
→ useful preparation in both drawers
→ change date (22 November)
→ advisor reflects correction
→ refresh preserves it
→ cancel
→ obsolete suggestions disappear
→ revoke advisor consent
→ preview unavailable
```

Before the integrated recording, also verify reminder suppression/resume, signal-consent filtering, actual briefing download and genuine incognito-session independence on the **public integrated HTTPS app**. The fixture backup can be recorded manually while that URL is pending, with **Development fixtures** visible and the runbook's fixture-specific narration. Use readable zoom and direct app/window capture. Review a short test clip and the final export. Final video must be under 3 minutes. Optional brag intro only after the functional demonstration is secured; none has been started.

## Handling any defect

- Record actual URL/mode, browser/viewport, starting state/version/consent, exact input/actions, expected and observed results, HTTP path/status/safe error code, and reproduction reliability.
- Do not put cookies, CSRF or credentials in logs/chat.
- Frontend defect: fix only that reproducible issue on `feature/frontend`, run `npm.cmd test` and `npm.cmd run build`, review, commit only the intended frontend files, push, and send the new SHA for Parrot to integrate.
- Backend defect: report reproduction to Parrot; do not edit backend or deployment files.
- Do not add features, redesign, merge main, deploy, change repository visibility or submit.

## Related local artifacts

- `frontend/HANDOFF_REDESIGN_2026-09-30.md`: detailed redesign handoff, terminal test/build/push excerpts and exact SHAs.
- `frontend/RECORDING_RUNBOOK_2026-09-30.md`: 2:35 recording script and integrated-app acceptance checklist.
- `frontend/rehearsal/run-fixture.mjs`: rerunnable fixture rehearsal.
- `frontend/rehearsal/fixture-last-result.txt`: output from the saved rehearsal's latest run, if present.

These deliverables follow the accepted application commit `7e1e5f9` in a documentation/rehearsal commit. The detailed redesign handoff remains a local, uncommitted artifact.

## Ready-to-paste prompt for the new AI session

```text
Read frontend/SESSION_RESTART_HANDOFF.md and the referenced recording runbook.
Resume the latest verification/recording task; do not redo setup or redesign.
Preserve feature/frontend through 7e1e5f9 and change code only for reproducible
frontend defects. Do not spawn agents, merge main, deploy or submit.

Check whether the fixture server at http://127.0.0.1:5173 is still running.
Restart it only if needed. The 12 passing checks at 21:34 CEST are accepted;
do not rerun unchanged tests. Preserve the sanitized saved results.
Prepare manual Chrome recording using the existing runbook; an empty automation
inventory does not block the operator. Keep a clearly labeled fixture backup
available, without claiming it verifies Supabase or database persistence.

The public integrated application URL has not yet been supplied. The Supabase
project URL is not the frontend URL. Ask me for Parrot's public HTTPS app URL
when needed, then verify the integrated journey and prepare/record the under-
three-minute demonstration. Report visual/browser limitations honestly.
Do not add frontend Supabase configuration or bypass live failures with fixtures.
```
