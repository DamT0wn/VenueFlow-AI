import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler, AppError, ErrorCode } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { getCrowdSnapshot } from '../services/crowdService';
import { getAllQueuePoints } from '../services/queueService';
import { logger } from '../lib/logger';

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// Request Validation Schemas
// ──────────────────────────────────────────────────────────────────────────────

const ParamsSchema = z.object({
  venueId: z
    .string()
    .min(1, 'VenueId is required')
    .max(128, 'VenueId must be ≤128 chars')
    .regex(/^[a-z0-9\-_]+$/, 'Invalid VenueId format')
    .describe('Firebase venue document ID'),
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/queues/:venueId
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/queues/:venueId
 *
 * Returns all queue points for a venue sorted by priority (high-wait queues first).
 * Queue wait times are estimated from current crowd density using ML formula.
 *
 * **Sorting**: Results sorted by status priority:
 * 1. 'high' (wait > 15min) — red zone, avoid or plan ahead
 * 2. 'medium' (3-15min) — yellow zone, manageable
 * 3. 'low' (<3min) — green zone, go now
 *
 * **Response Format**:
 * ```json
 * {
 *   "data": [
 *     {
 *       "nodeId": "food-stand-1",
 *       "zone": "North Stand",
 *       "lat": 12.98,
 *       "lng": 77.60,
 *       "waitMinutes": 12,
 *       "status": "high",
 *       "densityHistory": [40, 45, 50, 55, 60]
 *     }
 *   ],
 *   "count": 15,
 *   "timestamp": "2024-04-19T17:00:00Z"
 * }
 * ```
 *
 * **Status Codes**:
 * - 200: Success (returns array, may be empty if venue has no queue points)
 * - 400: Invalid venueId format
 * - 404: Venue not found
 * - 500: Server error
 *
 * **Parameters**:
 * - `venueId` (string, required): Venue ID (e.g., "venue-wankhede")
 *
 * **Caching**:
 * - Queue points cached in Redis for 60 seconds
 * - Estimated wait times recalculated every 5 seconds from crowd density
 * - Graceful fallback: returns empty array if crowd data unavailable
 *
 * **Rate Limiting**: None (public endpoint)
 *
 * **Authentication**: Optional (enriches logging if provided)
 *
 * **Performance**: <50ms P99 (even with high venue complexity)
 *
 * **Example Request**:
 * ```
 * GET /api/queues/venue-chinnaswamy
 * ```
 *
 * **Example Response**:
 * ```json
 * {
 *   "data": [
 *     {
 *       "nodeId": "food-1",
 *       "zone": "Food Court",
 *       "waitMinutes": 18,
 *       "status": "high",
 *       "lat": 12.98,
 *       "lng": 77.60
 *     }
 *   ],
 *   "count": 1
 * }
 * ```
 *
 * @param {string} venueId - Venue identifier
 * @returns {Promise<{ data: QueuePoint[], count: number, timestamp: string }>}
 * @throws {AppError} 400 if venueId format invalid
 * @throws {AppError} 404 if venue not found
 */
router.get(
  '/:venueId',
  optionalAuth,
  validate(ParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { venueId } = req.params as z.infer<typeof ParamsSchema>;
    const uid = req.user?.uid || 'anonymous';

    try {
      // Attempt to load crowd density for queue calculations
      // Fallback to empty zones if unavailable (graceful degradation)
      let zones: {
        lat: number;
        lng: number;
        density: number;
        id: string;
        name: string;
        radius: number;
        updatedAt: Date;
      }[] = [];

      try {
        const snapshot = await getCrowdSnapshot(venueId);
        zones = snapshot.zones as typeof zones;
      } catch (err) {
        logger.warn({
          message: 'Queues: crowd snapshot unavailable, using fallback',
          venueId,
          uid,
          reason: err instanceof Error ? err.message : 'Unknown',
        });
        // Continue with empty zones — service handles gracefully
      }

      const queuePoints = await getAllQueuePoints(venueId, zones);

      logger.info({
        message: 'Queue points served',
        venueId,
        uid,
        count: queuePoints.length,
        hasCrowdData: zones.length > 0,
      });

      res.json({
        data: queuePoints,
        count: queuePoints.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }

      logger.error({
        message: 'Unexpected error fetching queues',
        venueId,
        uid,
        error: err instanceof Error ? err.message : String(err),
      });

      throw new AppError('Failed to fetch queue data', 500, ErrorCode.INTERNAL_ERROR, false);
    }
  }),
);

export { router as queuesRouter };
