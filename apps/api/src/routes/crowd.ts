import { Router } from 'express';
import { z } from 'zod';
import { getCrowdSnapshot } from '../services/crowdService';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';

const router = Router();

const ParamsSchema = z.object({
  venueId: z.string().min(1).describe('Firebase venue document ID'),
});

/**
 * GET /api/crowd/:venueId
 * Returns the latest crowd snapshot for the specified venue.
 * Read order: in-memory → Redis → Firestore.
 */
router.get(
  '/:venueId',
  validate(ParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { venueId } = req.params as z.infer<typeof ParamsSchema>;
    const snapshot = await getCrowdSnapshot(venueId);
    res.json({ data: snapshot });
  }),
);

export { router as crowdRouter };
