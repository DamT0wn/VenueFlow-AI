import type {
  QueuePoint,
  QueueStatus,
  ZoneData,
} from '@venueflow/shared-types';
import {
  QueuePointSchema,
  queuePointKey,
  QUEUE_TTL_SECONDS,
  QUEUE_WAIT_COEFFICIENT,
  LOW_QUEUE_THRESHOLD_MINUTES,
  HIGH_QUEUE_THRESHOLD_MINUTES,
} from '@venueflow/shared-types';
import { VENUE_GRAPH } from '@venueflow/venue-data';
import { getRedis } from '../lib/redis';
import { logger } from '../lib/logger';

// ──────────────────────────────────────────────────────────────────────────────
// Queue status thresholds
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Determines queue status bucket from estimated wait time in minutes.
 *
 * @param {number} waitMinutes - Estimated wait in minutes
 * @returns {QueueStatus} 'low' | 'medium' | 'high'
 */
export function getQueueStatus(waitMinutes: number): QueueStatus {
  if (waitMinutes < LOW_QUEUE_THRESHOLD_MINUTES) return 'low';
  if (waitMinutes < HIGH_QUEUE_THRESHOLD_MINUTES) return 'medium';
  return 'high';
}

/**
 * Calculates estimated wait time from density using the baseline formula.
 * estimatedWaitMinutes = Math.round(density × QUEUE_WAIT_COEFFICIENT)
 *
 * @param {number} density - Crowd density 0–100
 * @returns {number} Estimated wait time in minutes (non-negative)
 */
export function calcWaitMinutes(density: number): number {
  return Math.max(0, Math.round(density * QUEUE_WAIT_COEFFICIENT));
}

// ──────────────────────────────────────────────────────────────────────────────
// Queue history (in-memory sparkline data)
// ──────────────────────────────────────────────────────────────────────────────

/** In-memory ring buffer of last 5 density readings per node */
const densityHistory = new Map<string, number[]>();

/**
 * Appends a density reading to the in-memory history ring buffer (max 5 entries).
 *
 * @param {string} nodeKey - Unique key (venueId:nodeId)
 * @param {number} density - Latest density reading
 * @returns {number[]} Array of up to 5 recent density readings
 */
function pushDensityHistory(nodeKey: string, density: number): number[] {
  const history = densityHistory.get(nodeKey) ?? [];
  history.push(density);
  if (history.length > 5) history.shift();
  densityHistory.set(nodeKey, history);
  return [...history];
}

// ──────────────────────────────────────────────────────────────────────────────
// Queue Service
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Computes queue point data for a single node given its current density.
 * Writes the result to Redis with a 60-second TTL.
 *
 * @param {string} venueId      - Venue ID
 * @param {string} nodeId       - Node ID
 * @param {ZoneData} zone       - Zone density data
 * @returns {Promise<QueuePoint>} Computed queue point
 */
export async function computeQueuePoint(
  venueId: string,
  nodeId: string,
  zone: ZoneData,
): Promise<QueuePoint> {
  const nodeKey = `${venueId}:${nodeId}`;
  const waitMinutes = calcWaitMinutes(zone.density);
  const status = getQueueStatus(waitMinutes);
  const history = pushDensityHistory(nodeKey, zone.density);

  // Resolve node name from venue graph
  const graphNode = VENUE_GRAPH.nodes.find((n) => n.id === nodeId);
  const nodeName = graphNode?.name ?? zone.name;
  const nodeType = graphNode?.type ?? 'section';

  const queuePoint: QueuePoint = {
    nodeId,
    nodeName,
    type: nodeType,
    currentDensity: zone.density,
    estimatedWaitMinutes: waitMinutes,
    status,
    densityHistory: history,
    updatedAt: new Date(),
  };

  // Persist to Redis with TTL
  const redis = getRedis();
  await redis.setex(
    queuePointKey(venueId, nodeId),
    QUEUE_TTL_SECONDS,
    JSON.stringify(queuePoint),
  );

  return queuePoint;
}

/**
 * Retrieves all queue points for a venue, sorted by status (high first).
 * Uses Redis MGET for a single batch read instead of N individual GETs.
 *
 * @param {string} venueId      - Venue ID
 * @param {ZoneData[]} zones    - Current zone data (used as fallback)
 * @returns {Promise<QueuePoint[]>} All queue points sorted high → medium → low
 */
export async function getAllQueuePoints(
  venueId: string,
  zones: ZoneData[],
): Promise<QueuePoint[]> {
  const redis = getRedis();
  const results: QueuePoint[] = [];

  // Only compute queues for nodes that have an associated zone
  const serviceNodes = VENUE_GRAPH.nodes.filter((n) =>
    ['food', 'restroom', 'gate', 'exit', 'first_aid'].includes(n.type),
  );

  if (serviceNodes.length === 0) return [];

  // ── Batch read all cache keys in a single MGET ────────────────────────────
  const cacheKeys = serviceNodes.map((n) => queuePointKey(venueId, n.id));
  const cachedValues = await redis.mget(...cacheKeys);

  const missingNodes: typeof serviceNodes = [];

  for (let i = 0; i < serviceNodes.length; i++) {
    const node = serviceNodes[i]!;
    const cached = cachedValues[i];

    if (cached) {
      try {
        const parsed: unknown = JSON.parse(cached);
        const qp = QueuePointSchema.parse(parsed);
        results.push(qp);
        continue;
      } catch {
        // Fall through to recompute
      }
    }
    missingNodes.push(node);
  }

  // ── Compute missing nodes (cache miss or parse failure) ───────────────────
  for (const node of missingNodes) {
    const matchedZone = zones.find(
      (z) => z.id.includes(node.id) || node.id.includes(z.id.replace('zone-', '')),
    ) ?? zones[0];

    if (matchedZone) {
      const qp = await computeQueuePoint(venueId, node.id, matchedZone);
      results.push(qp);
    }
  }

  // Sort: high → medium → low
  const ORDER: Record<QueueStatus, number> = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  logger.info({
    message: 'Queue points fetched',
    venueId,
    count: results.length,
    cacheHits: results.length - missingNodes.length,
  });

  return results;
}
