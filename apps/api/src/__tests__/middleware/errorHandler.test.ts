import type { Request, Response } from 'express';
import { errorHandler, AppError, ErrorCode } from '../../middleware/errorHandler';

describe('errorHandler middleware', () => {
  function createRes() {
    let statusCode = 0;
    let payload: any;

    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: any) {
        payload = body;
        return this;
      },
    } as unknown as Response;

    return {
      res,
      getStatus: () => statusCode,
      getPayload: () => payload,
    };
  }

  it('maps operational AppError to structured response', () => {
    const { res, getStatus, getPayload } = createRes();
    const err = new AppError('Bad input', 400, ErrorCode.VALIDATION_ERROR);

    errorHandler(err, { path: '/x', method: 'GET' } as Request, res, jest.fn());

    expect(getStatus()).toBe(400);
    expect(getPayload().error.code).toBe('VALIDATION_ERROR');
    expect(getPayload().error.message).toContain('Bad input');
  });

  it('maps unexpected error to safe 500 response', () => {
    const { res, getStatus, getPayload } = createRes();

    errorHandler(new Error('secret stack trace'), { path: '/x', method: 'GET' } as Request, res, jest.fn());

    expect(getStatus()).toBe(500);
    expect(getPayload().error.code).toBe('INTERNAL_ERROR');
    expect(getPayload().error.message).toBe('An unexpected error occurred');
  });
});
