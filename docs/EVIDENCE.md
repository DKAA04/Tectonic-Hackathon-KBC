# Verification evidence

30 September 2026, Parrot/Linux, Python 3.13.5, PostgreSQL 17.11.
Results below are local observations, not production capacity or security clearance.

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

## Pending external/integration checks

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
