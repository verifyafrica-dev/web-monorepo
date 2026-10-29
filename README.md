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

All non-production frontends are **development-class**. Hosted envs map to git branches as follows:

| Environment | Branch | Dashboard | Admin | App | API used by FE |
| --- | --- | --- | --- | --- | --- |
| Local | (local) | `*.verifyafrica.localhost` | same | same | `localhost:8300` |
| **Dev** (rigorous testing) | **`dev`** | `dev.dashboard.verifyafrica.io` | `dev.admin.verifyafrica.io` | `dev.app.verifyafrica.io` | `test.api.verifyafrica.io` |
| **Test / staging** | **`staging`** | `test.dashboard.verifyafrica.io` | `test.admin.verifyafrica.io` | `test.app.verifyafrica.io` | `test.api.verifyafrica.io` |
| Production | **`main`** | `dashboard.verifyafrica.io` | `admin.verifyafrica.io` | `app.verifyafrica.io` | `api.verifyafrica.io` |

Notes:

- **`dev.*`** is for active development and thorough QA. Deploys track the **`dev`** branch.
- **`test.*`** is the staging surface customers/QA hit before prod. Deploys track the **`staging`** branch.
- Promote features with PRs along `dev` → `staging` → `main` (or `dev` → `main` when skipping staging). Prefer that over long-lived release branches for routine work.
- `dev` and `test` frontends are locked to the development API (no Live↔Test switcher). Only production enables the customer Live/Test switcher.
- Wire DNS + Railway/Vercel custom domains for the three `dev.*` hosts to the **`dev`** branch deployments; keep existing `test.*` hosts on **`staging`**.
- Backend CORS allowlists must include the `dev.*` origins (see `backend-main/src/core/domain_constants.py`).

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
