/**
 * Jest global setup — sets required environment variables before any module loads.
 * This prevents the env.ts Zod validation from crashing during tests.
 */

// Set required env vars before any module is imported
process.env['NODE_ENV']            = 'test';
process.env['REDIS_URL']           = 'redis://localhost:6379';
process.env['FIREBASE_PROJECT_ID'] = 'demo-venueflow';
process.env['PORT']                = '3001';
