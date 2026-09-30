# Verification evidence

30 September 2026, Parrot/Linux, Python 3.13.5, PostgreSQL 17.11.
Results distinguish local tests, deployed HTTP checks and database permission
checks. None establishes production capacity, browser visual quality or security clearance.

## Current integration and public deployment

- Public app: https://tectonic-hackathon-kbc-production.up.railway.app
- Verified Railway deployment source: `499da129acbc69806853a0b1dee868b9fa7e3b9b`,
  deployment `347ee869-7e74-406f-84e5-6fd0c1a3a81f`, status **SUCCESS**.
  This includes backend protection `29e114c` and Windows Vite fix `0af82d0`.
  Later local reconciliation/evidence commits preserve the same runtime files.
- Existing project `perpetual-dream` / web service `Tectonic-Hackathon-KBC` reused.
  Root Dockerfile and railway.json retained. Database-backed `/api/health` passed.
  Domain routes to the actual Uvicorn port, **8080**. Initial public checks failed
  because the generated domain targeted 8000; correcting the target resolved it.
- Private Railway `DATABASE_URL` matches the operator's exact **Session pooler**
  connection, port 5432, with SSL required. `APP_ENV=production` and `APP_ORIGIN`
  match the public URL. A comparison printed only boolean results; no credentials.
  No `VITE_` environment variables are configured on the web service.
- `.venv/bin/python tests/smoke_https.py https://tectonic-hackathon-kbc-production.up.railway.app`:
  **passed** on the initial protected deployment and again on `499da12`.
  Real HTTPS requests verified new isolated sessions → ask → confirm/help → date
  correction → reminder suppression/resume → cancellation → consent enforcement,
  refresh persistence, customer/advisor agreement, evidence references, Secure /
  HttpOnly cookies, CSRF/origin denial and stale-version conflicts.
- Production HTTP asset checks passed: redesigned JavaScript, CSS, KBC logo,
  root/nested navigation and JSON API 404. These are **not browser interaction or
  visual checks**. Windows must verify the live UI separately.
- Actual Supabase Session pooler SQL connection passed with SSL. `verify-access`
  confirmed RLS, restrictive deny policy, no PUBLIC grants, and denied table/column
  access for `anon`, `authenticated` and `service_role`. Actual `SET LOCAL ROLE`
  SELECT attempts returned SQLSTATE **42501** for all three roles. A Data API read
  with the supplied publishable key returned **401 / 42501**, with no records.
  Only this application's table and its policy were changed; initialization
  preserved existing data. Connection strings and keys are absent from this repo.

- Windows frontend through `7e1e5f9` (including `2e634b6`) merged and pushed in
  `b7e79ab`. Existing backend and frontend work preserved; no frontend source
  or lockfile edited on Parrot.
- `npm ci --cache /tmp/kbc-moment-npm-cache`: 369 packages installed, exit 0.
  The initial sandbox attempt failed on the default npm cache; the retry used
  the temporary cache and authorized registry access. No dependency changes.
- `npm test`: **8 passed**, 0 failed; after Vite fix, **324.37 ms**. A sandbox run could not start
  its fixture HTTP server; the authorized local-server run passed.
- `npm run build`: TypeScript and Vite production build passed; final Vite-fix
  build completed in **2.25 seconds**. The dependency lockfile was unchanged.
- Integrated backend: **44 passed in 2.26 seconds**, real PostgreSQL 17.11.
- After session-table protection and verification command:
  `pg_virtualenv .venv/bin/pytest -q`: **46 passed in 2.60 seconds**.
  Added checks verify revoked table/column privileges, actual permission-denied
  reads under client roles, restrictive RLS despite a later permissive grant,
  and data-preserving/idempotent initialization.
- `pg_virtualenv .venv/bin/python tests/smoke_http.py --expect-frontend` passed
  against real Uvicorn/PostgreSQL with the integrated built frontend and again
  after the access-protection/verification changes and final Windows merge.
- Supabase CLI is not installed and is not needed for private SQL access.
- Local direct connectivity failed because the endpoint is IPv6-only. Railway's
  outbound IPv6 setting allowed initial direct SQL access. The operator then
  supplied the exact Session pooler connection, which is the selected private
  production connection; no pooler hostname was guessed.
- A concurrent GitHub frontend merge caused one local push rejection. Both merge
  histories were preserved by merging origin/main; no force push or reset used.
- Password scans of tracked files, production assets and Git history found no
  supplied database secret. No additional database, plan or paid add-on purchased.
- Actual browser interaction/visual checks remain pending on Windows. Aikido
  screenshots and video remain outside the current verified evidence.

