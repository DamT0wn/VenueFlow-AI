import type { Request, Response, NextFunction } from 'express';
import { verifyToken, optionalAuth, requireRole } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

describe('auth middleware', () => {
  it('verifyToken sets guest user and calls next', async () => {
    const req = {} as Request;
    const next = jest.fn() as NextFunction;

    await verifyToken(req, {} as Response, next);

    expect(req.user).toEqual({ uid: 'guest', role: 'user' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('optionalAuth always calls next', async () => {
    const next = jest.fn() as NextFunction;

    await optionalAuth({} as Request, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('requireRole returns 401 when req.user is missing', () => {
    const req = {} as Request;
    const next = jest.fn() as unknown as NextFunction;

    requireRole('admin')(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as unknown as jest.Mock).mock.calls[0]?.[0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.errorCode).toBe('UNAUTHORIZED');
  });

  it('requireRole returns 403 for mismatched role', () => {
    const req = { user: { uid: 'u1', role: 'user' } } as Request;
    const next = jest.fn() as unknown as NextFunction;

    requireRole('admin')(req, {} as Response, next);

    const err = (next as unknown as jest.Mock).mock.calls[0]?.[0] as AppError;
    expect(err.statusCode).toBe(403);
    expect(err.errorCode).toBe('FORBIDDEN');
  });

  it('requireRole passes when role matches', () => {
    const req = { user: { uid: 'u1', role: 'admin' } } as Request;
    const next = jest.fn() as NextFunction;

    requireRole('admin')(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });
});
