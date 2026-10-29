# VerifyAfrica web monorepo

Bun workspaces for the VerifyAfrica frontends and shared packages.

## Apps

| App | Package | Role |
| --- | --- | --- |
| `apps/client` | `@verifyafrica/client` | Customer dashboard (Live/Test mode, verifications, team) |
| `apps/admin` | `@verifyafrica/admin` | Internal admin (tenants, users, billing, **Active** presence) |
| `apps/app` | `@verifyafrica/app` | Public / product surfaces |
| `apps/status` | `@verifyafrica/status` | Status page |

Shared HTTP types and helpers live in `packages/api-client`. Domain URL constants live in `packages/config` (`packages/config/src/domains.ts`).

## Getting started

```bash
bun install
bun run dev:client   # dashboard
bun run dev:admin    # admin
```

Copy each app’s `.env.example` to `.env` (or `.env.local`) and set at least `VITE_API_BASE_URL` to your API (`http://localhost:8300/api` locally).

## Environments & branches

Hosted frontends map to git branches as follows:

| Environment | Branch | Dashboard | Admin | App | Notes |
| --- | --- | --- | --- | --- | --- |
| Local | (local) | `*.verifyafrica.localhost` | same | same | Local API via `VITE_API_BASE_URL` |
| **Dev** (rigorous testing) | **`dev`** | `dev.dashboard.verifyafrica.io` | `dev.admin.verifyafrica.io` | `dev.app.verifyafrica.io` | Single API via `VITE_API_BASE_URL`; no switcher |
| **Test** hosts | **`main`** | `test.dashboard.verifyafrica.io` | `test.admin.verifyafrica.io` | `test.app.verifyafrica.io` | Same build as production; single `VITE_API_BASE_URL` |
| **Production** | **`main`** | `dashboard.verifyafrica.io` | `admin.verifyafrica.io` | `app.verifyafrica.io` | Live↔Test switcher via live/test env vars |

Notes:

- **`dev.*`** is for active development and thorough QA. Deploys track the **`dev`** branch only.
- **`test.*` and production** both deploy from **`main`**. Customers switch Live ↔ Test in the production UI; there is no separate branch for `test.*` builds.
- Promote features with PRs along `dev` → `main`. Prefer that over long-lived release branches for routine work.
- A **`staging`** branch exists in the repo but is **not** used to build `test.*` domains — keep it around; do not rely on it for those hosts.
- Wire DNS + Railway/Vercel custom domains for the three `dev.*` hosts to the **`dev`** branch; attach `test.*` and production hosts to **`main`**.
- Backend CORS allowlists must include the `dev.*` origins (see `backend-main/src/core/domain_constants.py`).

## API base URL resolution (client + admin)

HTTP requests do **not** always use `VITE_API_BASE_URL` directly. Client and admin resolve Live/Test bases in `resolveApiModeConfig` (`packages/config/src/domains.ts`):

| Deploy env | Source of truth | Live↔Test switcher |
| --- | --- | --- |
| **production** | `VITE_LIVE_API_BASE_URL` + `VITE_TEST_API_BASE_URL` (fallback: canonical `api` / `test.api` hosts) | Enabled |
| **local / dev / test** | `VITE_API_BASE_URL` only (both modes point at it) | Disabled |

Examples:

```bash
# Local or dev.* / test.* hosts — one API
VITE_API_BASE_URL="http://localhost:8300/api"

# Production hosts — switcher pair (optional; hardcoded fallbacks exist)
VITE_API_BASE_URL="https://api.verifyafrica.io/api"
VITE_LIVE_API_BASE_URL="https://api.verifyafrica.io/api"
VITE_TEST_API_BASE_URL="https://test.api.verifyafrica.io/api"
```

Deploy environment is inferred from the host of `VITE_LIVE_API_BASE_URL` when set, otherwise `VITE_API_BASE_URL` (so SSR matches the client). `apps/app` and `apps/status` still use `VITE_API_BASE_URL` directly.

## Realtime presence (Pusher)

Dashboard and admin report who is online via Pusher. The **backend** owns auth, Redis snapshots, and webhooks; the frontends only hold the **public** key + cluster.

### Flow

1. After login, `PresenceConnector` (mounted from the auth layout) fetches `GET /api/v2/presence/config/`.
2. It opens a Pusher client and joins the platform presence channel through `POST /api/v2/presence/pusher/auth/`, sending a per-tab `connection_id` and device info (UA, platform, browser, screen, timezone).
3. Admin also subscribes to the private admin channel and invalidates the Active-page queries when it receives `presence.updated`.
4. Offline is decided by the backend when Pusher fires the presence webhook — closing the tab is enough; the FE does not call a custom “goodbye” API.

### Env (client + admin)

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_PUSHER_KEY` | recommended | Public key; if omitted, config can still come from `/presence/config/` when the API is configured |
| `VITE_PUSHER_CLUSTER` | recommended | e.g. `eu` |

**Never** put `PUSHER_SECRET` in any `VITE_*` variable.

### Key files

| Path | Purpose |
| --- | --- |
| `packages/api-client/src/http/v2/presence/presence.types.ts` | Shared presence types |
| `apps/*/src/components/presence-connector.tsx` | Join channels after auth |
| `apps/*/src/lib/presence-device.ts` | Connection id + device metadata |
| `apps/admin/src/api/http/v2/presence/` | Active list + live invalidation hooks |
| `apps/admin/src/routes/(auth)/_auth_layout/app/active/` | Admin **Active** page (Users / Tenants) |

Backend docs (channels, webhook URL, Redis): see the backend repo `README.md` → **Realtime presence (Pusher)**.

## Scripts

| Script | Description |
| --- | --- |
| `bun run dev:client` | Dashboard dev server |
| `bun run dev:admin` | Admin dev server |
| `bun run build:client` / `build:admin` | Production builds |
| `bun run check:v1-types` | Validate generated v1 API types |
