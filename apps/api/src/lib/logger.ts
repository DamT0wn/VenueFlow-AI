import winston from 'winston';
import { env } from '../config/env';

// ──────────────────────────────────────────────────────────────────────────────
// Winston structured logger
// Production: outputs JSON to stdout for Google Cloud Logging ingestion.
// Development: pretty-prints with colours.
// ──────────────────────────────────────────────────────────────────────────────

const isDev = env.NODE_ENV !== 'production';

/**
 * Structured application logger.
 * Always log objects: logger.info({ message: '...', ...context })
 */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: isDev
    ? winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...rest }) => {
          const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
          return `${String(timestamp)} [${level}] ${String(message)}${extra}`;
        }),
      )
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(), // Google Cloud Logging JSON format
      ),
  transports: [new winston.transports.Console()],
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
});
