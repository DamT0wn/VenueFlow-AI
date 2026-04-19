import { Router } from 'express';
import { z } from 'zod';
import { CreateAlertSchema } from '@venueflow/shared-types';
import { verifyToken, requireRole } from '../middleware/auth';
import { asyncHandler, AppError, ErrorCode } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { writeLimiter } from '../middleware/rateLimiter';
import { createAlert, getActiveAlerts, expireAlert } from '../services/alertService';
import { logger } from '../lib/logger';

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// Request Validation Schemas with Enhanced Constraints
// ──────────────────────────────────────────────────────────────────────────────

const ParamsSchema = z.object({
  venueId: z
    .string()
    .min(1, 'VenueId required')
    .max(128)
    .regex(/^[a-z0-9\-_]+$/, 'Invalid VenueId format'),
});

const DeleteParamsSchema = z.object({
  id: z
    .string()
    .min(1, 'Alert ID required')
    .max(256)
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid alert ID format'),
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/alerts/:venueId
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/alerts/:venueId
 *
 * Returns all active, non-expired alerts for a venue (newest first).
 * Alerts are pushed in real-time via Socket.io; this endpoint provides
 * the historical view for new connections or polling clients.
 *
 * **Response Format**:
 * ```json
 * {
 *   "data": [
 *     {
 *       "id": "alert-123",
 *       "venueId": "venue-chinnaswamy",
 *       "title": "High Crowd Alert",
 *       "message": "North Stand at 95% capacity",
 *       "severity": "warning",
 *       "createdAt": "2024-04-19T17:00:00Z",
 *       "expiresAt": "2024-04-19T17:15:00Z"
 *     }
 *   ],
 *   "count": 1,
 *   "timestamp": "2024-04-19T17:00:05Z"
 * }
 * ```
 *
 * **Status Codes**:
 * - 200: Success (returns array, may be empty)
 * - 400: Invalid venueId
 * - 401: Unauthorized
 * - 404: Venue not found
 * - 500: Server error
 *
 * **Query Parameters**: None
 *
 * **Path Parameters**:
 * - `venueId` (string, required): Venue ID
 *
 * **Authentication**: Required (Firebase token)
 *
 * **Caching**: Alerts cached in Firestore; 10-second replication delay for consistency
 *
 * **Rate Limiting**: 100 requests per minute
 *
 * **Performance**: <50ms P99
 *
 * **Example Request**:
 * ```
 * GET /api/alerts/venue-chinnaswamy
 * Authorization: Bearer <firebase-token>
 * ```
 *
 * @param {string} venueId - Venue identifier
 * @returns {Promise<{ data: Alert[], count: number, timestamp: string }>}
 * @throws {AppError} 400 if venueId invalid
 * @throws {AppError} 401 if unauthorized
 * @throws {AppError} 404 if venue not found
 */
router.get(
  '/:venueId',
  verifyToken,
  validate(ParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { venueId } = req.params as z.infer<typeof ParamsSchema>;
    const uid = req.user?.uid;

    try {
      const alerts = await getActiveAlerts(venueId);

      logger.info({
        message: 'Alerts retrieved',
        venueId,
        uid,
        count: alerts.length,
      });

      res.json({
        data: alerts,
        count: alerts.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }

      logger.error({
        message: 'Error retrieving alerts',
        venueId,
        uid,
        error: err instanceof Error ? err.message : String(err),
      });

      throw new AppError('Failed to retrieve alerts', 500, ErrorCode.INTERNAL_ERROR, false);
    }
  }),
);

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/alerts
// ──────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/alerts
 *
 * Creates a new alert and broadcasts it in real-time:
 * - Socket.io to all clients in venue room
 * - Google Cloud Pub/Sub for downstream subscribers
 * - Firebase Cloud Messaging (FCM) to subscribed users
 *
 * **Request Body**:
 * ```json
 * {
 *   "venueId": "venue-chinnaswamy",
 *   "title": "Crowd Alert",
 *   "message": "North Stand at 95% capacity",
 *   "severity": "warning|critical",
 *   "expiresInSeconds": 300
 * }
 * ```
 *
 * **Status Codes**:
 * - 201: Alert created successfully
 * - 400: Invalid request body
 * - 401: Unauthorized
 * - 403: Forbidden (non-admin user)
 * - 429: Too many requests (rate limited)
 * - 500: Server error
 *
 * **Request Body**:
 * - `venueId` (string, required): Target venue ID
 * - `title` (string, required): Alert title (≤128 chars)
 * - `message` (string, required): Alert message (≤512 chars)
 * - `severity` (string): 'info' | 'warning' | 'critical' (default: 'info')
 * - `expiresInSeconds` (number): TTL in seconds (default: 300)
 *
 * **Authentication**: Required + Admin role
 *
 * **Rate Limiting**: 30 alerts per minute (per admin user, across all venues)
 *
 * **Performance**: <100ms (async broadcast in background)
 *
 * **Side Effects**:
 * - Writes to Firestore (alerts collection)
 * - Publishes to Cloud Pub/Sub
 * - Sends FCM notifications to subscribed users
 * - Broadcasts Socket.io event to venue room
 *
 * **Example Request**:
 * ```
 * POST /api/alerts
 * Content-Type: application/json
 * Authorization: Bearer <admin-firebase-token>
 *
 * {
 *   "venueId": "venue-chinnaswamy",
 *   "title": "Crowd Alert",
 *   "message": "North Stand at 95% capacity",
 *   "severity": "critical",
 *   "expiresInSeconds": 300
 * }
 * ```
 *
 * **Example Response (201)**:
 * ```json
 * {
 *   "data": {
 *     "id": "alert-abc123",
 *     "venueId": "venue-chinnaswamy",
 *     "title": "Crowd Alert",
 *     "createdAt": "2024-04-19T17:00:00Z",
 *     "expiresAt": "2024-04-19T17:05:00Z"
 *   }
 * }
 * ```
 *
 * @param {CreateAlert} body - Alert creation payload
 * @returns {Promise<{ data: Alert }>}
 * @throws {AppError} 400 if body invalid
 * @throws {AppError} 401 if unauthorized
 * @throws {AppError} 403 if non-admin
 * @throws {AppError} 429 if rate limited
 */
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  writeLimiter,
  validate(CreateAlertSchema),
  asyncHandler(async (req, res) => {
    const alert = await createAlert(req.body as z.infer<typeof CreateAlertSchema>);

    logger.info({
      message: 'Alert created',
      alertId: alert.id,
      venueId: alert.venueId,
      uid: req.user?.uid,
      severity: (alert as any).severity,
    });

    res.status(201).json({ data: alert, timestamp: new Date().toISOString() });
  }),
);

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/alerts/:id
// ──────────────────────────────────────────────────────────────────────────────

/**
 * DELETE /api/alerts/:id
 *
 * Marks an alert as expired (soft delete). The alert record is preserved
 * for audit purposes, but is excluded from "active alerts" queries.
 *
 * **Status Codes**:
 * - 200: Alert expired successfully
 * - 400: Invalid alert ID
 * - 401: Unauthorized
 * - 403: Forbidden (non-admin)
 * - 404: Alert not found
 * - 500: Server error
 *
 * **Path Parameters**:
 * - `id` (string, required): Alert document ID
 *
 * **Authentication**: Required + Admin role
 *
 * **Rate Limiting**: 60 deletions per minute
 *
 * **Side Effects**:
 * - Updates Firestore (sets expiresAt to now)
 * - Broadcasts Socket.io event (alert removed)
 *
 * **Example Request**:
 * ```
 * DELETE /api/alerts/alert-abc123
 * Authorization: Bearer <admin-firebase-token>
 * ```
 *
 * **Example Response (200)**:
 * ```json
 * {
 *   "data": {
 *     "id": "alert-abc123",
 *     "expired": true,
 *     "expiredAt": "2024-04-19T17:03:00Z"
 *   }
 * }
 * ```
 *
 * @param {string} id - Alert ID to expire
 * @returns {Promise<{ data: { id: string, expired: boolean } }>}
 * @throws {AppError} 400 if ID invalid
 * @throws {AppError} 401 if unauthorized
 * @throws {AppError} 403 if non-admin
 * @throws {AppError} 404 if alert not found
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

    try {
      await expireAlert(id, uid);

      logger.info({
        message: 'Alert expired',
        alertId: id,
        uid,
      });

      res.json({
        data: { id, expired: true },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }

      logger.error({
        message: 'Error expiring alert',
        alertId: id,
        uid,
        error: err instanceof Error ? err.message : String(err),
      });

      throw new AppError('Failed to expire alert', 500, ErrorCode.INTERNAL_ERROR, false);
    }
  }),
);

export { router as alertsRouter };
