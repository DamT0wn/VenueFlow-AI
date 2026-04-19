import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { validate } from '../../middleware/validate';
import { AppError } from '../../middleware/errorHandler';

describe('validate middleware', () => {
  function runMiddleware(req: Partial<Request>, middleware: ReturnType<typeof validate>) {
    let nextError: unknown;
    const next: NextFunction = (err?: unknown) => {
      nextError = err;
    };

    middleware(req as Request, {} as Response, next);
    return nextError;
  }

  it('passes and coerces query values', () => {
    const schema = z.object({ limit: z.coerce.number().int().min(1).max(10) });
    const req: Partial<Request> = { query: { limit: '3' } };

    const err = runMiddleware(req, validate(schema, 'query'));

    expect(err).toBeUndefined();
    expect((req.query as any).limit).toBe(3);
  });

  it('returns AppError for invalid body', () => {
    const schema = z.object({ name: z.string().min(3) });
    const req: Partial<Request> = { body: { name: 'ab' } };

    const err = runMiddleware(req, validate(schema, 'body'));

    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(400);
    expect((err as AppError).errorCode).toBe('VALIDATION_ERROR');
  });

  it('supports params validation', () => {
    const schema = z.object({ venueId: z.string().regex(/^[a-z0-9\-_]+$/) });
    const req: Partial<Request> = { params: { venueId: 'venue-123' } };

    const err = runMiddleware(req, validate(schema, 'params'));

    expect(err).toBeUndefined();
  });
});
