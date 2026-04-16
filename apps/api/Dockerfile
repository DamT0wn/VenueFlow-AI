# ══════════════════════════════════════════════════════════════════════════════
# VenueFlow AI API — Multi-stage Dockerfile
# ══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/venue-data/package.json ./packages/venue-data/

# Install dependencies (including workspace packages)
RUN npm ci --workspace=apps/api --workspace=packages/shared-types --workspace=packages/venue-data

# ── Stage 2: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source
COPY packages/shared-types ./packages/shared-types
COPY packages/venue-data ./packages/venue-data
COPY apps/api ./apps/api
COPY turbo.json package.json ./

# Type check and build TypeScript
WORKDIR /app/apps/api
RUN npx tsc --project tsconfig.json --noEmit
RUN npx tsc --project tsconfig.json

# ── Stage 3: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 venueflow
USER venueflow

# Copy only production artifacts
COPY --from=builder --chown=venueflow:nodejs /app/apps/api/dist ./dist
COPY --from=deps --chown=venueflow:nodejs /app/node_modules ./node_modules

# Cloud Run health check (liveness)
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', r => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

CMD ["node", "dist/app.js"]

# ── Development stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS development
WORKDIR /app

RUN apk add --no-cache curl
COPY --from=deps /app/node_modules ./node_modules
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY turbo.json package.json ./

WORKDIR /app/apps/api
EXPOSE 3001

CMD ["npx", "tsx", "watch", "src/app.ts"]