## First runnable backend

- Contract commit `1688578` pushed to `origin/feature/core` before implementation.
- `.venv/bin/python -m pip install fastapi uvicorn sqlalchemy 'psycopg[binary]' pytest httpx`:
  succeeded; runtime and development dependency closures pinned in requirements files.
- `.venv/bin/python -m pip check`: exit 0, no broken requirements.
- `pg_virtualenv .venv/bin/pytest -q tests/test_bootstrap.py`: **3 passed**,
  0.13 seconds test time. Real temporary PostgreSQL; schema readiness, seeded
  question/evidence, cookie, refresh, fresh application persistence and advisor equality.
- Initial run exposed PostgreSQL returning the machine's CEST timezone; API output
  now normalizes persisted timestamps to UTC. The rerun above passed.
- First run had a Starlette httpx deprecation warning. Updated the development
  requirements to supported httpx2 2.13.1; the full run below has no warnings.
- `git diff --cached --check`: exit 0 after removing planning-file trailing spaces.

## Essential backend: b8e4f79

- `pg_virtualenv .venv/bin/pytest -q`: **44 passed in 2.38 seconds**, exit 0,
  using real PostgreSQL 17.11. This is test duration, not a throughput benchmark.
- Includes exact published JSON examples, strict dates/consent booleans, atomic
  version checks with simultaneous writes, cancellation precedence, correction
  while consent is off, scope filtering, advisor revocation, independent sessions,
  cookie expiry/hash ownership, CSRF/origin checks, payload limits, missing-schema
  readiness and static asset/navigation/API boundaries.
- `pg_virtualenv .venv/bin/python tests/smoke_http.py`: exit 0, real Uvicorn
  process; ready → ask → help → cancel → revoke → persisted customer/advisor equality.
- `docker build -t kbc-moment:local .`: exit 0. Local Docker command is Podman
  emulation. Full backend image ID:
  `98b3e0cfb04d9892fbc70d459a5737e313574ecf9f24056ea3afed3a0d06bd7b`.
- `pg_virtualenv .venv/bin/python tests/smoke_http.py --container kbc-moment:local`:
  exit 0. Actual image startup initialized the schema and served the same complete
  HTTP journey. Plain local HTTP uses development cookies; the test suite separately
  checks production Secure cookies. No Railway HTTPS result is implied.
- `.venv/bin/python -m pip check`: exit 0, no broken requirements.
- Diffs inspected and `git diff --cached --check` passed before implementation commits.

Temporary PostgreSQL checks run sequentially: parallel pg_virtualenv attempts
collided on the same cluster/port. The successful sequential commands above
replaced that failed attempt. A missing-schema test's connection setup was also
corrected to commit its search_path setting so connection rollback could not undo it.

## Windows build compatibility

- Temporary combined checkout used backend `b8e4f79` and Windows frontend
  `e4908cf`; no branch merge, source change or lockfile edit.
- `docker build -t kbc-moment:combined .` from that checkout: exit 0.
  Its frontend stage ran the committed lockfile through `npm ci` (369 packages)
  and `npm run build` (TypeScript + Vite 7.3.6), which finished successfully.
  npm reported zero dependency vulnerabilities at that moment; this is not an
  Aikido code audit, penetration test or security clearance.
- Combined local image:
  `9c8a43be9b0f21317a2b004d4087397ba8c6b84f3cdfa11740e29a3b5b92eb8a`.
- `pg_virtualenv .venv/bin/python tests/smoke_http.py --container kbc-moment:combined --expect-frontend`:
  exit 0. Served actual built HTML, nested `/advisor` navigation and a JavaScript
  asset; `/api/unknown` remained JSON 404. The same image also passed the complete
  backend HTTP journey against temporary PostgreSQL.
- This verifies the build/serving boundary. The fixture shell's production client
  still needs to be connected to the API by Windows; no live UI journey is claimed.

## Historical external blockers (before current integration)

- Railway CLI 5.63.1: signed-in status command reached the service but reported
  **No linked project found**. Project/service target and spending approval requested.
- `railway list --json` returned `[]` (exit 0) for the current account: no accessible
  project target was found. Creating a new project/web/PostgreSQL service requires
  the operator's target and authorization for service costs; nothing was provisioned.
- No public deployment or Railway database connection has been verified.
- Remote Windows frontend `e4908cf` is a fixture shell, with its production
  transport intentionally unconfigured. Build/serving checks above passed;
  Windows must finish API wiring and an integrated UI journey must then be checked.
- Aikido audit and before/after screenshots have not been supplied or verified.
- Repository visibility and final competition submission are operator actions.
