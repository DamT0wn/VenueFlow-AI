import express from 'express';
import request from 'supertest';
import { authSmokeRouter } from '../../routes/authSmoke';
import { errorHandler, notFoundHandler } from '../../middleware/errorHandler';
import { auth, db } from '../../lib/firebaseAdmin';

describe('auth smoke route', () => {
  const app = express();
  app.use('/api/auth', authSmokeRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  const getVerifyIdTokenMock = (): jest.Mock => auth().verifyIdToken as unknown as jest.Mock;
  const getDbMock = (): {
    collection: jest.Mock;
    doc: jest.Mock;
    get: jest.Mock;
  } => db() as unknown as { collection: jest.Mock; doc: jest.Mock; get: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    getVerifyIdTokenMock().mockResolvedValue({ uid: 'user-1', role: 'user' });
    getDbMock().get.mockResolvedValue({ exists: false, data: () => null });
  });

  it('returns 401 when auth header is missing', async () => {
    const res = await request(app).get('/api/auth/smoke');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when token is invalid', async () => {
    getVerifyIdTokenMock().mockRejectedValueOnce(new Error('invalid token'));

    const res = await request(app)
      .get('/api/auth/smoke')
      .set('Authorization', 'Bearer bad-token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns auth and firestore smoke payload for valid token', async () => {
    getDbMock().get.mockResolvedValueOnce({ exists: true, data: () => ({ uid: 'user-1' }) });

    const res = await request(app)
      .get('/api/auth/smoke')
      .set('Authorization', 'Bearer good-token');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.auth.uid).toBe('user-1');
    expect(res.body.firestore.profileExists).toBe(true);
    expect(typeof res.body.timestamp).toBe('string');
  });
});
