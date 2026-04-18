import type { Application } from 'express';

/**
 * Serves OpenAPI/Swagger docs in development.
 * Stub — install @scalar/express-api-reference to enable full docs.
 */
export function serveApiDocs(app: Application): void {
  app.get('/api/docs', (_req, res) => {
    res.json({ message: 'API docs not configured. See README for endpoint reference.' });
  });
}
