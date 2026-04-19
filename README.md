# VenueFlow AI 🏟️

> Real-time intelligent venue companion — crowd heatmaps, smart navigation, queue estimates, and live alerts powered by Firebase, Google Maps, and AI-driven recommendations.

[![CI](https://github.com/DamT0wn/VenueFlow-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/DamT0wn/VenueFlow-AI/actions/workflows/ci.yml)
[![Deploy](https://github.com/DamT0wn/VenueFlow-AI/actions/workflows/deploy.yml/badge.svg)](https://github.com/DamT0wn/VenueFlow-AI/actions/workflows/deploy.yml)

## Live Deployment

- Web: https://venueflow-web-733457865640.asia-south1.run.app
- API: https://venueflow-api-733457865640.asia-south1.run.app

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Mobile PWA)                      │
│  Next.js 14 · React 18 · Tailwind · Framer Motion              │
│  Google Maps API · Firebase SDK · Socket.io-client              │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTPS / WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                    BACKEND (Cloud Run)                           │
│  Express 5 · Socket.io · TypeScript                             │
│  Firebase Admin · Redis (ioredis) · Cloud Pub/Sub               │
└──────┬─────────────┬────────────┬────────────┬──────────────────┘
       │             │            │            │
  ┌────▼────┐  ┌─────▼────┐ ┌───▼────┐  ┌───▼──────────────┐
  │ Redis   │  │Firestore │ │Pub/Sub │  │Firebase Auth/FCM │
  │ (cache) │  │(persist) │ │(events)│  │(auth + push)     │
  └─────────┘  └──────────┘ └────────┘  └──────────────────┘
```

### Data Flow — Crowd Heatmap

```
CrowdSimulator (every 5s)
  → generateNextSnapshot()
  → Redis SET crowd:{venueId}:snapshot (TTL 30s)
  → Socket.io emit('crowd:update', snapshot) → all venue room clients
  → Client setCrowdSnapshot(snapshot) → HeatmapLayer re-renders
```

---

## Project Structure

```
venueflow/
├── apps/
│   ├── web/          # Next.js 14 frontend (PWA)
│   └── api/          # Express 5 + Socket.io backend
├── packages/
│   ├── shared-types/ # Zod schemas + TypeScript types (shared)
│   └── venue-data/   # Venue graph + crowd seed data
├── .github/workflows/
│   ├── ci.yml        # PR checks (lint/typecheck/test/e2e/a11y)
│   └── deploy.yml    # Cloud Run + Firebase Hosting deploy
├── firestore.rules   # Firestore security rules
├── firestore.indexes.json
├── firebase.json
└── docker-compose.yml
```

---

## Local Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20.0.0 |
| npm | ≥ 10.0.0 |
| Docker Desktop | ≥ 4.x |
| Firebase CLI | ≥ 13.x |

### 1. Clone and install

```bash
git clone https://github.com/DamT0wn/VenueFlow-AI.git
cd VenueFlow-AI
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your API keys (see table below)
```

### 3. Start with Docker Compose

```bash
docker compose up
```

This starts:
- **Redis** on `localhost:6379`
- **Firebase Emulator** on `localhost:4000` (UI at http://localhost:4000)
- **API** on `localhost:3001`

### 4. Start the Next.js frontend

```bash
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Backend (`apps/api/.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Express server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `demo-venueflow` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account JSON (single-line) | `{"type":"service_account",...}` |
| `PUBSUB_PROJECT_ID` | GCP project for Pub/Sub | `demo-venueflow` |
| `PUBSUB_TOPIC` | Pub/Sub topic name | `venue-alerts-development` |
| `CORS_ORIGINS` | Comma-sep allowed origins | `http://localhost:3000` |

### Frontend (`apps/web/.env.local`)

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JS API key | [GCP Console → APIs & Services](https://console.cloud.google.com) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key | Firebase Console → ⚙️ → Project settings → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Same as above |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Same as above |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Same as above |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web Push VAPID key | Firebase Console → Cloud Messaging → Web Push certificates |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 measurement ID | GA4 → Admin → Data Streams → Measurement ID |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001` (dev) |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL | `http://localhost:3001` (dev) |

---

## Google Maps API Key Restriction

> ⚠️ **Security requirement**: Restrict the Maps API key to prevent unauthorised usage charges.

1. Open [GCP Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click your Maps JS API key
3. Under **Application restrictions** select **HTTP referrers (websites)**
4. Add these referrers:
   ```
   localhost:3000/*
   venueflow.app/*
   *.venueflow.app/*
   ```
5. Under **API restrictions** select **Restrict key** → check:
   - Maps JavaScript API
   - Maps Static API *(if used)*

---

## Firebase Emulator Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login (for real project; skip for demo-venueflow emulator)
firebase login

# Start all emulators (Auth, Firestore, Pub/Sub)
firebase emulators:start --project demo-venueflow
```

Emulator UI: http://localhost:4000

To pre-populate Firestore test data:
```bash
# Import from the data directory
firebase emulators:start --import=./emulator-data --export-on-exit
```

---

## Running Tests

### Unit + Integration Tests (Jest — backend)
```bash
cd apps/api
npx jest --coverage
```

Coverage threshold: **80% statements** on all service files.

### Frontend Component Tests (Vitest + RTL)
```bash
cd apps/web
npx vitest run --coverage
```

### E2E Tests (Playwright)
```bash
# Ensure docker-compose is running first
docker compose up -d

# Install browsers
npx playwright install --with-deps chromium

# Run all E2E tests
npx playwright test

# Run with UI mode
npx playwright test --ui
```

### Full test suite (all workspaces)
```bash
npx turbo run test
```

---

## Deployment

### Manual (one-time setup)

1. Create a GCP project and enable APIs:
   - Cloud Run, Artifact Registry, Secret Manager, Cloud Pub/Sub, Cloud Monitoring
2. Create Firebase project with Firestore, Auth, FCM, Hosting
3. Store secrets in GCP Secret Manager:
   - `REDIS_URL` — Cloud Memorystore connection string
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — service account JSON
   - `PUBSUB_TOPIC` — `venue-alerts-production`
4. Configure GitHub Secrets (see `deploy.yml` for full list)

### Automated

Push to `main` → GitHub Actions runs `deploy.yml`:
1. Build API Docker image → push to Artifact Registry
2. Deploy to Cloud Run (`min-instances=1`, `max-instances=20`, `concurrency=80`)
3. Build Next.js → deploy to Firebase Hosting
4. Deploy Firestore rules and indexes
5. Run smoke tests against production URL

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| UI | Tailwind CSS v3, Framer Motion v11, Radix UI |
| Maps | Google Maps JS API v3.55 + @vis.gl/react-google-maps |
| State | Zustand v4 + TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Backend | Node.js 20, Express 5, TypeScript |
| Real-time | Socket.io v4 |
| Cache | Redis 7 (ioredis v5) |
| Database | Firestore (Firebase Admin) |
| Auth | Firebase Auth (Google, Email, Anonymous) |
| Push | Firebase Cloud Messaging |
| Events | Google Cloud Pub/Sub |
| Hosting | Firebase Hosting (frontend) + Cloud Run (backend) |
| CI/CD | GitHub Actions + Docker |
| Analytics | Google Analytics 4 (Consent Mode v2) |

---

## Accessibility

VenueFlow AI targets **WCAG 2.1 Level AA**:
- Skip-to-content link as first DOM element
- All interactive elements keyboard-navigable (min 44×44px touch targets)
- ARIA live regions on alerts (`assertive` = critical, `polite` = info)
- Colourblind mode: density shown as numerical overlay instead of colour gradient
- `prefers-reduced-motion` respected in all Framer Motion animations
- Screen-reader text alternative for the Google Maps canvas

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request — CI must pass before merge

---

## License

MIT © VenueFlow AI Team
