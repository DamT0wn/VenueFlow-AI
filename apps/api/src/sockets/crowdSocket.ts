import type { Server as SocketIOServer, Socket } from 'socket.io';
import { auth } from '../lib/firebaseAdmin';
import { VENUE_ROOM_PREFIX } from '@venueflow/shared-types';
import { logger } from '../lib/logger';

// ──────────────────────────────────────────────────────────────────────────────
// Socket.io crowd namespace
// ──────────────────────────────────────────────────────────────────────────────

interface SocketHandshakeAuth {
  token?: string;
  venueId?: string;
}

/**
 * Registers the crowd Socket.io handler on the server.
 * Handles client connection, authentication, and venue room subscriptions.
 *
 * Security:
 *   - Validates Firebase ID token from handshake `auth.token`
 *   - Clients may only join rooms matching their token's venueId claim,
 *     or any venue room if venueId claim is absent (attendee-mode)
 *
 * @param {SocketIOServer} io - Socket.io server instance
 */
export function registerCrowdSocket(io: SocketIOServer): void {
  // Auth middleware on every socket connection
  io.use(async (socket: Socket, next) => {
    const handshakeAuth = socket.handshake.auth as SocketHandshakeAuth;
    const token = handshakeAuth.token;

    if (!token) {
      logger.warn({ message: 'Socket: missing auth token', socketId: socket.id });
      next(new Error('Authentication required'));
      return;
    }

    try {
      const decoded = await auth().verifyIdToken(token);
      // Attach user data to socket for use in event handlers
      socket.data = {
        uid: decoded.uid,
        role: decoded['role'] as string | undefined,
        venueId: decoded['venueId'] as string | undefined,
      };
      next();
    } catch (err) {
      logger.warn({
        message: 'Socket: invalid token',
        socketId: socket.id,
        error: (err as Error).message,
      });
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { uid, venueId: tokenVenueId } = socket.data as {
      uid: string;
      venueId?: string;
    };

    logger.info({ message: 'Socket: client connected', socketId: socket.id, uid });

    // ── Join venue room ─────────────────────────────────────────────────────
    socket.on('join:venue', (requestedVenueId: unknown) => {
      if (typeof requestedVenueId !== 'string' || !requestedVenueId) {
        socket.emit('error', { code: 'INVALID_VENUE_ID', message: 'Invalid venueId' });
        return;
      }

      // If the token has a specific venueId claim, enforce it
      if (tokenVenueId && tokenVenueId !== requestedVenueId) {
        socket.emit('error', {
          code: 'FORBIDDEN',
          message: 'You are not authorised for this venue',
        });
        logger.warn({
          message: 'Socket: venue mismatch',
          uid,
          tokenVenueId,
          requestedVenueId,
        });
        return;
      }

      const room = `${VENUE_ROOM_PREFIX}${requestedVenueId}`;
      void socket.join(room);
      socket.emit('joined:venue', { venueId: requestedVenueId, room });

      logger.info({
        message: 'Socket: joined venue room',
        socketId: socket.id,
        uid,
        room,
      });
    });

    // ── Leave venue room ────────────────────────────────────────────────────
    socket.on('leave:venue', (venueId: unknown) => {
      if (typeof venueId !== 'string') return;
      const room = `${VENUE_ROOM_PREFIX}${venueId}`;
      void socket.leave(room);
      logger.info({ message: 'Socket: left venue room', socketId: socket.id, uid, room });
    });

    // ── Disconnection ───────────────────────────────────────────────────────
    socket.on('disconnect', (reason: string) => {
      logger.info({
        message: 'Socket: client disconnected',
        socketId: socket.id,
        uid,
        reason,
      });
    });

    socket.on('error', (err: Error) => {
      logger.error({
        message: 'Socket: error',
        socketId: socket.id,
        uid,
        error: err.message,
      });
    });
  });

  logger.info({ message: 'Socket.io: crowd handler registered' });
}
