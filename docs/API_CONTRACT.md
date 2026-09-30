# KBC Moment API contract

Contract **v1**, frozen for the essential demo on 30 September 2026. All browser
requests use relative `/api` URLs. The backend is the only state authority.
This is synthetic demo content; no banking connection, payment or purchase exists.

## Ownership and integration

- Parrot (`feature/core`): `app/`, `tests/`, `fixtures/`, `docs/`, root deployment
  and dependency configuration, integration and database.
- Windows (`feature/frontend`): all of `frontend/`, including its lockfile and
  typed API client. Vite proxies `/api` to `http://127.0.0.1:8000` in development.
- Production is one origin: FastAPI serves `frontend/dist` and `/api`.
- Unknown extra request fields are rejected. Do not send a customer or session ID.
- UI renders messages as text. It must show synthetic/demo labels and treat the
  advisor view as a preview, not authenticated bank staff access.

## Session and request rules

`POST /api/demo/session` with `{}` starts a new independent Alex fixture and sets
`kbc_moment_session`, an opaque random HttpOnly, SameSite=Lax cookie, Path=/.
Its Secure flag is enabled in Railway/production. Session lifetime: 24 hours.
Only a hash of the credential is persisted. IDs in JSON are display metadata,
never credentials. There is no route to address somebody else's session.

