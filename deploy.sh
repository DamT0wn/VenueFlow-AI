#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# VenueFlow AI — One-command Cloud Run deployment script
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Prerequisites:
#   - gcloud CLI installed and authenticated  (gcloud auth login)
#   - Docker installed and running
#   - A GCP project with billing enabled
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Config — edit these ───────────────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"
REGION="${GCP_REGION:-asia-south1}"
REPO="venueflow"

API_SERVICE="venueflow-api"
WEB_SERVICE="venueflow-web"

REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Preflight checks ──────────────────────────────────────────────────────────
command -v gcloud >/dev/null 2>&1 || error "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
command -v docker  >/dev/null 2>&1 || error "Docker not found. Install: https://docs.docker.com/get-docker/"

info "Deploying VenueFlow AI to project: ${PROJECT_ID} / region: ${REGION}"

# ── Step 1: Set GCP project ───────────────────────────────────────────────────
info "Step 1/8 — Setting GCP project..."
gcloud config set project "${PROJECT_ID}"

# ── Step 2: Enable required APIs ─────────────────────────────────────────────
info "Step 2/8 — Enabling GCP APIs (this takes ~1 min on first run)..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  redis.googleapis.com \
  --quiet

# ── Step 3: Create Artifact Registry repo ────────────────────────────────────
info "Step 3/8 — Creating Artifact Registry repository..."
gcloud artifacts repositories create "${REPO}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="VenueFlow AI container images" \
  --quiet 2>/dev/null || warn "Repository already exists — skipping"

# ── Step 4: Configure Docker auth ────────────────────────────────────────────
info "Step 4/8 — Configuring Docker authentication..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# ── Step 5: Store Redis URL in Secret Manager ─────────────────────────────────
info "Step 5/8 — Setting up secrets..."
echo ""
warn "You need a Redis instance. Options:"
echo "  A) Google Cloud Memorystore (recommended for production):"
echo "     gcloud redis instances create venueflow-redis --size=1 --region=${REGION} --tier=BASIC"
echo "     Then get the IP: gcloud redis instances describe venueflow-redis --region=${REGION} --format='get(host)'"
echo ""
echo "  B) Upstash Redis (free tier, no VPC needed):"
echo "     https://upstash.com → Create database → Copy Redis URL"
echo ""
read -rp "Enter your Redis URL (redis://HOST:PORT or rediss://HOST:PORT): " REDIS_URL

if [[ -z "${REDIS_URL}" ]]; then
  warn "No Redis URL provided — using in-memory only (crowd data won't persist across restarts)"
  REDIS_URL="redis://localhost:6379"
fi

echo -n "${REDIS_URL}" | gcloud secrets create venueflow-redis-url \
  --data-file=- --quiet 2>/dev/null || \
echo -n "${REDIS_URL}" | gcloud secrets versions add venueflow-redis-url \
  --data-file=- --quiet
success "Redis URL stored in Secret Manager"

# ── Step 6: Build and push API image ─────────────────────────────────────────
info "Step 6/8 — Building API image..."
API_IMAGE="${REGISTRY}/${API_SERVICE}:latest"

docker build \
  -f apps/api/Dockerfile \
  -t "${API_IMAGE}" \
  .

docker push "${API_IMAGE}"
success "API image pushed: ${API_IMAGE}"

# ── Step 7: Build and push Web image ─────────────────────────────────────────
info "Step 7/8 — Building Web image..."
WEB_IMAGE="${REGISTRY}/${WEB_SERVICE}:latest"

echo ""
warn "The web build needs your environment variables."
read -rp "Google Maps API Key: " MAPS_KEY
read -rp "Firebase API Key: " FB_API_KEY
read -rp "Firebase Auth Domain (e.g. your-project.firebaseapp.com): " FB_AUTH_DOMAIN
read -rp "Firebase Project ID: " FB_PROJECT_ID
read -rp "Firebase Storage Bucket (e.g. your-project.firebasestorage.app): " FB_STORAGE
read -rp "Firebase Messaging Sender ID: " FB_SENDER_ID
read -rp "Firebase App ID (1:xxx:web:xxx): " FB_APP_ID
read -rp "GA4 Measurement ID (G-XXXXXXXX, press Enter to skip): " GA_ID

# API URL will be set after deploy — use placeholder for now, update after
API_URL="https://${API_SERVICE}-$(echo "${REGION}" | tr '-' '')-${PROJECT_ID}.a.run.app"

docker build \
  -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL="${API_URL}" \
  --build-arg NEXT_PUBLIC_SOCKET_URL="${API_URL}" \
  --build-arg NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="${MAPS_KEY}" \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="${FB_API_KEY}" \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${FB_AUTH_DOMAIN}" \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="${FB_PROJECT_ID}" \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="${FB_STORAGE}" \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${FB_SENDER_ID}" \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="${FB_APP_ID}" \
  --build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID="${GA_ID:-}" \
  --build-arg NEXT_PUBLIC_USE_EMULATOR=false \
  -t "${WEB_IMAGE}" \
  .

docker push "${WEB_IMAGE}"
success "Web image pushed: ${WEB_IMAGE}"

# ── Step 8: Deploy to Cloud Run ───────────────────────────────────────────────
info "Step 8/8 — Deploying to Cloud Run..."

# Grant Cloud Run access to Secret Manager
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format='get(projectNumber)')
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet

# Deploy API
gcloud run deploy "${API_SERVICE}" \
  --image="${API_IMAGE}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=60 \
  --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=${FB_PROJECT_ID:-demo-venueflow},PUBSUB_PROJECT_ID=${FB_PROJECT_ID:-demo-venueflow}" \
  --set-secrets="REDIS_URL=venueflow-redis-url:latest" \
  --quiet

API_URL=$(gcloud run services describe "${API_SERVICE}" \
  --region="${REGION}" --format='get(status.url)')
success "API deployed: ${API_URL}"

# Update CORS to allow the web URL (we'll update after web deploy)
# Deploy Web
gcloud run deploy "${WEB_SERVICE}" \
  --image="${WEB_IMAGE}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=60 \
  --quiet

WEB_URL=$(gcloud run services describe "${WEB_SERVICE}" \
  --region="${REGION}" --format='get(status.url)')
success "Web deployed: ${WEB_URL}"

# Update API CORS to allow the actual web URL
gcloud run services update "${API_SERVICE}" \
  --region="${REGION}" \
  --update-env-vars="CORS_ORIGINS=${WEB_URL}" \
  --quiet

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  VenueFlow AI deployed successfully! 🏟️${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 Web app:  ${BLUE}${WEB_URL}${NC}"
echo -e "  🔌 API:      ${BLUE}${API_URL}${NC}"
echo -e "  📊 Logs:     ${BLUE}https://console.cloud.google.com/run?project=${PROJECT_ID}${NC}"
echo ""
warn "Next steps:"
echo "  1. Restrict your Google Maps API key to: ${WEB_URL}/*"
echo "  2. Add ${WEB_URL} to Firebase authorized domains"
echo "  3. Set up Cloud Monitoring alerts for error rates"
echo ""
