# Provenance and limits

This KBC Moment application was written in the fresh hackathon repository on
30 September 2026 with Codex assistance. The initial tracked repository contained
only `HACKATHON_PROJECT_HANDOFF.md`; the unrelated Handover application's code,
business rules and tests were not imported. `docs/EXECUTION_PLAN.md` preserves
the supplied event plan, renamed from its local TECTONIC_KBC_EXECUTION_PLAN filename.

Runtime: FastAPI 0.142.2, Uvicorn 0.54.0, SQLAlchemy 2.1.1, Psycopg 3.3.6,
Pydantic 2.13.5. Complete resolved dependencies are pinned in `requirements.txt`;
development/test dependencies in `requirements-dev.txt`.
Tests exercise PostgreSQL 17.11 locally. Railway CLI available: 5.63.1.

`fixtures/moving.json` is invented synthetic content for Alex, with relative event
times. It contains no actual customer, merchant transaction, bank connection or
payment. The engine uses deterministic consent/timing rules; no model API or
generated natural-language interpretation is claimed.

The advisor preview reuses the customer's demo session. Production staff identity,
entitlements, bank adapters, event ingestion, legal review, penetration testing
and capacity for KBC's customer population are outside this verified demo.

Deployment configuration was checked against the official
[Railway config reference](https://docs.railway.com/config-as-code/reference) and
[Dockerfile guide](https://docs.railway.com/builds/dockerfiles). FastAPI static
serving is implemented and tested in this repo. A genuine external deployment or
Aikido result is recorded only when actually observed in `docs/EVIDENCE.md`.
