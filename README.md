# VerifyAfrica web monorepo

Bun workspaces for the VerifyAfrica frontends and shared packages.

## Apps

| App | Package | Role |
| --- | --- | --- |
| `apps/client` | `@verifyafrica/client` | Customer dashboard (Live/Test mode, verifications, team) |
| `apps/admin` | `@verifyafrica/admin` | Internal admin (tenants, users, billing, **Active** presence) |
| `apps/app` | `@verifyafrica/app` | Public / product surfaces |
| `apps/status` | `@verifyafrica/status` | Status page |

Shared HTTP types and helpers live in `packages/api-client`. Domain URL constants live in `packages/config`.

## Getting started

```bash
bun install
bun run dev:client   # dashboard
bun run dev:admin    # admin
```

Copy each app’s `.env.example` to `.env` (or `.env.local`) and set at least `VITE_API_BASE_URL` to your API (`http://localhost:8300/api` locally).

## Branches

Feature work lands on **`dev`**. Promote to production with a `dev` → `main` PR (same pattern as the backend), not long-lived release branches for routine features.

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
