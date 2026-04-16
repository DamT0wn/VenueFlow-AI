import { Router } from 'express';
import { z } from 'zod';
import { RouteRequestSchema } from '@venueflow/shared-types';
import { VENUE_GRAPH } from '@venueflow/venue-data';
import { computeRoute } from '../services/pathfindingService';
import { getCrowdSnapshot } from '../services/crowdService';
import { verifyToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { logger } from '../lib/logger';

const router = Router();

// All navigation routes require authentication
router.use(verifyToken);

/**
 * POST /api/navigation/route
 * Computes the optimal crowd-weighted route between two venue nodes using Dijkstra.
 */
router.post(
  '/route',
  validate(RouteRequestSchema),
  asyncHandler(async (req, res) => {
    const { venueId, fromNodeId, toNodeId } = req.body as z.infer<typeof RouteRequestSchema>;

    // Get current crowd snapshot for density-weighted edges (may be null)
    let snapshot = null;
    try {
      snapshot = await getCrowdSnapshot(venueId);
    } catch {
      logger.warn({
        message: 'Navigation: no crowd snapshot available, using base weights',
        venueId,
      });
    }

    const route = await computeRoute(VENUE_GRAPH, fromNodeId, toNodeId, snapshot);

    logger.info({
      message: 'Route served',
      venueId,
      from: fromNodeId,
      to: toNodeId,
      estimatedMinutes: route.estimatedMinutes,
      uid: req.user?.uid,
    });

    res.json({ data: route });
  }),
);

export { router as navigationRouter };
