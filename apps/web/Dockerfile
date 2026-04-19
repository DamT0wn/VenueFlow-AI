# ══════════════════════════════════════════════════════════════════════════════
# VenueFlow AI Web — Multi-stage Dockerfile for Cloud Run
# Next.js 14 with standalone output mode
# ══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace manifests only (for layer caching)
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/venue-data/package.json ./packages/venue-data/

RUN npm ci --workspace=apps/web --workspace=packages/shared-types --workspace=packages/venue-data

# ── Stage 2: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared-types ./packages/shared-types
COPY packages/venue-data ./packages/venue-data
COPY apps/web ./apps/web
COPY turbo.json package.json ./

# Build args — injected at build time by Cloud Build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_USE_EMULATOR=false

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_USE_EMULATOR=$NEXT_PUBLIC_USE_EMULATOR
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/apps/web
RUN npm run build

# ── Stage 3: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Cloud Run sets PORT automatically — Next.js standalone respects it
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output (includes only required node_modules)
# Next.js standalone output structure:
#   .next/standalone/          ← server.js lives here (monorepo root)
#   .next/standalone/apps/web/ ← app-specific files
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules               ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static     ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public           ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public           ./apps/web/public

USER nextjs

EXPOSE 8080

# Handle both standalone layouts seen in monorepos across Next versions.
CMD ["sh", "-c", "if [ -f /app/server.js ]; then node /app/server.js; elif [ -f /app/apps/web/server.js ]; then node /app/apps/web/server.js; else echo 'Could not find Next standalone server.js' >&2; ls -la /app; ls -la /app/apps/web || true; exit 1; fi"]
