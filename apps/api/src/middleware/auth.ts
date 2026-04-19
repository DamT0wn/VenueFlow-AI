import type { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from './errorHandler';
import { logger } from '../lib/logger';

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
 * Auth completely bypassed — login removed for hackathon demo.
 * verifyToken is a no-op passthrough; req.user is set to a guest identity.
 */
export async function verifyToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  req.user = { uid: 'guest', role: 'user' };
  next();
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

/** No-op optional auth — login removed for hackathon demo. */
export async function optionalAuth(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  next();
}
