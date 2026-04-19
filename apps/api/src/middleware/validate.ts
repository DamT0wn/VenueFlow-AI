import type { Request, Response, NextFunction } from 'express';
import { ZodType, ZodTypeDef, ZodError } from 'zod';
import { AppError, ErrorCode } from './errorHandler';

type RequestPart = 'body' | 'params' | 'query';

/**
 * Middleware factory that validates a request part against a Zod schema.
 * Returns 400 with structured error details on validation failure.
 *
 * @param schema - Zod schema to validate against
 * @param part   - Which part of the request to validate ('body' | 'params' | 'query')
 * @returns Express middleware
 *
 * @example
 * router.post('/alerts', verifyToken, validate(CreateAlertSchema), createAlert)
 */
export function validate<TOutput, TInput = TOutput>(
  schema: ZodType<TOutput, ZodTypeDef, TInput>,
  part: RequestPart = 'body',
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (result.success) {
      // Overwrite the request part with the validated+coerced value
      // Using type assertion here is intentional — we've validated the shape
      (req as unknown as Record<string, unknown>)[part] = result.data;
      next();
      return;
    }

    const error = result.error as ZodError;
    const issues = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    next(
      new AppError(
        `Validation failed: ${issues.map((i) => `${i.path} — ${i.message}`).join('; ')}`,
        400,
        ErrorCode.VALIDATION_ERROR,
      ),
    );
  };
}
