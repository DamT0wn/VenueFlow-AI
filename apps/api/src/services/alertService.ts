import type { Alert, CreateAlertRequest } from '@venueflow/shared-types';
import { AlertSchema, VENUE_ROOM_PREFIX } from '@venueflow/shared-types';
import type { Server as SocketIOServer } from 'socket.io';
import { db, messaging } from '../lib/firebaseAdmin';
import { publishMessage } from '../lib/pubsub';
import { env } from '../config/env';
import { AppError, ErrorCode } from '../middleware/errorHandler';
import { logger } from '../lib/logger';

// Firestore collection
const ALERTS_COLLECTION = 'alerts';

// ── Input sanitization ────────────────────────────────────────────────────────

/**
 * Strips HTML tags and trims whitespace from user-supplied strings.
 * Prevents XSS if alert content is ever rendered as HTML.
 */
function sanitizeText(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

// ──────────────────────────────────────────────────────────────────────────────
// Alert Service
// ──────────────────────────────────────────────────────────────────────────────

/** Socket.io server reference — set via setSocket() at app startup */
let ioServer: SocketIOServer | null = null;

/**
 * Registers the Socket.io server instance for broadcasting alert events.
 *
 * @param {SocketIOServer} io - Socket.io server
 */
export function setAlertSocket(io: SocketIOServer): void {
  ioServer = io;
}

/**
 * Creates a new alert, persists it to Firestore, publishes it to Cloud Pub/Sub,
 * emits a socket event to all clients in the venue room, and sends an FCM
 * push notification to the venue's topic.
 *
 * @param {CreateAlertRequest} input - Validated alert creation payload
 * @returns {Promise<Alert>} The created alert with server-generated fields
 * @throws {AppError} 503 if Firestore write fails
 */
export async function createAlert(input: CreateAlertRequest): Promise<Alert> {
  const now = new Date();

  // Sanitize user-supplied text fields before persisting
  const sanitizedInput: CreateAlertRequest = {
    ...input,
    title: sanitizeText(input.title),
    body: sanitizeText(input.body),
  };

  const alertData: Omit<Alert, 'id'> = {
    ...sanitizedInput,
    createdAt: now,
    expired: false,
  };

  // Write to Firestore
  const docRef = await db()
    .collection(ALERTS_COLLECTION)
    .add({
      ...alertData,
      createdAt: now.toISOString(),
      expiresAt: input.expiresAt.toISOString(),
    });

  const alert: Alert = { id: docRef.id, ...alertData };

  logger.info({
    message: 'Alert created',
    alertId: alert.id,
    venueId: alert.venueId,
    type: alert.type,
  });

  // Pub/Sub publish (fire-and-forget)
  publishMessage(env.PUBSUB_TOPIC, {
    alertId: alert.id,
    venueId: alert.venueId,
    type: alert.type,
    title: alert.title,
  }).catch((err: unknown) => {
    logger.error({ message: 'Failed to publish alert to Pub/Sub', error: (err as Error).message });
  });

  // Socket.io broadcast to venue room
  if (ioServer) {
    const room = `${VENUE_ROOM_PREFIX}${alert.venueId}`;
    ioServer.to(room).emit('alert:new', alert);
  }

  // FCM push notification to venue topic
  messaging()
    .send({
      topic: `venue-${alert.venueId}`,
      notification: {
        title: alert.title,
        body: alert.body,
      },
      data: {
        alertId: alert.id,
        type: alert.type,
        venueId: alert.venueId,
        url: `/alerts`,
      },
      android: {
        priority: alert.type === 'evacuation' ? 'high' : 'normal',
        notification: {
          channelId: `venue-${alert.type}`,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: alert.type === 'evacuation' ? 'alarm.caf' : 'default',
            badge: 1,
          },
        },
      },
    })
    .catch((err: unknown) => {
      logger.error({
        message: 'Failed to send FCM notification',
        error: (err as Error).message,
      });
    });

  return alert;
}

/**
 * Retrieves active (non-expired) alerts for a venue, ordered newest-first.
 *
 * @param {string} venueId - Venue ID to query
 * @returns {Promise<Alert[]>} List of active alerts
 */
export async function getActiveAlerts(venueId: string): Promise<Alert[]> {
  const now = new Date();
  const snapshot = await db()
    .collection(ALERTS_COLLECTION)
    .where('venueId', '==', venueId)
    .where('expired', '==', false)
    .orderBy('createdAt', 'desc')
    .get();

  const alerts: Alert[] = [];

  for (const doc of snapshot.docs) {
    try {
      const data = doc.data();
      const parsed = AlertSchema.parse({ id: doc.id, ...data });
      // Filter out past-expiresAt alerts
      if (parsed.expiresAt > now) {
        alerts.push(parsed);
      }
    } catch (e) {
      logger.warn({ message: 'Skipping malformed alert document', docId: doc.id, error: e });
    }
  }

  return alerts;
}

/**
 * Marks an alert as expired (soft-delete).
 *
 * @param {string} alertId - Firestore document ID of the alert
 * @param {string} requestingUserId - UID of the admin requesting deletion (for audit)
 * @returns {Promise<void>}
 * @throws {AppError} 404 if alert not found
 */
export async function expireAlert(alertId: string, requestingUserId: string): Promise<void> {
  const ref = db().collection(ALERTS_COLLECTION).doc(alertId);
  const doc = await ref.get();

  if (!doc.exists) {
    throw new AppError(`Alert '${alertId}' not found`, 404, ErrorCode.NOT_FOUND);
  }

  await ref.update({
    expired: true,
    expiredAt: new Date().toISOString(),
    expiredBy: requestingUserId,
  });

  logger.info({ message: 'Alert expired', alertId, expiredBy: requestingUserId });
}
