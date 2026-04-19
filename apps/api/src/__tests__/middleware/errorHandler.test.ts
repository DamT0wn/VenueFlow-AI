import type { Request, Response } from 'express';
import {
  errorHandler,
  AppError,
  ErrorCode,
  asyncHandler,
  notFoundHandler,
} from '../../middleware/errorHandler';

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

  it('maps non-operational AppError to safe 500 response', () => {
    const { res, getStatus, getPayload } = createRes();
    const err = new AppError('infra down', 503, ErrorCode.SERVICE_UNAVAILABLE, false);

    errorHandler(err, { path: '/x', method: 'GET' } as Request, res, jest.fn());

    expect(getStatus()).toBe(500);
    expect(getPayload().error.code).toBe('INTERNAL_ERROR');
  });

  it('maps non-Error values to safe 500 response', () => {
    const { res, getStatus, getPayload } = createRes();

    errorHandler('raw failure string', { path: '/x', method: 'GET' } as Request, res, jest.fn());

    expect(getStatus()).toBe(500);
    expect(getPayload().error.code).toBe('INTERNAL_ERROR');
  });

  it('asyncHandler forwards rejections to next', async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn();
    const wrapped = asyncHandler(async () => {
      throw new Error('boom');
    });

    wrapped(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('notFoundHandler forwards AppError with route details', () => {
    const next = jest.fn();
    const req = { method: 'PATCH', path: '/unknown' } as Request;

    notFoundHandler(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(404);
    expect(error.errorCode).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toContain('PATCH /unknown');
  });
});
