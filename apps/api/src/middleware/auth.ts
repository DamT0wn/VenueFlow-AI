import type { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from './errorHandler';
import { logger } from '../lib/logger';
import { auth } from '../lib/firebaseAdmin';

// ──────────────────────────────────────────────────────────────────────────────
// Augment Express Request type
// ──────────────────────────────────────────────────────────────────────────────

declare global {
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
 * Verifies Firebase ID token from Authorization header.
 * Requires `Authorization: Bearer <idToken>`.
 */
export async function verifyToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers?.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('Missing or malformed Authorization header', 401, ErrorCode.UNAUTHORIZED));
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    next(new AppError('Missing authentication token', 401, ErrorCode.UNAUTHORIZED));
    return;
  }

  try {
    const decoded = await auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      ...(decoded.email ? { email: decoded.email } : {}),
      role: typeof decoded['role'] === 'string' ? decoded['role'] : 'user',
      ...(typeof decoded['venueId'] === 'string' ? { venueId: decoded['venueId'] } : {}),
    };
    next();
  } catch (err) {
    logger.warn({
      message: 'Auth: token verification failed',
      error: (err as Error).message,
    });
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
 * Optional auth — attaches req.user when a valid token is provided,
 * but continues unauthenticated if header is absent.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers?.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = await auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      ...(decoded.email ? { email: decoded.email } : {}),
      role: typeof decoded['role'] === 'string' ? decoded['role'] : 'user',
      ...(typeof decoded['venueId'] === 'string' ? { venueId: decoded['venueId'] } : {}),
    };
  } catch {
    // Intentionally swallow token errors for optional auth paths.
  }

  next();
}
