import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { getCrowdSnapshot } from '../services/crowdService';
import { getAllQueuePoints } from '../services/queueService';

const router = Router();

const ParamsSchema = z.object({
  venueId: z.string().min(1).describe('Firebase venue document ID'),
});

/**
 * GET /api/queues/:venueId
 * Returns all queue points for a venue sorted by status (high first).
 * Anonymous access permitted; authentication enriches logging.
 */
router.get(
  '/:venueId',
  optionalAuth,
  validate(ParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { venueId } = req.params as z.infer<typeof ParamsSchema>;

    let zones: ReturnType<Awaited<ReturnType<typeof getCrowdSnapshot>>['zones']['map']> = [];
    try {
      const snapshot = await getCrowdSnapshot(venueId);
      zones = snapshot.zones;
    } catch {
      // Continue with empty zones — queue service handles fallback
    }

    const queuePoints = await getAllQueuePoints(venueId, zones);
    res.json({ data: queuePoints, count: queuePoints.length });
  }),
);

export { router as queuesRouter };
