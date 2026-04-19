import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

// ──────────────────────────────────────────────────────────────────────────────
// Error codes enum
// ──────────────────────────────────────────────────────────────────────────────

export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_GATEWAY: 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

// ──────────────────────────────────────────────────────────────────────────────
// AppError class
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Structured application error that maps cleanly to an HTTP response.
 *
 * @param message   Human-readable message returned to the client
 * @param statusCode HTTP status code (4xx = client error, 5xx = server error)
 * @param errorCode  Machine-readable error code for client-side handling
 * @param isOperational  true = expected error (log as warn); false = unexpected (log as error)
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCodeValue;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    errorCode: ErrorCodeValue = ErrorCode.INTERNAL_ERROR,
    isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Async route wrapper — eliminates try/catch boilerplate in route handlers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Wraps an async Express route handler and forwards rejections to `next`.
 *
 * @param fn - Async Express handler
 * @returns Synchronous Express middleware
 *
 * @example
 * router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Centralised error handler middleware
// Must be registered LAST in the Express middleware chain.
// ──────────────────────────────────────────────────────────────────────────────

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}

/**
 * Centralised Express error handler.
 * Maps AppError and ZodError instances to structured HTTP responses.
 * Unexpected errors produce a generic 500 response without leaking internals.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError && err.isOperational) {
    logger.warn({
      message: 'AppError',
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      errorMessage: err.message,
    });

    const body: ErrorResponse = {
      error: {
        code: err.errorCode,
        message: err.message,
        statusCode: err.statusCode,
      },
    };

    res.status(err.statusCode).json(body);
    return;
  }

  // Unexpected / programmer errors — log full details, return safe response
  logger.error({
    message: 'Unhandled error',
    path: req.path,
    method: req.method,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  const body: ErrorResponse = {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      statusCode: 500,
    },
  };

  res.status(500).json(body);
}

// ──────────────────────────────────────────────────────────────────────────────
// 404 handler — catches routes that matched no other handler
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Catches unmatched routes and forwards a 404 AppError.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404, ErrorCode.NOT_FOUND));
}
