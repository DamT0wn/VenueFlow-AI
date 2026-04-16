import type { Server as SocketIOServer } from 'socket.io';
import type { CrowdUpdateEvent } from '@venueflow/shared-types';
import {
  CROWD_UPDATE_INTERVAL_MS,
  VENUE_ROOM_PREFIX,
} from '@venueflow/shared-types';
import {
  seedCrowdSnapshot,
  getCurrentSnapshot,
  saveCrowdSnapshot,
  generateNextSnapshot,
} from '../services/crowdService';
import { logger } from '../lib/logger';

// ──────────────────────────────────────────────────────────────────────────────
// Venue IDs to simulate — in production these come from Firestore
// ──────────────────────────────────────────────────────────────────────────────

const SIMULATE_VENUES = ['venue-stadium-one'];

let simulatorInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Starts the crowd density simulator.
 * Every CROWD_UPDATE_INTERVAL_MS (5 seconds):
 *   1. Generates a new CrowdSnapshot with realistic density drift
 *   2. Persists the snapshot to Redis (30s TTL)
 *   3. Emits a `crowd:update` socket event to the venue room
 *
 * @param {SocketIOServer} io - Socket.io server for broadcasting updates
 * @returns {void}
 */
export function startCrowdSimulator(io: SocketIOServer): void {
  if (simulatorInterval) {
    logger.warn({ message: 'CrowdSimulator: already running' });
    return;
  }

  // Seed initial data for all venues
  for (const venueId of SIMULATE_VENUES) {
    seedCrowdSnapshot(venueId);
    logger.info({ message: 'CrowdSimulator: seeded venue', venueId });
  }

  simulatorInterval = setInterval(() => {
    for (const venueId of SIMULATE_VENUES) {
      const current = getCurrentSnapshot(venueId);
      if (!current) continue;

      const next = generateNextSnapshot(current);

      // Persist asynchronously — errors are logged and swallowed
      saveCrowdSnapshot(next).catch((err: unknown) => {
        logger.error({
          message: 'CrowdSimulator: failed to persist snapshot',
          venueId,
          error: (err as Error).message,
        });
      });

      // Broadcast to all clients in this venue's room
      const room = `${VENUE_ROOM_PREFIX}${venueId}`;
      const payload: CrowdUpdateEvent = { venueId, snapshot: next };
      io.to(room).emit('crowd:update', payload);
    }
  }, CROWD_UPDATE_INTERVAL_MS);

  logger.info({
    message: 'CrowdSimulator: started',
    intervalMs: CROWD_UPDATE_INTERVAL_MS,
    venues: SIMULATE_VENUES,
  });
}

/**
 * Stops the crowd simulator. Call before graceful server shutdown.
 *
 * @returns {void}
 */
export function stopCrowdSimulator(): void {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    logger.info({ message: 'CrowdSimulator: stopped' });
  }
}
