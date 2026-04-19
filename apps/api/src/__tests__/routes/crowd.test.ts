import express from 'express';
import request from 'supertest';
import { crowdRouter } from '../../routes/crowd';
import { errorHandler, notFoundHandler, AppError, ErrorCode } from '../../middleware/errorHandler';
import * as crowdService from '../../services/crowdService';

jest.mock('../../services/crowdService');

describe('crowd route', () => {
  const app = express();
  app.use('/api/crowd', crowdRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with crowd payload for valid venue id', async () => {
    const snapshot = {
      venueId: 'venue-test',
      zones: [
        {
          id: 'z1',
          name: 'North Stand',
          density: 55,
          lat: 12.98,
          lng: 77.6,
          radius: 100,
          updatedAt: new Date(),
        },
      ],
      capturedAt: new Date(),
    };

    jest.spyOn(crowdService, 'getCrowdSnapshot').mockResolvedValue(snapshot as any);

    const res = await request(app).get('/api/crowd/venue-test');

    expect(res.status).toBe(200);
    expect(res.body.data.venueId).toBe('venue-test');
    expect(res.body.data.zones).toHaveLength(1);
    expect(typeof res.body.cached).toBe('boolean');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('returns 400 for invalid venue id format', async () => {
    const res = await request(app).get('/api/crowd/INVALID_ID');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when service throws AppError NOT_FOUND', async () => {
    jest
      .spyOn(crowdService, 'getCrowdSnapshot')
      .mockRejectedValue(new AppError('Not found', 404, ErrorCode.NOT_FOUND));

    const res = await request(app).get('/api/crowd/venue-missing');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 500 for unexpected service failure', async () => {
    jest.spyOn(crowdService, 'getCrowdSnapshot').mockRejectedValue(new Error('boom'));

    const res = await request(app).get('/api/crowd/venue-test');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });
});
