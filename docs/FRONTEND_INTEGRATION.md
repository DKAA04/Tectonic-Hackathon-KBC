# Windows integration handoff

Backend branch: `feature/core`. Contract: [API_CONTRACT.md](API_CONTRACT.md).
All six essential endpoints are implemented. The transport returns a full Context
for bootstrap, reads, corrections and consent; advisor wraps it in `context`.

1. Fetch `origin/feature/core` and read the contract before changing the typed client.
2. Vite proxies `/api` to `http://127.0.0.1:8000`. Use relative fetch paths and the
   same-origin cookie; do not invent a session header or customer-ID parameter.
3. On initial load call `GET /api/context`. A 401 displays Start demo. Only the
   customer's Start/Reset action calls `POST /api/demo/session` with JSON `{}`.
4. Recover CSRF from `context.session.csrf_token`; send it in `X-CSRF-Token` on
   correction/consent POSTs. Every write uses `expected_version: context.version`.
5. Replace displayed context with the whole server response. On 409 refetch and
   ask the customer to review/retry; don't silently replay an old cancellation/date.
6. Advisor preview uses the same browser cookie and refetches on write/tab focus
   (or short polling while visible). It displays the backend version and has no
   editing controls. A 403 clears the preview and shows that preview consent is off.
7. After revocation replace evidence/steps with returned arrays; clear cached old
   advisor content. Never keep a cancelled next step visible from local fixtures.
8. Show synthetic/demo labels, render messages as text and keep dates YYYY-MM-DD.

Request example:

```typescript
const response = await fetch('/api/context/correction', {
  method: 'POST',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': context.session.csrf_token,
  },
  body: JSON.stringify({
    expected_version: context.version,
    action: 'confirm',
    move_date: selectedDate,
  }),
})
const result = await response.json()
// Use result.error.message on failure; result is the full Context on success.
```

Production build must use the committed frontend lockfile (`npm ci && npm run build`).
The root Dockerfile builds `frontend/dist`; FastAPI serves assets and navigation
fallback while preserving `/api` JSON errors, health, OpenAPI and Swagger.

Observed remote frontend at `e4908cf`: buildable fixture shell with production
transport intentionally unconfigured. This is not an integrated live demo yet.
Parrot has not edited any `frontend/` source or its lockfile.
