import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { AppError, ErrorCode } from './errorHandler';

// ──────────────────────────────────────────────────────────────────────────────
// Rate limiters
// Uses in-memory store; swap for RedisStore in production for distributed limiting.
// ──────────────────────────────────────────────────────────────────────────────

const windowMs = env.RATE_LIMIT_WINDOW_MS;

/**
 * Public route limiter: 100 requests per minute per IP.
 * Applied to all read-only / unauthenticated endpoints.
 */
export const publicLimiter = rateLimit({
  windowMs,
  max: env.RATE_LIMIT_PUBLIC_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Trust X-Forwarded-For from Cloud Run / load balancer
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
    return (ip ?? req.ip ?? 'unknown').trim();
  },
  handler: (_req, _res, next) => {
    next(
      new AppError('Too many requests — please slow down', 429, ErrorCode.RATE_LIMIT_EXCEEDED),
    );
  },
});

/**
 * Write route limiter: 20 requests per minute per authenticated user.
 * Applied to POST/PATCH/DELETE endpoints that modify state.
 */
export const writeLimiter = rateLimit({
  windowMs,
  max: env.RATE_LIMIT_WRITE_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate-limit by user ID when authenticated, fall back to IP
    return req.user?.uid ?? req.ip ?? 'unknown';
  },
  handler: (_req, _res, next) => {
    next(
      new AppError(
        'Write rate limit exceeded — please wait before making more changes',
        429,
        ErrorCode.RATE_LIMIT_EXCEEDED,
      ),
    );
  },
});
