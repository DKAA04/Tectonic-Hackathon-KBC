# KBC Moment

“Correct once. Be understood everywhere.” A synthetic moving-life-event demo
using FastAPI, PostgreSQL and a shared customer/advisor context. The policy is
deterministic rules, not a live AI model. No real bank data or transactions.

The API is fixed in [docs/API_CONTRACT.md](docs/API_CONTRACT.md).
Windows owns the React frontend; the web service serves `frontend/dist` when built.
The advisor endpoint is a read-only preview in the customer's demo session,
not production bank staff authentication or entitlements.

## Local backend

Requires Python 3.13 and PostgreSQL 17 (the locally available test version).

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
# Set DATABASE_URL to your local PostgreSQL database through your shell.
.venv/bin/python -m app.db init
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Schema initialization creates the isolated `moment_demo_sessions` table. It never
resets an existing session or seeds a shared global customer. Each
`POST /api/demo/session` with `{}` creates a new synthetic fixture and cookie.
Without a configured/working database, `/api/health` returns 503.

For an automatically discarded local PostgreSQL cluster on Debian/Parrot:

```bash
pg_virtualenv bash -c '.venv/bin/python -m app.db init && .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000'
```

Swagger: `http://127.0.0.1:8000/api/docs`.
An API-only deployment returns a small status object at `/` until the frontend arrives.

## Essential demo and checks

1. Start demo (`POST /api/demo/session` with `{}`): Alex's ambiguous synthetic
   signals produce an evidence-linked question.
2. Confirm a move date with the returned version and `X-CSRF-Token`: two useful
   preparation steps appear. No bank action is executed.
3. Open the advisor preview with the same browser session: its context matches.
4. Cancel: suggestions disappear from both channels. Refresh preserves the change.
5. Revoke personalization: evidence is filtered and decisions suppressed. Turning
   consent on again preserves the customer's cancellation.
6. Use an incognito browser for a new isolated fixture. Creating a demo again
   resets only the caller's browser; no shared global customer is overwritten.

```bash
pg_virtualenv .venv/bin/pytest -q
pg_virtualenv .venv/bin/python tests/smoke_http.py
.venv/bin/python -m pip check
docker build -t kbc-moment:local .
# Optional Linux/container startup verification against temporary PostgreSQL:
pg_virtualenv .venv/bin/python tests/smoke_http.py --container kbc-moment:local
```

The tests use real temporary PostgreSQL. For another environment set an isolated
`TEST_DATABASE_URL`; tests do not use the application DATABASE_URL. The HTTP smoke
starts a real Uvicorn process and exercises cookies, CSRF and the complete journey.
Container smoke uses local host networking and development cookies for plain HTTP;
deployment uses production Secure cookies behind Railway HTTPS.
Frontend calls use relative URLs; recover CSRF with `GET /api/context` on reload.
Consent starts enabled for this entirely synthetic fixture. Revocation filters
inference and output; it retains stored context and is not a deletion request.

## Railway configuration

The root Dockerfile installs pinned Python requirements, runs `npm ci` and
`npm run build` if `frontend/package.json` exists, then serves both in a non-root
Python runtime. The frontend lockfile is required when that package exists.
Startup creates the schema and binds `0.0.0.0:$PORT`; health probes query the real
session table. [Railway configuration reference](https://docs.railway.com/config-as-code/reference).

Use one web service and one PostgreSQL service. Set web `DATABASE_URL` using the
database service's Railway reference, and `APP_ENV=production`. Set `APP_ORIGIN`
to the public HTTPS origin if the Railway public domain variable is unavailable.
Never put DATABASE_URL in a `VITE_` variable. Local `.env` values are not committed.

No Railway deployment or security audit is claimed until recorded in
`docs/EVIDENCE.md`. Account authorization, service costs and final competition
submission remain with the operator.
