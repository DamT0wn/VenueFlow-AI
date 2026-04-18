# Deploying VenueFlow AI to Google Cloud Run

Two services deploy to Cloud Run:
- **venueflow-api** — Express + Socket.io backend (port 8080)
- **venueflow-web** — Next.js 14 frontend (port 8080)

---

## Prerequisites

Install these tools first:

```bash
# 1. Google Cloud SDK
# Windows: https://cloud.google.com/sdk/docs/install
# Mac:
brew install --cask google-cloud-sdk

# 2. Authenticate
gcloud auth login
gcloud auth application-default login

# 3. Docker Desktop
# https://docs.docker.com/get-docker/
```

---

## Option A — One-command script (recommended)

```bash
# From the VenueFlow-AI directory:
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Enable all required GCP APIs
2. Create an Artifact Registry repository
3. Prompt you for API keys and Redis URL
4. Build and push both Docker images
5. Deploy both services to Cloud Run
6. Print the live URLs

---

## Option B — Manual step-by-step

### 1. Set your project

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="asia-south1"   # Mumbai — closest to Bengaluru

gcloud config set project $PROJECT_ID
```

### 2. Enable APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

### 3. Create Artifact Registry

```bash
gcloud artifacts repositories create venueflow \
  --repository-format=docker \
  --location=$REGION

gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

### 4. Set up Redis

**Option A — Cloud Memorystore (production grade):**
```bash
# Create a Basic tier instance (~$35/month)
gcloud redis instances create venueflow-redis \
  --size=1 \
  --region=$REGION \
  --tier=BASIC \
  --redis-version=redis_7_0

# Get the IP
REDIS_IP=$(gcloud redis instances describe venueflow-redis \
  --region=$REGION --format='get(host)')
REDIS_URL="redis://${REDIS_IP}:6379"
```

> Note: Memorystore requires a VPC connector for Cloud Run. See [VPC setup](#vpc-connector).

**Option B — Upstash (free tier, no VPC needed):**
1. Go to https://upstash.com
2. Create a Redis database → select region closest to `asia-south1`
3. Copy the `UPSTASH_REDIS_REST_URL` (use the `rediss://` TLS URL)

### 5. Store Redis URL as a secret

```bash
echo -n "$REDIS_URL" | gcloud secrets create venueflow-redis-url --data-file=-

# Grant Cloud Run access
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='get(projectNumber)')
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 6. Build and push API image

```bash
# From the VenueFlow-AI root directory:
docker build -f apps/api/Dockerfile \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/venueflow/venueflow-api:latest \
  .

docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/venueflow/venueflow-api:latest
```

### 7. Build and push Web image

```bash
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL="https://venueflow-api-XXXX-as.a.run.app" \
  --build-arg NEXT_PUBLIC_SOCKET_URL="https://venueflow-api-XXXX-as.a.run.app" \
  --build-arg NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIza..." \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="AIza..." \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com" \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id" \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app" \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789" \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="1:123:web:abc" \
  --build-arg NEXT_PUBLIC_USE_EMULATOR=false \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/venueflow/venueflow-web:latest \
  .

docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/venueflow/venueflow-web:latest
```

### 8. Deploy API

```bash
gcloud run deploy venueflow-api \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/venueflow/venueflow-api:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=${PROJECT_ID}" \
  --set-secrets="REDIS_URL=venueflow-redis-url:latest"

# Get the URL
API_URL=$(gcloud run services describe venueflow-api \
  --region=$REGION --format='get(status.url)')
echo "API URL: $API_URL"
```

### 9. Deploy Web

```bash
gcloud run deploy venueflow-web \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/venueflow/venueflow-web:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10

WEB_URL=$(gcloud run services describe venueflow-web \
  --region=$REGION --format='get(status.url)')
echo "Web URL: $WEB_URL"
```

### 10. Update CORS

```bash
gcloud run services update venueflow-api \
  --region=$REGION \
  --update-env-vars="CORS_ORIGINS=${WEB_URL}"
```

---

## Option C — Automated CI/CD with Cloud Build

Connect your GitHub repo to Cloud Build for automatic deploys on every push to `main`.

```bash
# 1. Connect repo in Cloud Console:
# https://console.cloud.google.com/cloud-build/triggers

# 2. Create a trigger pointing to cloudbuild.yaml
# 3. Set substitution variables in the trigger UI:
#    _REGION, _MAPS_API_KEY, _FIREBASE_API_KEY, etc.

# Or via CLI:
gcloud builds triggers create github \
  --repo-name="VenueFlow-AI" \
  --repo-owner="your-github-username" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --substitutions="_REGION=asia-south1,_MAPS_API_KEY=AIza..."
```

---

## VPC Connector (required for Cloud Memorystore)

If using Cloud Memorystore, Cloud Run needs a VPC connector to reach the private IP:

```bash
# Create connector
gcloud compute networks vpc-access connectors create venueflow-connector \
  --region=$REGION \
  --range=10.8.0.0/28

# Add to API deployment
gcloud run services update venueflow-api \
  --region=$REGION \
  --vpc-connector=venueflow-connector \
  --vpc-egress=private-ranges-only
```

---

## Post-deployment checklist

- [ ] Restrict Google Maps API key to `https://venueflow-web-*.run.app/*`
- [ ] Add web URL to Firebase Console → Authentication → Authorized domains
- [ ] Set `NEXT_PUBLIC_APP_URL` to your web URL and rebuild web image
- [ ] Set up Cloud Monitoring uptime checks on both service URLs
- [ ] Enable Cloud Run error reporting in Cloud Console

---

## Useful commands

```bash
# View live logs
gcloud run services logs read venueflow-api --region=$REGION --limit=50
gcloud run services logs read venueflow-web --region=$REGION --limit=50

# Update a single env var without redeploying
gcloud run services update venueflow-api \
  --region=$REGION \
  --update-env-vars="LOG_LEVEL=debug"

# Roll back to previous revision
gcloud run revisions list --service=venueflow-api --region=$REGION
gcloud run services update-traffic venueflow-api \
  --region=$REGION \
  --to-revisions=venueflow-api-00001-xxx=100

# Delete everything (cleanup)
gcloud run services delete venueflow-api --region=$REGION --quiet
gcloud run services delete venueflow-web --region=$REGION --quiet
gcloud artifacts repositories delete venueflow --location=$REGION --quiet
```

---

## Cost estimate (hackathon demo)

With `--min-instances=0` (scale to zero when idle):

| Service | Cost |
|---------|------|
| Cloud Run (both services, ~100 req/day) | ~$0/month (free tier) |
| Artifact Registry (~500MB images) | ~$0.05/month |
| Upstash Redis (free tier) | $0/month |
| Cloud Build (120 min/day free) | $0/month |
| **Total** | **~$0–$1/month** |
