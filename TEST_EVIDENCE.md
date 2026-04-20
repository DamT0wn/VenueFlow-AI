# Test Evidence

Last updated: 2026-04-20

## Scope

This file captures repository-verified testing evidence for submission review.
It intentionally avoids claims that are not directly observable from repo artifacts or workflow configuration.

## CI Test Pipeline Evidence

From .github/workflows/ci.yml, the pipeline includes:
- Lint job
- Type-check job
- Unit and integration test job (Jest + Vitest)
- Security audit job (npm audit with high severity threshold)
- E2E job (Playwright)
- Accessibility job (axe-oriented Playwright run)

Reference: .github/workflows/ci.yml

## Current Test Asset Snapshot

Collected from the repository on 2026-04-20:
- Backend Jest test files: 14
- Estimated backend test cases: 88
- Frontend unit/integration test files under apps/web/__tests__: 11
- Playwright spec files under apps/web/e2e: 2

Notes:
- Test case estimate is based on counting lines matching it( or test( in backend test files.
- Frontend and Playwright counts are file counts, not assertion counts.

## Coverage Evidence

- Backend LCOV file present: apps/api/coverage/lcov.info
- Backend line coverage from LCOV totals (LH/LF): 85.83%
- Frontend LCOV file not found at apps/web/coverage/lcov.info during this snapshot

Important:
- Coverage values can drift as code changes.
- Treat this as a point-in-time snapshot, not a permanent guarantee.

## Repro Steps

From repo root:

1. Install dependencies
npm ci

2. Backend tests with coverage
cd apps/api
npx jest --coverage --runInBand

3. Frontend tests with coverage
cd ../web
npx vitest run --coverage

4. E2E tests
npx playwright install --with-deps chromium
npx playwright test

5. Full monorepo checks
cd ../..
npm run lint
npm run type-check
npm run test

## Interpretation Guidance

- Use this file as evidence support, not as a substitute for running CI.
- For final judging/submission, prefer the latest green CI run and attached workflow logs.
