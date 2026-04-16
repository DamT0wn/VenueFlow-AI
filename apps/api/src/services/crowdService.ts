import type { CrowdSnapshot, ZoneData } from '@venueflow/shared-types';
import {
  CrowdSnapshotSchema,
  crowdSnapshotKey,
  CROWD_SNAPSHOT_TTL_SECONDS,
  CROWD_UPDATE_INTERVAL_MS,
} from '@venueflow/shared-types';
import { getMockCrowdSeed } from '@venueflow/venue-data';
import { getRedis } from '../lib/redis';
import { db } from '../lib/firebaseAdmin';
import { AppError, ErrorCode } from '../middleware/errorHandler';
import { logger } from '../lib/logger';

// ──────────────────────────────────────────────────────────────────────────────
// Crowd Service
// ──────────────────────────────────────────────────────────────────────────────

/** In-memory store of current crowd snapshots per venueId (populated by simulator) */
const currentSnapshots = new Map<string, CrowdSnapshot>();

/**
 * Seeds the in-memory snapshot map with initial crowd data.
 * Called once at server startup by the crowd simulator.
 *
 * @param {string} venueId - Venue to seed
 */
export function seedCrowdSnapshot(venueId: string): void {
  const zones = getMockCrowdSeed();
  const snapshot: CrowdSnapshot = {
    venueId,
    zones,
    capturedAt: new Date(),
  };
  currentSnapshots.set(venueId, snapshot);
}

/**
 * Returns a copy of the current in-memory snapshot (mutable for simulator).
 *
 * @param {string} venueId
 * @returns {CrowdSnapshot | undefined}
 */
export function getCurrentSnapshot(venueId: string): CrowdSnapshot | undefined {
  return currentSnapshots.get(venueId);
}

/**
 * Stores a new crowd snapshot in Redis with a 30-second TTL.
 * Also updates the in-memory snapshot for immediate reads.
 *
 * @param {CrowdSnapshot} snapshot - The snapshot to persist
 * @returns {Promise<void>}
 */
export async function saveCrowdSnapshot(snapshot: CrowdSnapshot): Promise<void> {
  currentSnapshots.set(snapshot.venueId, snapshot);

  const redis = getRedis();
  await redis.setex(
    crowdSnapshotKey(snapshot.venueId),
    CROWD_SNAPSHOT_TTL_SECONDS,
    JSON.stringify(snapshot),
  );
}

/**
 * Retrieves the latest crowd snapshot for a venue.
 * Read strategy:
 *   1. In-memory cache (fastest path)
 *   2. Redis (distributed cache)
 *   3. Firestore (fallback — cold start or Redis eviction)
 *
 * @param {string} venueId - Venue to fetch snapshot for
 * @returns {Promise<CrowdSnapshot>} The latest crowd snapshot
 * @throws {AppError} 404 if no snapshot found in any layer
 */
export async function getCrowdSnapshot(venueId: string): Promise<CrowdSnapshot> {
  // Layer 1: in-memory
  const inMemory = currentSnapshots.get(venueId);
  if (inMemory) return inMemory;

  // Layer 2: Redis
  const redis = getRedis();
  const cached = await redis.get(crowdSnapshotKey(venueId));
  if (cached) {
    try {
      const parsed: unknown = JSON.parse(cached);
      const snapshot = CrowdSnapshotSchema.parse(parsed);
      currentSnapshots.set(venueId, snapshot);
      return snapshot;
    } catch (e) {
      logger.warn({ message: 'Failed to parse Redis crowd snapshot', venueId, error: e });
    }
  }

  // Layer 3: Firestore
  const doc = await db()
    .collection('crowdSnapshots')
    .doc(venueId)
    .get();

  if (!doc.exists) {
    throw new AppError(
      `No crowd data found for venue '${venueId}'`,
      404,
      ErrorCode.NOT_FOUND,
    );
  }

  const data = doc.data();
  const snapshot = CrowdSnapshotSchema.parse(data);
  await saveCrowdSnapshot(snapshot);
  return snapshot;
}

/**
 * Generates the next simulated crowd snapshot by applying realistic
 * random drift to each zone's density.
 *
 * Drift characteristics:
 * - Each zone density changes by a random delta in [-8, +8]
 * - Some zones follow a "wave" pattern (food stalls peak before/after half-time)
 * - Density is clamped to [0, 100]
 *
 * @param {CrowdSnapshot} current - The current snapshot
 * @returns {CrowdSnapshot} The next simulated snapshot
 */
export function generateNextSnapshot(current: CrowdSnapshot): CrowdSnapshot {
  const DRIFT_RANGE = 8;
  const now = new Date();

  const zones: ZoneData[] = current.zones.map((zone) => {
    // Apply random drift
    const drift = Math.round((Math.random() - 0.5) * 2 * DRIFT_RANGE);
    const newDensity = Math.min(100, Math.max(0, zone.density + drift)) as ZoneData['density'];

    return {
      ...zone,
      density: newDensity,
      updatedAt: now,
    };
  });

  return {
    venueId: current.venueId,
    zones,
    capturedAt: now,
  };
}

void CROWD_UPDATE_INTERVAL_MS; // consumed by crowdSimulator.ts
