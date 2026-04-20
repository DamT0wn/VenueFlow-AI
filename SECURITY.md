# Security Notes

Last updated: 2026-04-20

## Security Posture Summary

VenueFlow AI includes multiple baseline protections in API, validation, and deployment flow.
Current posture is suitable for a demo/prototype with clear hardening tasks before production-grade rollout.

## Implemented Controls (Code-Level)

1. HTTP hardening via Helmet
- Content Security Policy configuration
- HSTS in production
- Frame denial
- MIME sniffing protection
Reference: apps/api/src/app.ts

2. Rate limiting
- Public API limiter
- Stricter write limiter
- Structured 429 handling
Reference: apps/api/src/middleware/rateLimiter.ts

3. Request validation
- Zod-based validation middleware
- Structured error conversion for invalid input
Reference: apps/api/src/middleware/validate.ts

4. Authentication and authorization hooks
- Firebase token verification middleware
- Role-gated middleware for privileged endpoints
Reference: apps/api/src/middleware/auth.ts

5. Secrets handling in deployment docs/scripts
- Redis URL stored via Secret Manager
- Deployment docs include IAM updates for service access
References: DEPLOY.md, deploy.sh

## Operational Security in CI

The CI workflow includes:
- npm audit with high severity threshold for app workspaces
- Linting and type-checking gates
- Automated test execution
Reference: .github/workflows/ci.yml

## Known Gaps / Limits

1. In-memory rate limiting store
- Current limiter uses process memory.
- In multi-instance deployments, limits are not globally shared.

2. Demo-first behavior in parts of the app
- Some user flows/pages still rely on simulated or seeded data.
- Claims should avoid implying full production parity.

3. Dependency health sensitivity
- API health depends on Redis and Firestore reachability.
- Incorrect Cloud Run networking/IAM can surface degraded status.

4. Security evidence centralization
- Security checks exist, but there is no single generated security report artifact in-repo yet.

## Priority Hardening Backlog (Practical)

1. Move rate limiting to shared store (Redis-backed limiter)
2. Add dependency and secrets scans in CI (for example: Gitleaks/Trivy)
3. Add explicit CSP and CORS review checklist per environment
4. Add routine patch cadence for npm dependencies
5. Add incident response runbook for degraded /health and auth failures

## Reviewer Guidance

- This file is a factual snapshot, not a compliance certification.
- Validate with latest CI run logs and deployment configuration before final submission.
