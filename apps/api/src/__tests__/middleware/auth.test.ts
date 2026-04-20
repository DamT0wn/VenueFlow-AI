import type { Request, Response, NextFunction } from 'express';
import { verifyToken, optionalAuth, requireRole } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { auth } from '../../lib/firebaseAdmin';

describe('auth middleware', () => {
  const getVerifyIdTokenMock = (): jest.Mock => {
    return (auth().verifyIdToken as unknown as jest.Mock);
  };

  beforeEach(() => {
    getVerifyIdTokenMock().mockReset();
  });

  it('verifyToken returns 401 when bearer token is missing', async () => {
    const req = { headers: {} } as Request;
    const next = jest.fn() as NextFunction;

    await verifyToken(req, {} as Response, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as unknown as jest.Mock).mock.calls[0]?.[0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('verifyToken returns 401 when bearer token is empty', async () => {
    const req = {
      headers: { authorization: 'Bearer   ' },
    } as unknown as Request;
    const next = jest.fn() as NextFunction;

    await verifyToken(req, {} as Response, next);

    expect(req.user).toBeUndefined();
    const err = (next as unknown as jest.Mock).mock.calls[0]?.[0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('verifyToken sets user and calls next for valid token', async () => {
    getVerifyIdTokenMock().mockResolvedValue({
      uid: 'u-valid',
      email: 'user@example.com',
      role: 'admin',
      venueId: 'venue-1',
    });

    const req = {
      headers: { authorization: 'Bearer good-token' },
    } as unknown as Request;
    const next = jest.fn() as NextFunction;

    await verifyToken(req, {} as Response, next);

    expect(req.user).toEqual({
      uid: 'u-valid',
      email: 'user@example.com',
      role: 'admin',
      venueId: 'venue-1',
    });
    expect(next).toHaveBeenCalledWith();
  });

  it('verifyToken returns 401 when Firebase rejects the token', async () => {
    getVerifyIdTokenMock().mockRejectedValue(new Error('invalid token'));

    const req = {
      headers: { authorization: 'Bearer bad-token' },
    } as unknown as Request;
    const next = jest.fn() as NextFunction;

    await verifyToken(req, {} as Response, next);

    expect(req.user).toBeUndefined();
    const err = (next as unknown as jest.Mock).mock.calls[0]?.[0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('optionalAuth always calls next without header', async () => {
    const next = jest.fn() as NextFunction;

    await optionalAuth({ headers: {} } as unknown as Request, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('optionalAuth skips auth when bearer token is empty', async () => {
    const req = {
      headers: { authorization: 'Bearer   ' },
    } as unknown as Request;
    const next = jest.fn() as NextFunction;

    await optionalAuth(req, {} as Response, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('optionalAuth sets user when token is valid', async () => {
    getVerifyIdTokenMock().mockResolvedValue({ uid: 'u-optional', role: 'user' });

    const req = {
      headers: { authorization: 'Bearer optional-token' },
    } as unknown as Request;
    const next = jest.fn() as NextFunction;

    await optionalAuth(req, {} as Response, next);

    expect(req.user).toEqual({ uid: 'u-optional', role: 'user' });
    expect(next).toHaveBeenCalledWith();
  });

  it('optionalAuth ignores invalid token and continues', async () => {
    getVerifyIdTokenMock().mockRejectedValue(new Error('optional auth failed'));

    const req = {
      headers: { authorization: 'Bearer bad-optional-token' },
    } as unknown as Request;
    const next = jest.fn() as NextFunction;

    await optionalAuth(req, {} as Response, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
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
