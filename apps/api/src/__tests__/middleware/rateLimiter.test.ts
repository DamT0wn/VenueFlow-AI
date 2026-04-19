import express from 'express';
import request from 'supertest';
import { publicLimiter, writeLimiter } from '../../middleware/rateLimiter';

describe('rate limiter middleware', () => {
  it('publicLimiter allows request and sets standard rate-limit headers', async () => {
    const app = express();
    app.set('trust proxy', 1);
    app.use(publicLimiter);
    app.get('/r', (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/r').set('x-forwarded-for', '1.2.3.4');

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty('ratelimit-policy');
  });

  it('writeLimiter allows authenticated-style request and sets headers', async () => {
    const app = express();
    app.use((req, _res, next) => {
      req.user = { uid: 'user-123', role: 'user' };
      next();
    });
    app.use(writeLimiter);
    app.post('/w', (_req, res) => res.json({ ok: true }));

    const res = await request(app).post('/w');

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty('ratelimit-policy');
  });
});
