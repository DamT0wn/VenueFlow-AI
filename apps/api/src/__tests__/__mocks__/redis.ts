/**
 * Manual mock for the Redis client.
 * Prevents real Redis connections during unit tests.
 */

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  mget: jest.fn().mockResolvedValue([]),
  del: jest.fn().mockResolvedValue(1),
  ping: jest.fn().mockResolvedValue('PONG'),
  quit: jest.fn().mockResolvedValue('OK'),
  on: jest.fn(),
};

export function getRedis() {
  return mockRedis;
}

export async function isRedisHealthy() {
  return true;
}

export async function closeRedis() {
  return;
}