Use `credentials: "same-origin"` (fetch's default for relative URLs). On every
successful context read, `session.csrf_token` is returned. Send it as
`X-CSRF-Token` for correction and consent writes. The bootstrap session POST
requires JSON but no CSRF token. A supplied Origin must match the request origin
or an explicitly configured local development origin; foreign origins are rejected
for every POST, including bootstrap. No cross-origin CORS is enabled.

Creation replaces only this browser's cookie; its previous session expires naturally.
Incognito/separate browsers have independent sessions. Reset means create a new
session. Missing/expired/invalid cookies return 401; the UI can offer Start demo.
Reload uses `GET /api/context`, not a new bootstrap request.

No session credential belongs in localStorage, URLs or request bodies. The CSRF
token may be kept in memory and recovered with a context read. Two tabs in the
same browser share the cookie and therefore share the same context.

## Routes

| Method/path | Success | Request | Response |
| --- | --- | --- | --- |
| `GET /api/health` | 200 | none; no session | health below; 503 when DB/schema not ready |
| `POST /api/demo/session` | 201 | `{}` | full Context below + Set-Cookie |
| `GET /api/context` | 200 | cookie | full Context |
| `POST /api/context/correction` | 200 | cookie + CSRF + Correction | full updated Context |
| `POST /api/consent` | 200 | cookie + CSRF + ConsentChange | full updated Context |
| `GET /api/advisor-preview` | 200 | same cookie | AdvisorPreview below; 403 when preview consent revoked |

`/api/openapi.json` and `/api/docs` expose the implemented schema. An unknown
`/api/*` path returns JSON 404, never the frontend HTML.

## Exact Context example: initial ambiguous signals

Times, UUIDs and tokens below are illustrative; evidence IDs are stable per fixture.
Dates use `YYYY-MM-DD`; timestamps are RFC3339 UTC. `version` is an integer >= 1.

```json
{
  "api_version": "1",
  "session": {
    "id": "d91d1b4c-c0a2-481b-b682-1d3901b667fb",
    "synthetic": true,
    "expires_at": "2026-10-01T17:30:00Z",
    "csrf_token": "example-only-token-recoverable-from-context"
  },
  "customer": {"display_name": "Alex", "synthetic": true},
  "version": 1,
  "updated_at": "2026-09-30T17:30:00Z",
  "consent": {
    "personalization": true,
    "synthetic_signals": true,
    "advisor_preview": true
  },
  "situation": {
    "type": "moving",
    "status": "tentative",
    "move_date": null,
    "remind_on": null,
    "source": "synthetic_signals",
    "evidence_ids": ["signal-goal", "signal-home-store"]
  },
  "evidence": [
    {
      "id": "signal-goal",
      "kind": "synthetic_signal",
      "summary": "Alex saved a moving preparation goal in this demo.",
      "occurred_at": "2026-09-28T17:30:00Z"
    },
    {
      "id": "signal-home-store",
      "kind": "synthetic_signal",
      "summary": "A synthetic home-store visit could relate to a move or ordinary shopping.",
      "occurred_at": "2026-09-29T17:30:00Z"
    }
  ],
  "decision": {
    "action": "ask",
    "reason_code": "AMBIGUOUS_SIGNALS",
    "message": "Are you planning a move?",
    "evidence_ids": ["signal-goal", "signal-home-store"],
    "next_steps": []
  },
  "history": []
}
```

Enums: `situation.status` = `unknown | tentative | confirmed | cancelled`;
`situation.source` = `none | synthetic_signals | customer`;
`evidence.kind` = `synthetic_signal | customer_correction`;
`decision.action` = `ask | help | suppress`.
History entries use `kind: correction | consent` and `action` as described below.

## Corrections and timing

Every write supplies the latest `expected_version`. Accepted writes increment
version once, even repeated values. Stale writes return 409 without changing state.
The database serializes updates within a session. On 409, fetch context and ask
the customer to review/retry; do not silently replay a stale correction.

`confirm` requires a move date. Optional `remind_on` defaults to null (help now).

```json
{"expected_version": 1, "action": "confirm", "move_date": "2026-11-15", "remind_on": null}
```

`change_date` requires previously confirmed intent and a move date. Omitting
`remind_on` retains the current reminder. `set_reminder` requires confirmed intent
and an explicitly supplied `remind_on`; null clears it. `cancel` rejects dates.

```json
{"expected_version": 2, "action": "change_date", "move_date": "2026-11-22"}
```

```json
{"expected_version": 3, "action": "set_reminder", "remind_on": "2026-10-20"}
```

```json
{"expected_version": 4, "action": "cancel"}
```

Move dates must be today through 730 days ahead (server UTC date). Reminders must
be today through the move date. Moving the date before an existing reminder requires
supplying a valid replacement reminder in the same request. No free text is accepted.
Corrections are accepted with personalization off; turning it on later never undoes
the customer's most recent explicit intent. Original signals cannot override a
confirmation or cancellation.

For the version-1 confirm example, the response has `version: 2`, updated UTC time,
unchanged consent, and this exact situation/decision content:

```json
{
  "situation": {
    "type": "moving",
    "status": "confirmed",
    "move_date": "2026-11-15",
    "remind_on": null,
    "source": "customer",
    "evidence_ids": ["correction-v2"]
  },
  "decision": {
    "action": "help",
    "reason_code": "CONFIRMED_MOVE",
    "message": "Prepare for your move on 2026-11-15.",
    "evidence_ids": ["correction-v2"],
    "next_steps": [
      {
        "id": "moving-admin",
        "title": "Prepare your address update checklist",
        "description": "List the organisations to notify when your move is confirmed. No address is changed by this demo.",
        "due_on": "2026-11-15",
        "evidence_ids": ["correction-v2"]
      },
      {
        "id": "moving-insurance",
        "title": "Review what your home cover needs for the move",
        "description": "Prepare questions about your move date and home cover for an advisor. No product is bought or changed.",
        "due_on": "2026-11-15",
        "evidence_ids": ["correction-v2"]
      }
    ]
  }
}
```

The full response additionally appends evidence
`{"id":"correction-v2","kind":"customer_correction","summary":"Customer confirmed a move on 2026-11-15.","occurred_at":"2026-09-30T17:31:00Z"}`
and history
`{"version":2,"kind":"correction","action":"confirm","occurred_at":"2026-09-30T17:31:00Z","evidence_id":"correction-v2"}`.
For date/reminder/cancel corrections the evidence ID is likewise `correction-vN`.
Evidence and history are chronologically ordered and return the latest 50 entries.
The latest correction is retained even if older evidence is trimmed.

## Consent and suppression

All demo scopes initially true for the synthetic fixture. Consent change is a
partial update with at least one boolean scope (actual JSON booleans only).

```json
{"expected_version": 2, "personalization": false}
```

```json
{"expected_version": 3, "synthetic_signals": false, "advisor_preview": false}
```

Turning personalization off immediately returns `evidence: []`, clears all evidence
references and next steps, hides inferred intent (`unknown`/`none`), and suppresses
help. Explicit customer intent/date remains visible as customer-entered state.
History remains visible to the customer without evidence IDs while personalization
is off. Turning synthetic signals off removes those events before inference and
from every customer/advisor response; explicit corrections remain usable when
personalization is on. Consent revocation retains stored synthetic context for
possible re-enabling; it is not a deletion request. Advisor consent off returns 403
for advisor reads. No global customer list or advisor mutation route exists.

Decision priority and exact suppression objects (all use `next_steps: []`):

| reason_code | action | message | evidence_ids |
| --- | --- | --- | --- |
| `PERSONALIZATION_DISABLED` | suppress | Personalization is off. | [] |
| `MOVE_CANCELLED` | suppress | Your move is cancelled. Moving suggestions have been withdrawn. | latest correction ID |
| `REMINDER_NOT_DUE` | suppress | Moving help is paused until YYYY-MM-DD. | latest correction ID |
| `MOVE_DATE_PASSED` | suppress | Your move date has passed. Update it to receive relevant help. | latest correction ID |
| `NO_ALLOWED_EVIDENCE` | suppress | There is no permitted evidence to suggest a move. | [] |
| `AMBIGUOUS_SIGNALS` | ask | Are you planning a move? | allowed signal IDs |
| `CONFIRMED_MOVE` | help | Prepare for your move on YYYY-MM-DD. | latest correction ID |

Priority: personalization → cancellation → confirmed past-date/reminder/help →
allowed ambiguous signals → no allowed evidence. Reminders are checked on each
read using UTC today; passage of time can change a decision without a write/version
increment. Every help step and non-empty decision reference resolves to returned
evidence. Consent history has `action: "update"`, `evidence_id: null`.

## AdvisorPreview example

```json
{
  "api_version": "1",
  "read_only": true,
  "preview_label": "Advisor demo preview — synthetic session, not bank staff access",
  "context": {
    "api_version": "1",
    "session": {
      "id": "d91d1b4c-c0a2-481b-b682-1d3901b667fb",
      "synthetic": true,
      "expires_at": "2026-10-01T17:30:00Z",
      "csrf_token": "example-only-token-recoverable-from-context"
    },
    "customer": {"display_name": "Alex", "synthetic": true},
    "version": 3,
    "updated_at": "2026-09-30T17:32:00Z",
    "consent": {"personalization": false, "synthetic_signals": true, "advisor_preview": true},
    "situation": {
      "type": "moving", "status": "confirmed", "move_date": "2026-11-15",
      "remind_on": null, "source": "customer", "evidence_ids": []
    },
    "evidence": [],
    "decision": {
      "action": "suppress", "reason_code": "PERSONALIZATION_DISABLED",
      "message": "Personalization is off.", "evidence_ids": [], "next_steps": []
    },
    "history": [
      {"version": 2, "kind": "correction", "action": "confirm", "occurred_at": "2026-09-30T17:31:00Z", "evidence_id": null},
      {"version": 3, "kind": "consent", "action": "update", "occurred_at": "2026-09-30T17:32:00Z", "evidence_id": null}
    ]
  }
}
```

This example shows the confirmed session after personalization is revoked.
`context` is the full Context at the time of the read, with the same version,
situation and decision as the customer endpoint. The preview uses the
customer's session; it does not introduce a separate staff identity or credential.
Poll/refetch after changes or tab focus so two views reflect corrections promptly.

## Health and errors

Health tests a PostgreSQL query against the session table; it never returns secrets.

```json
{"api_version":"1","status":"ready","checks":{"database":"ready"},"synthetic_only":true}
```

When unavailable: status 503 and
`{"api_version":"1","status":"not_ready","checks":{"database":"unavailable"},"synthetic_only":true}`.

All API errors use this exact envelope (details is always an array):

```json
{
  "api_version": "1",
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Context changed. Fetch the latest context and retry.",
    "details": [{"field": "expected_version", "message": "Current version is 3."}]
  }
}
```

| HTTP | code | Meaning |
| --- | --- | --- |
| 401 | `SESSION_REQUIRED` | Missing, invalid or expired cookie |
| 403 | `CSRF_INVALID` | Missing/incorrect X-CSRF-Token |
| 403 | `ORIGIN_FORBIDDEN` | Supplied Origin is not allowed |
| 403 | `ADVISOR_CONSENT_REQUIRED` | Advisor preview consent off |
| 404 | `NOT_FOUND` | Unknown API route |
| 405 | `METHOD_NOT_ALLOWED` | Unsupported method (advisor is GET only) |
| 409 | `VERSION_CONFLICT` | expected_version differs from current version |
| 409 | `INVALID_TRANSITION` | Date/reminder edit before confirmation |
| 413 | `PAYLOAD_TOO_LARGE` | Request body exceeds 8192 bytes |
| 415 | `JSON_REQUIRED` | Write Content-Type must be application/json |
| 422 | `VALIDATION_ERROR` | Bad enum/date/type, extra fields or missing fields |
| 503 | `DATABASE_UNAVAILABLE` | Persistence temporarily unavailable |
| 500 | `INTERNAL_ERROR` | Unexpected error; no internal details exposed |

Validation details contain only field/message, never reflected input values.
Responses carrying session context use `Cache-Control: no-store`.
No event ingestion or arbitrary text/customer-ID endpoints are exposed in v1.

## Versioning

`api_version: "1"` is the wire contract version, distinct from per-session `version`.
Additive fields may be introduced in v1; frontend ignores unknown response fields.
Breaking changes require an agreed contract revision before implementation.
Types and behavior here are normative; runtime OpenAPI and tests must match.
