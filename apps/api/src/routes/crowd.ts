import { Router } from 'express';
import { z } from 'zod';
import { CrowdSnapshotSchema } from '@venueflow/shared-types';
import { getCrowdSnapshot } from '../services/crowdService';
import { asyncHandler, AppError, ErrorCode } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
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
    .regex(/^[a-z0-9\-_]+$/, 'VenueId must contain only lowercase, numbers, hyphens, underscores')
    .describe('Firebase venue document ID'),
});

const ResponseSchema = z.object({
  data: CrowdSnapshotSchema.describe('Latest crowd snapshot'),
  cached: z.boolean().describe('Whether response came from cache'),
  timestamp: z.string().datetime().describe('Response generation time'),
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/crowd/:venueId
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/crowd/:venueId
 *
 * Returns the latest real-time crowd snapshot for the specified venue.
 * Used to render crowd density heatmaps on the client.
 *
 * **Read Strategy** (multi-layer cache):
 * 1. In-memory (fastest, <1ms)
 * 2. Redis (distributed cache, <10ms, TTL 30s)
 * 3. Firestore (persistent fallback, cold start)
 *
 * **Response Format**:
 * ```json
 * {
 *   "data": {
 *     "venueId": "venue-chinnaswamy",
 *     "zones": [{ "id": "z1", "name": "North Stand", "density": 75, ... }],
 *     "capturedAt": "2024-04-19T17:00:00Z"
 *   },
 *   "cached": true,
 *   "timestamp": "2024-04-19T17:00:05Z"
 * }
 * ```
 *
 * **Status Codes**:
 * - 200: Success
 * - 400: Invalid venueId format
 * - 404: Venue not found (no snapshot available)
 * - 500: Server error (Firestore/Redis unavailable)
 *
 * **Parameters**:
 * - `venueId` (string, required): Venue identifier (e.g., "venue-wankhede")
 *
 * **Caching**:
 * - Responses are cached in Redis for 30 seconds
 * - In-memory cache updated on circuit simulator tick (every 5s)
 * - Cold start: Firestore fallback if cache miss
 *
 * **Rate Limiting**: No limit (public endpoint)
 *
 * **Authentication**: Not required
 *
 * **Example Request**:
 * ```
 * GET /api/crowd/venue-chinnaswamy
 * ```
 *
 * **Example Error (404)**:
 * ```json
 * {
 *   "error": {
 *     "code": "NOT_FOUND",
 *     "message": "No crowd data found for venue 'venue-unknown'",
 *     "statusCode": 404
 *   }
 * }
 * ```
 *
 * @param {string} venueId - Firebase venue document ID (alphanumeric, hyphens allowed)
 * @returns {Promise<{ data: CrowdSnapshot, cached: boolean, timestamp: string }>}
 * @throws {AppError} 400 if venueId format invalid
 * @throws {AppError} 404 if venue not found in any cache layer
 * @throws {AppError} 500 if database unavailable
 */
router.get(
  '/:venueId',
  validate(ParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { venueId } = req.params as z.infer<typeof ParamsSchema>;

    try {
      const startTime = Date.now();
      const snapshot = await getCrowdSnapshot(venueId);
      const duration = Date.now() - startTime;
      const cached = duration < 5; // Heuristic: <5ms likely from in-memory

      logger.info({
        message: 'Crowd snapshot served',
        venueId,
        duration,
        cached,
        zoneCount: snapshot.zones.length,
      });

      // Type-safe response
      const response = ResponseSchema.parse({
        data: snapshot,
        cached,
        timestamp: new Date().toISOString(),
      });

      res.json(response);
    } catch (err) {
      // Enhanced error logging
      if (err instanceof AppError) {
        logger.warn({
          message: 'Crowd snapshot request failed',
          venueId,
          errorCode: err.errorCode,
          statusCode: err.statusCode,
        });
        throw err;
      }

      // Unexpected error
      logger.error({
        message: 'Unexpected error fetching crowd snapshot',
        venueId,
        error: err instanceof Error ? err.message : String(err),
      });

      throw new AppError(
        'Failed to fetch crowd data',
        500,
        ErrorCode.INTERNAL_ERROR,
        false,
      );
    }
  }),
);

export { router as crowdRouter };
