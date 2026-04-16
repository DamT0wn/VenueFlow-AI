import { Router } from 'express';
import { z } from 'zod';
import { verifyToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { getCrowdSnapshot } from '../services/crowdService';
import { getAllQueuePoints } from '../services/queueService';
import { VENUE_GRAPH } from '@venueflow/venue-data';
import { isRedisHealthy } from '../lib/redis';

const router = Router();

// All admin routes require authentication + admin role
router.use(verifyToken, requireRole('admin'));

const ParamsSchema = z.object({ venueId: z.string().min(1) });

/**
 * GET /api/admin/venues/:venueId/overview
 * Live crowd overview: all zone densities + aggregate stats.
 * Used by the admin dashboard "Live Crowd Overview" panel.
 */
router.get(
  '/venues/:venueId/overview',
  validate(ParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { venueId } = req.params as z.infer<typeof ParamsSchema>;
    const snapshot = await getCrowdSnapshot(venueId);

    const totalOccupancy = Math.round(
      snapshot.zones.reduce((sum, z) => sum + z.density, 0) / snapshot.zones.length,
    );
    const busiestZone = snapshot.zones.reduce((max, z) =>
      z.density > max.density ? z : max,
    );
    const queuePoints = await getAllQueuePoints(venueId, snapshot.zones);
    const avgWaitTime = Math.round(
      queuePoints.reduce((sum, q) => sum + q.estimatedWaitMinutes, 0) / (queuePoints.length || 1),
    );

    res.json({
      data: {
        snapshot,
        stats: {
          totalOccupancy,
          busiestZone: { id: busiestZone.id, name: busiestZone.name, density: busiestZone.density },
          avgWaitTime,
          zoneCount: snapshot.zones.length,
        },
      },
    });
  }),
);

/**
 * GET /api/admin/venues/:venueId/queues
 * All queue points for admin monitoring table.
 */
router.get(
  '/venues/:venueId/queues',
  validate(ParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { venueId } = req.params as z.infer<typeof ParamsSchema>;
    const snapshot = await getCrowdSnapshot(venueId);
    const queuePoints = await getAllQueuePoints(venueId, snapshot.zones);
    res.json({ data: queuePoints, count: queuePoints.length });
  }),
);

/**
 * GET /api/admin/graph/:venueId
 * Returns the raw venue graph for admin visualisation.
 */
router.get(
  '/graph/:venueId',
  validate(ParamsSchema, 'params'),
  asyncHandler(async (_req, res) => {
    res.json({ data: VENUE_GRAPH });
  }),
);

/**
 * GET /api/admin/health
 * Extended health check for admin dashboard.
 */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const redis = await isRedisHealthy();
    res.json({
      data: {
        redis,
        uptime: process.uptime(),
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      },
    });
  }),
);

export { router as adminRouter };
