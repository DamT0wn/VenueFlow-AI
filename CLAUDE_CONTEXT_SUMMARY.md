# VenueFlow AI - Full Application Context (For Claude)

Use this as the project context before making further changes.

## 1) Project Snapshot

- Name: VenueFlow AI
- Repo type: npm workspaces monorepo with Turborepo
- Runtime: Node 20+, npm 10+
- Primary apps:
  - `apps/web`: Next.js 14 (App Router), React 18, TypeScript
  - `apps/api`: Express 5 + Socket.io + TypeScript
- Shared packages:
  - `packages/shared-types`: Zod schemas, types, constants
  - `packages/venue-data`: static venue graph + mock crowd seeds

Live/demo intent: real-time venue companion (crowd heatmap, routing, queues, alerts, recommendations).

## 2) Monorepo Commands

From repo root:

- `npm run dev` -> runs workspace dev via turbo
- `npm run build`
- `npm run test`
- `npm run lint`
- `npm run type-check`

Per app:

- API:
  - `cd apps/api`
  - `npm run dev`, `npm run build`, `npm run test`
- Web:
  - `cd apps/web`
  - `npm run dev`, `npm run build`, `npm run test`

## 3) High-Level Architecture

- Web client uses Socket.io client + Zustand stores.
- API exposes REST endpoints and a Socket.io server.
- Crowd simulator runs in API process and emits updates every 5s.
- Data layers:
  - In-memory snapshot cache
  - Redis cache (crowd + queue)
  - Firestore fallback for crowd snapshot reads
- Shared contracts are centralized in `@venueflow/shared-types`.

## 4) Backend Structure (apps/api)

Main entrypoint:
- `src/app.ts`
  - Security headers via `helmet`
  - CORS from env
  - `/health` endpoint checks Redis + Firestore
  - Route mount points:
    - `/api/crowd`
    - `/api/navigation`
    - `/api/queues`
    - `/api/alerts`
    - `/api/recommendations`
    - `/api/admin`
  - Socket registration + crowd simulator bootstrap

Routes:
- `routes/crowd.ts`
  - `GET /api/crowd/:venueId`
  - Returns latest crowd snapshot
- `routes/navigation.ts`
  - `POST /api/navigation/route`
  - Uses Dijkstra + crowd-weighted edges
- `routes/queues.ts`
  - `GET /api/queues/:venueId`
  - Returns queue points with estimated wait
- `routes/alerts.ts`
  - `GET /api/alerts/:venueId`
  - `POST /api/alerts`
  - `DELETE /api/alerts/:id`
- `routes/recommendations.ts`
  - `GET /api/recommendations/:venueId` (query: type/lat/lng/limit)
- `routes/admin.ts`
  - admin overview/queues/graph/health endpoints

Socket layer:
- `sockets/crowdSocket.ts`
  - Handles connection + `join:venue` / `leave:venue`
  - Emits `joined:venue`
  - Client receives `crowd:update`

Background jobs:
- `jobs/crowdSimulator.ts`
  - Simulates venue crowd for `venue-stadium-one`
  - tick interval from shared constant (5s)
  - emits `crowd:update` to room `venue:<venueId>`

Services:
- `services/crowdService.ts`
  - read strategy: memory -> Redis -> Firestore
- `services/pathfindingService.ts`
  - Dijkstra pathfinding, crowd-weighted edges
- `services/queueService.ts`
  - queue wait estimate from density, Redis cache
- `services/recommendationService.ts`
  - proximity + density scoring within search radius
- `services/alertService.ts`
  - alert persistence/broadcast plumbing

## 5) Frontend Structure (apps/web)

App behavior:
- `app/providers.tsx`
  - splash screen on first session, then route to `/map`
- `middleware.ts`
  - redirects `/` and `/login` to `/map`

Main pages:
- `(venue)/map/page.tsx`
- `(venue)/navigate/page.tsx`
- `(venue)/queues/page.tsx`
- `(venue)/alerts/page.tsx`
- `(venue)/recommendations/page.tsx`
- `(venue)/design/page.tsx`
- `(auth)/login/page.tsx` -> immediate redirect to `/map`

