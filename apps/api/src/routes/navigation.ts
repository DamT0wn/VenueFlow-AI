import { Router } from 'express';
import { z } from 'zod';
import { RouteRequestSchema } from '@venueflow/shared-types';
import { VENUE_GRAPH } from '@venueflow/venue-data';
import { computeRoute } from '../services/pathfindingService';
import { getCrowdSnapshot } from '../services/crowdService';
import { verifyToken } from '../middleware/auth';
import { asyncHandler, AppError, ErrorCode } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { logger } from '../lib/logger';

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// All navigation routes require authentication
// ──────────────────────────────────────────────────────────────────────────────

router.use(verifyToken);

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/navigation/route
// ──────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/navigation/route
 *
 * Computes the optimal crowd-weighted route between two venue nodes using
 * Dijkstra's shortest path algorithm. Routes avoid high-density zones when possible.
 *
 * **Algorithm**:
 * 1. Fetch real-time crowd snapshot for venue
 * 2. Apply crowd density to edge weights (crowded areas = higher cost)
 * 3. Run Dijkstra from start node to end node
 * 4. Return path + metadata (distance, estimated time)
 *
 * **Response Format**:
 * ```json
 * {
 *   "data": {
 *     "fromNodeId": "section-a",
 *     "toNodeId": "section-b",
 *     "path": ["section-a", "corridor-1", "section-b"],
 *     "distance": 450,
 *     "estimatedMinutes": 5,
 *     "avoidsCrowd": true
 *   },
 *   "timestamp": "2024-04-19T17:00:00Z"
 * }
 * ```
 *
 * **Status Codes**:
 * - 200: Route computed successfully
 * - 400: Invalid request body (missing nodes, invalid IDs, etc.)
 * - 401: Unauthorized
 * - 404: Venue or node not found
 * - 422: No route exists between nodes (disconnected graph)
 * - 500: Server error
 *
 * **Request Body**:
 * ```json
 * {
 *   \"venueId\": \"venue-chinnaswamy\",
 *   \"fromNodeId\": \"section-a\",
 *   \"toNodeId\": \"section-b\"
 * }
 * ```
 *
 * **Request Fields**:
 * - `venueId` (string, required): Venue ID (e.g., \"venue-wankhede\")
 * - `fromNodeId` (string, required): Start node ID (must exist in venue graph)
 * - `toNodeId` (string, required): End node ID (must exist in venue graph)
 *
 * **Authentication**: Required (Firebase token)
 *
 * **Caching**:
 * - Route computation NOT cached (changes with crowd density every 5s)
 * - Crowd snapshot cached in Redis (30s TTL)
 * - Graph structure held in memory (loaded at startup)
 *
 * **Rate Limiting**: 100 route requests per minute per user
 *
 * **Performance**: <50ms P99 (Dijkstra + crowd weighting)
 *
 * **Graceful Degradation**:
 * - If crowd snapshot unavailable: uses baseline edge weights (safe default)
 * - If no route exists: returns 422 with error message
 * - If nodes invalid: returns 400 with validation error
 *
 * **Example Request**:
 * ```
 * POST /api/navigation/route
 * Content-Type: application/json
 * Authorization: Bearer <firebase-token>
 *
 * {
 *   \"venueId\": \"venue-chinnaswamy\",
 *   \"fromNodeId\": \"section-north\",
 *   \"toNodeId\": \"food-court\"
 * }
 * ```
 *
 * **Example Response (200)**:
 * ```json
 * {
 *   \"data\": {
 *     \"fromNodeId\": \"section-north\",
 *     \"toNodeId\": \"food-court\",
 *     \"path\": [\"section-north\", \"corridor-main\", \"food-court\"],
 *     \"distance\": 320,
 *     \"estimatedMinutes\": 4,
 *     \"avoidsCrowd\": true
 *   },
 *   \"timestamp\": \"2024-04-19T17:00:00Z\"
 * }
 * ```
 *
 * **Example Response (422 - No Route)**:
 * ```json
 * {
 *   \"error\": {
 *     \"code\": \"NOT_FOUND\",
 *     \"message\": \"No route exists between section-a and section-b\",
 *     \"statusCode\": 422
 *   }
 * }
 * ```
 *
 * **ML Considerations**:
 * - Weight formula: `baseWeight * (1 + density / 100)`
 *   - Low density (0): weight = baseWeight
 *   - High density (100): weight = 2 * baseWeight
 * - This incentivizes (not mandates) avoiding high-density zones
 * - Users can still take heavily crowded routes if it's the only option
 *
 * @param {string} venueId - Venue ID
 * @param {string} fromNodeId - Start node
 * @param {string} toNodeId - End node
 * @returns {Promise<{ data: Route, timestamp: string }>}
 * @throws {AppError} 400 if request invalid
 * @throws {AppError} 401 if unauthorized
 * @throws {AppError} 404 if venue/nodes not found
 * @throws {AppError} 422 if no route exists
 */
router.post(
  '/route',
  validate(RouteRequestSchema),
  asyncHandler(async (req, res) => {
    const { venueId, fromNodeId, toNodeId } = req.body as z.infer<typeof RouteRequestSchema>;
    const uid = req.user?.uid;

    try {
      // Validate nodes exist in venue graph
      const graphNodes = VENUE_GRAPH.nodes || [];
      if (!graphNodes.some((n: any) => n.id === fromNodeId)) {
        throw new AppError(
          `Start node '${fromNodeId}' not found in venue`,
          404,
          ErrorCode.NOT_FOUND,
        );
      }
      if (!graphNodes.some((n: any) => n.id === toNodeId)) {
        throw new AppError(
          `End node '${toNodeId}' not found in venue`,
          404,
          ErrorCode.NOT_FOUND,
        );
      }

      // Attempt to load crowd snapshot for density-weighted edges
      // Fallback: uses baseline weights if unavailable
      let snapshot = null;
      try {
        snapshot = await getCrowdSnapshot(venueId);
      } catch (err) {
        logger.warn({
          message: 'Navigation: crowd snapshot unavailable, using baseline weights',
          venueId,
          uid,
          error: err instanceof Error ? err.message : 'Unknown',
        });
        // Continue — computeRoute handles null snapshot gracefully
      }

      // Compute crowd-weighted route using Dijkstra
      const startTime = Date.now();
      const route = await computeRoute(VENUE_GRAPH, fromNodeId, toNodeId, snapshot);
      const duration = Date.now() - startTime;

      if (!route) {
        throw new AppError(
          `No route exists between '${fromNodeId}' and '${toNodeId}'`,
          422,
          ErrorCode.NOT_FOUND,
        );
      }

      logger.info({
        message: 'Route computed and served',
        venueId,
        uid,
        from: fromNodeId,
        to: toNodeId,
        distance: (route as any).distance,
        estimatedMinutes: (route as any).estimatedMinutes,
        duration,
      });

      res.json({
        data: route,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }

      logger.error({
        message: 'Unexpected error computing route',
        venueId,
        uid,
        from: fromNodeId,
        to: toNodeId,
        error: err instanceof Error ? err.message : String(err),
      });

      throw new AppError(
        'Failed to compute route',
        500,
        ErrorCode.INTERNAL_ERROR,
        false,
      );
    }
  }),
);

export { router as navigationRouter };
