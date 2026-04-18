import { Router } from 'express';
import { z } from 'zod';
import { RecommendationRequestSchema } from '@venueflow/shared-types';
import { verifyToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { getCrowdSnapshot } from '../services/crowdService';
import { getRecommendations } from '../services/recommendationService';
import { logger } from '../lib/logger';

const router = Router();

const QuerySchema = RecommendationRequestSchema;

/**
 * GET /api/recommendations/:venueId
 * Returns up to 3 personalised venue recommendations based on user location
 * and real-time crowd density. Requires authentication.
 *
 * Query params: type (food|restroom|exit|shortcut), lat, lng
 */
router.get(
  '/:venueId',
  verifyToken,
  validate(QuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { venueId, type, lat, lng } = req.query as unknown as z.infer<typeof QuerySchema>;
    const uid = req.user?.uid ?? 'anonymous';

    let zones: { lat: number; lng: number; density: number; id: string; name: string; radius: number; updatedAt: Date }[] = [];
    try {
      const snapshot = await getCrowdSnapshot(venueId);
      zones = snapshot.zones as typeof zones;
    } catch {
      logger.warn({ message: 'Recommendations: no crowd snapshot, using defaults', venueId });
    }

    const recommendations = await getRecommendations(venueId, uid, type, lat, lng, zones);
    res.json({ data: recommendations, count: recommendations.length });
  }),
);

export { router as recommendationsRouter };
