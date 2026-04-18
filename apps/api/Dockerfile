# ══════════════════════════════════════════════════════════════════════════════
# VenueFlow AI API — Multi-stage Dockerfile for Cloud Run
# Express 5 + Socket.io + TypeScript
# ══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace manifests only (for layer caching)
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/venue-data/package.json ./packages/venue-data/

RUN npm ci --workspace=apps/api --workspace=packages/shared-types --workspace=packages/venue-data

# ── Stage 2: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared-types ./packages/shared-types
COPY packages/venue-data ./packages/venue-data
COPY apps/api ./apps/api
COPY turbo.json package.json ./

WORKDIR /app/apps/api
RUN npx tsc --project tsconfig.json

# ── Stage 3: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Cloud Run injects PORT=8080 — override the default 3001
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 venueflow
USER venueflow

# Copy compiled JS and ALL node_modules from the monorepo root
COPY --from=builder --chown=venueflow:nodejs /app/apps/api/dist ./dist
COPY --from=deps    --chown=venueflow:nodejs /app/node_modules  ./node_modules
COPY --from=deps    --chown=venueflow:nodejs /app/packages      ./packages

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', r => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

CMD ["node", "dist/app.js"]
