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
- One Starlette warning: TestClient's httpx integration is deprecated. Tests pass;
  supported test-client dependency update remains for the next verification pass.
- `git diff --cached --check`: exit 0 after removing planning-file trailing spaces.

## Pending external/integration checks

- Railway CLI 5.63.1: signed-in status command reached the service but reported
  **No linked project found**. Project/service target and spending approval requested.
- Local image build is in progress. No image, public deployment or Railway DB
  connection result is claimed yet.
- Windows frontend has not been received/built in this checkout.
- Aikido audit and before/after screenshots have not been supplied or verified.
- Repository visibility and final competition submission are operator actions.
