import type { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/firebaseAdmin';
import { AppError, ErrorCode } from './errorHandler';
import { logger } from '../lib/logger';

// ──────────────────────────────────────────────────────────────────────────────
// Augment Express Request type
// ──────────────────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        role?: string;
        venueId?: string;
      };
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Token verification middleware
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Verifies the Firebase ID token from the `Authorization: Bearer <token>` header.
 * Attaches the decoded token as `req.user` on success.
 *
 * @throws {AppError} 401 if token is missing or invalid
 */
export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('Missing or malformed Authorization header', 401, ErrorCode.UNAUTHORIZED));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await auth().verifyIdToken(token, /* checkRevoked */ true);

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded['role'] as string | undefined,
      venueId: decoded['venueId'] as string | undefined,
    };

    next();
  } catch (err: unknown) {
    logger.warn({ message: 'Auth: invalid token', error: (err as Error).message });
    next(new AppError('Invalid or expired token', 401, ErrorCode.UNAUTHORIZED));
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// RBAC middleware factory
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Middleware factory that enforces a required role on the authenticated user.
 * Must be used after `verifyToken`.
 *
 * @param {string} role - The required custom claim role value (e.g. 'admin')
 * @returns {Function} Express middleware
 * @throws {AppError} 403 if the user's role does not match
 *
 * @example
 * router.post('/alerts', verifyToken, requireRole('admin'), alertController.create)
 */
export function requireRole(role: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Unauthenticated', 401, ErrorCode.UNAUTHORIZED));
      return;
    }

    if (req.user.role !== role) {
      logger.warn({
        message: 'Auth: insufficient role',
        uid: req.user.uid,
        required: role,
        actual: req.user.role ?? 'none',
      });
      next(
        new AppError(
          `This action requires the '${role}' role`,
          403,
          ErrorCode.FORBIDDEN,
        ),
      );
      return;
    }

    next();
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Optional auth — attaches user if token present, does not block if absent
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Like `verifyToken` but does not fail on missing tokens.
 * Use for routes that serve both authenticated and anonymous users.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.slice(7);
    const decoded = await auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded['role'] as string | undefined,
      venueId: decoded['venueId'] as string | undefined,
    };
  } catch {
    // Token invalid — proceed as anonymous
  }

  next();
}