State:
- `store/venueStore.ts`
  - venueId/name, crowdSnapshot, venueGraph, accessibility toggles
- `store/userStore.ts`
  - auth/user preferences (non-sensitive prefs persisted)

Realtime client:
- `lib/socket.ts`
- `hooks/useSocket.ts`
  - listens to `crowd:update` and updates `venueStore`

## 6) Shared Contracts and Constants

In `packages/shared-types/src`:
- `venue.schema.ts` - graph + route schemas
- `crowd.schema.ts` - zone/snapshot + crowd event payloads
- `alert.schema.ts` - alerts, queue, recommendations schemas
- `index.ts` exports all + constants

Notable constants:
- `CROWD_UPDATE_INTERVAL_MS = 5000`
- `CROWD_SNAPSHOT_TTL_SECONDS = 30`
- `QUEUE_TTL_SECONDS = 60`
- `RECOMMENDATION_SEARCH_RADIUS_METRES = 500`
- `RECOMMENDATION_MAX_DENSITY = 40`
- `VENUE_ROOM_PREFIX = "venue:"`

## 7) Data Model Notes

Venue data currently comes from static package data:
- `packages/venue-data/src/venueGraph.ts` -> `venue-stadium-one`
- `packages/venue-data/src/mockCrowdSeed.ts` -> seeded zone densities

This means many "live" features are deterministic/simulated rather than fully dynamic from Firestore.

## 8) Important Current Constraints / Inconsistencies

1. Auth is intentionally bypassed for demo mode.
- API middleware `verifyToken` sets guest user (`role: user`) and does not verify real token.
- Web socket sends `auth: { token: 'dev-bypass' }`.
- Web middleware redirects to map without login.

2. Some UI pages are currently mock/demo-first.
- Pages like alerts/queues/recommendations include seeded local arrays and simulated updates.
- They are not fully wired to backend APIs yet in all cases.

3. Possible role mismatch.
- Alert/admin write endpoints require admin role via `requireRole('admin')`.
- With hardcoded guest role, admin routes can be blocked unless bypass logic is changed.

4. Venue naming mismatch across UX vs backend data.
- UI references stadium names like M. Chinnaswamy and many custom labels.
- Backend graph/simulator is keyed to `venue-stadium-one` static graph.

5. Route docs in comments are more ambitious than implementation in places.
- Treat route comments as intent; validate concrete service logic before refactors.

## 9) Infra/Deployment Notes

- Docker compose provides Redis + Firebase emulator; API is generally run natively in dev.
- Cloud Run deployment docs exist in `DEPLOY.md`.
- Root `README.md` includes architecture, env vars, testing, and deploy flow.

## 10) Best Next Steps for Further Work

If continuing development, prioritize:

1. Decide product mode:
- keep demo mode or re-enable full auth and role claims.

2. Align data model:
- unify venue IDs, names, and zone/node naming between web UI and backend graph.

3. Wire real API data end-to-end:
- replace page-local mock arrays with API + query state + socket updates.

4. Stabilize admin workflows:
- ensure admin role paths are reachable in chosen auth mode.

5. Add integration tests for socket + route behavior under simulator updates.

---

## Paste-Ready Prompt For Claude

You are helping on the VenueFlow AI monorepo. Use this context:

- Monorepo: npm workspaces + Turborepo with apps/web (Next.js 14) and apps/api (Express + Socket.io), plus shared packages for schemas and venue data.
- Current state is demo-first: auth is bypassed, socket uses dev-bypass token, login redirects to /map.
- Backend has implemented REST routes for crowd, navigation, queues, alerts, recommendations, admin; crowd simulator emits updates every 5s for venue-stadium-one.
- Frontend has pages map/navigate/queues/alerts/recommendations/design, but some pages still use local mock data and are not fully wired to backend.
- Shared schemas/constants are in packages/shared-types; static graph and seed data are in packages/venue-data.

Before coding, inspect actual implementation (not only comments), then propose and implement incremental, low-risk changes that improve production readiness. Keep compatibility with current monorepo scripts and TypeScript setup.
