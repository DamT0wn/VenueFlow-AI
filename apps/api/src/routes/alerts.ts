import { Router } from 'express';
import { z } from 'zod';
import { CreateAlertSchema } from '@venueflow/shared-types';
import { verifyToken, requireRole } from '../middleware/auth';
import { asyncHandler, AppError, ErrorCode } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { writeLimiter } from '../middleware/rateLimiter';
import { createAlert, getActiveAlerts, expireAlert } from '../services/alertService';

const router = Router();

const ParamsSchema = z.object({ venueId: z.string().min(1) });
const DeleteParamsSchema = z.object({ id: z.string().min(1) });

/**
 * GET /api/alerts/:venueId
 * Returns active, non-expired alerts for a venue (newest first).
 * Requires authentication.
 */
router.get(
  '/:venueId',
  verifyToken,
  validate(ParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { venueId } = req.params as z.infer<typeof ParamsSchema>;
    const alerts = await getActiveAlerts(venueId);
    res.json({ data: alerts, count: alerts.length });
  }),
);

/**
 * POST /api/alerts
 * Creates a new alert. Requires admin role.
 * Also broadcasts via Socket.io, Pub/Sub, and FCM.
 */
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  writeLimiter,
  validate(CreateAlertSchema),
  asyncHandler(async (req, res) => {
    const alert = await createAlert(req.body as z.infer<typeof CreateAlertSchema>);
    res.status(201).json({ data: alert });
  }),
);

/**
 * DELETE /api/alerts/:id
 * Marks an alert as expired (soft delete). Requires admin role.
 */
router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  validate(DeleteParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof DeleteParamsSchema>;
    const uid = req.user?.uid;
    if (!uid) {
      throw new AppError('User ID missing from token', 401, ErrorCode.UNAUTHORIZED);
    }
    await expireAlert(id, uid);
    res.json({ data: { id, expired: true } });
  }),
);

export { router as alertsRouter };
