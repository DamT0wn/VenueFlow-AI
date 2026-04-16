import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

// ──────────────────────────────────────────────────────────────────────────────
// Redis singleton with automatic reconnect strategy
// ──────────────────────────────────────────────────────────────────────────────

let redisClient: Redis | null = null;

/**
 * Returns the Redis client singleton.
 * Creates the client on first call with the configured REDIS_URL.
 * Automatically reconnects with exponential backoff on disconnection.
 *
 * @returns {Redis} ioredis client instance
 */
export function getRedis(): Redis {
  if (redisClient) return redisClient;

  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times: number): number | null {
      if (times > 10) {
        logger.error({ message: 'Redis: max reconnection attempts reached', times });
        return null; // stop retrying
      }
      // Exponential backoff capped at 10 seconds
      return Math.min(times * 200, 10_000);
    },
    reconnectOnError(err: Error): boolean {
      // Reconnect on READONLY errors (Redis Cluster failover)
      return err.message.toUpperCase().includes('READONLY');
    },
  });

  redisClient.on('connect', () => {
    logger.info({ message: 'Redis: connected' });
  });

  redisClient.on('error', (err: Error) => {
    logger.error({ message: 'Redis: connection error', error: err.message });
  });

  redisClient.on('close', () => {
    logger.warn({ message: 'Redis: connection closed' });
  });

  return redisClient;
}

/**
 * Checks Redis connectivity for the /health endpoint.
 *
 * @returns {Promise<boolean>} true if Redis responds to PING within 2 seconds
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const pong = await Promise.race<string | null>([
      getRedis().ping(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2_000)),
    ]);
    return pong === 'PONG';
  } catch {
    return false;
  }
}

/**
 * Gracefully shuts down the Redis connection.
 * Call during SIGTERM / process exit handlers.
 *
 * @returns {Promise<void>}
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
