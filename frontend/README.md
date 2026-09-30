# KBC Moment frontend

## Workspace redesign

The compact blue workspace takes visual cues from the [official KBC Mobile page](https://www.kbc.be/retail/en/products/payments/self-banking/on-your-smartphone/mobile-banking.html). The public KBC SVG in `public/kbc-logo.svg` is downloaded unchanged from the logo link on that page: https://wcmassets.kbc.be/content/dam/kdl-assets/logos/k/logos-kbc.svg.cdn.res/last-modified/1733244069305/logos-kbc.svg. The cyan/navy/background tokens are prototype choices, not official brand specifications. Persistent labeling identifies this as a hackathon prototype with synthetic data.

Choose **Plan my move** to confirm a date in a drawer; after confirmation, **Change date** is a small editable detail. Returned address and home-cover steps open an unsaved draft checklist and a dated question guide. Checklist ticks exist only in React state, and are invalidated on context/version, consent, date or decision changes. No address or insurance policy is changed. Evidence, history and consent are accessible from the links below the workspace. The advisor column uses its separately fetched, current context rather than duplicating the customer screen.

Responsive CSS targets a two-column desktop workspace and a stacked mobile layout. Browser automation was unavailable during the redesign; visual checks at 1440×900 and 390px remain pending at http://127.0.0.1:5173.

Windows owns `frontend/` on `feature/frontend`. Parrot owns backend, shared contracts, integration and deployment. This app follows `docs/API_CONTRACT.md` v1.

## Development fixtures

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev:fixture
```

Open http://127.0.0.1:5173. The amber **Development fixture mode** banner remains visible throughout the journey. The fixture adapter is Vite middleware in `dev/fixture.ts`, serving the documented HTTP routes; the browser uses the same typed client in either mode. Fixture sessions live only in development-server memory, expire after 24 hours and survive page refresh while the server runs. Restarting Vite loses fixture sessions. Its health response is simulated, not a PostgreSQL health check. It does not expose OpenAPI/docs.

No session credential or CSRF token is stored in localStorage, sessionStorage or a URL. Both adapters use an HttpOnly session cookie; CSRF is recovered from the context and held in memory.

## Live integration

```powershell
npm.cmd run dev
```

The teal **Live API mode** banner means requests use the live API transport; it is not a claim that a backend is reachable. Vite proxies relative `/api` requests to `http://127.0.0.1:8000`. If Parrot supplies a verified backend, set the server-only `API_PROXY_TARGET` before starting Vite. The backend must allow the exact local frontend Origin for writes. Secure production cookies may require an HTTPS development origin; final same-origin integration belongs to Parrot. Do not expose a development server on event Wi-Fi.

Production builds always use real relative `/api` routes, including when built with `--mode fixture`. The fixture middleware is never mounted for builds or preview, and fixture code/data is not shipped in browser assets. Live failures are displayed; they never switch to fixtures. There is no verified live backend URL in this handoff.

## Demo journey

1. Start a synthetic demo. The initial context asks whether Alex is moving and shows the actual supporting evidence.
2. Choose a move date and confirm. Displayed preparation steps come from the response, including due dates and evidence explanations.
3. Open the read-only advisor demo preview. It is fetched from its endpoint; it is not bank staff access.
4. Return to the customer view and cancel the move. Suggestions disappear only after an accepted response. The advisor is refetched after the change.
5. Toggle personalization off. Evidence and help disappear while explicit customer intent remains visible. Re-enable it: the cancellation is still respected.
6. Toggle synthetic-signal or advisor-preview consent independently. Revoked preview consent hides the advisor context.
7. Refresh the page: the existing session is recovered with `GET /api/context`; no new session is created. Window focus and page visibility also refresh both views. Reset explicitly creates a new session for this browser.

Writes include `expected_version` and `X-CSRF-Token`. A 409 reloads current context and asks for review without replaying the write. CSRF failures recover context before a manual retry; 401 offers Start demo. Validation details are shown as text. Network/invalid-response/service failures hide potentially stale suggestions and pause writes until Refresh succeeds. Advisor refresh failures hide old preview data. Consent and correction controls are disabled during requests; no optimistic success is displayed.

## Verification

Use Node 22.23.3 or a compatible newer version. React, TypeScript, Vite, Tailwind and shadcn are already configured, with matching `@` aliases. Reduced-motion preferences are respected.

```powershell
npm.cmd test
npm.cmd run build
```

Six focused HTTP/client tests cover the complete journey and refresh recovery, consent filtering, evidence references, advisor consistency, CSRF, stale versions/no replay, isolated sessions/reset, date/reminder validation, rejected fields/origins/payloads and live errors/no fixture fallback. They use a temporary local fixture server by default.

To run the same checks through an already running local **fixture** Vite server (creates isolated test sessions):

```powershell
$env:KBC_TEST_BASE_URL = 'http://127.0.0.1:5173'
npm.cmd test
Remove-Item Env:KBC_TEST_BASE_URL
```

`npm.cmd run preview` serves the production bundle and expects a real API. Final backend integration, browser visual verification and deployment remain to be checked on Parrot's integrated application. The automated tests verify the adapter/client boundary, not PostgreSQL persistence or production staff authentication.
