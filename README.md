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
