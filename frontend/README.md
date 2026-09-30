# KBC Moment frontend

Windows owns this directory on `feature/frontend`. Backend, shared contract and deployment belong to Parrot.

## Start on Windows

Node 22.23.3 and npm 10.9.9 were used for setup. Reopen PowerShell after installing Node so PATH refreshes.

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev:fixture
```

Open http://localhost:5173. The fixture command explicitly enables synthetic read-only data. `npm.cmd run dev` and production builds never fall back to fixtures.

```powershell
npm.cmd run build
npm.cmd run preview
```

## Integration blocker

At initial setup, `docs/API_CONTRACT.md` and backend source were absent from both remote branches. The current implementation is a visual shell only. Confirmation, correction, cancellation, next-step and consent controls are intentionally disabled; no success is simulated. The advisor preview reads the same fixture context object/version as the customer screen, not a backend context yet.

Agree the routes, authentication, JSON schemas, version/concurrency behavior, correction responses and consent semantics before wiring `src/lib/api.ts`. Its current type is an internal view model, not a proposed backend contract.

Browser requests must use relative `/api` routes. Vite proxies `/api` to `http://127.0.0.1:8000`. For a verified deployed backend, set the server-only `API_PROXY_TARGET` environment variable before starting Vite. No backend URL is available at setup. Production API integration belongs to Parrot.

Tailwind and TypeScript/Vite `@` aliases are configured. UI components live in `src/components/ui` (shadcn). Reduced motion is respected. No backend-driven success animation is implemented until there is a confirmed server response.
