# KBC Moment

"Correct once. Be understood everywhere." A synthetic moving-life-event demo
using FastAPI, PostgreSQL and a shared customer/advisor context. The policy is
deterministic rules, not a live AI model. No real bank data or transactions.

Public demo: [Open KBC Moment](https://tectonic-hackathon-kbc-production.up.railway.app).
The HTTPS journey and production assets are verified; browser/visual checks are
tracked separately in [docs/EVIDENCE.md](docs/EVIDENCE.md).

The API is fixed in [docs/API_CONTRACT.md](docs/API_CONTRACT.md).
The completed Windows workspace through `7e1e5f9` is integrated into `main`.
The Vite environment filter fix `0af82d0` is also integrated; its configuration
loads only `API_PROXY_` variables. Database secrets are backend-only.
Railway builds and serves `frontend/dist`; production always uses relative `/api`.
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

Schema initialization creates and protects the isolated `moment_demo_sessions`
table. It never resets an existing session or seeds a shared global customer. Each
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

Use the existing Railway project `perpetual-dream`, web service
`Tectonic-Hackathon-KBC`, and the operator's existing Supabase PostgreSQL project.
No Railway database or paid add-on is required. Set `DATABASE_URL` privately on
the web service, with `sslmode=require`, and keep `APP_ENV=production`.
For IPv4 use the exact Session pooler hostname/username from Supabase Dashboard
→ Connect → Session pooler, port 5432. The direct endpoint requires IPv6.
The deployed app uses the operator-supplied Session pooler over SSL.
SQLAlchemy uses the database connection, not the Supabase publishable key.
Set `APP_ORIGIN` to the actual public HTTPS origin. Never put database credentials
in a `VITE_` variable, source, screenshots or documentation.

## Session table protection

`python -m app.db init` creates the table and applies
[app/protect_sessions.sql](app/protect_sessions.sql) in one transaction. It
enables RLS, adds a restrictive deny policy, and revokes table and column grants
from PUBLIC and existing `anon`, `authenticated` and `service_role` roles.
Only `public.moment_demo_sessions` and its own policy are changed; no default
privileges, unrelated tables or policies are modified. Existing rows survive.
The private FastAPI connection uses the table owner, `postgres` on Supabase,
and keeps SQL access. Client-role Data API access is deliberately unavailable.
These controls follow the [Supabase API security guidance](https://supabase.com/docs/guides/api/securing-your-api).

With the private `DATABASE_URL` supplied to the backend environment:

```bash
.venv/bin/python -m app.db init
.venv/bin/python -m app.db verify-access
.venv/bin/python tests/smoke_https.py https://YOUR-RAILWAY-DOMAIN
```

`verify-access` prints only access-control metadata, never records or credentials.
The HTTPS smoke creates isolated synthetic sessions and verifies corrections,
reminders, consent, persistence, channel agreement and built production assets.
It does not establish visual/browser interaction checks or production capacity.

Verified deployment details and unresolved browser/security-audit checks are in
`docs/EVIDENCE.md`. Final competition submission remains with the operator.
