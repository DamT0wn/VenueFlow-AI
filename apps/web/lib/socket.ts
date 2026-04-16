import { io, type Socket } from 'socket.io-client';
import { firebaseAuth } from './firebase';

// ──────────────────────────────────────────────────────────────────────────────
// Socket.io client singleton
// ──────────────────────────────────────────────────────────────────────────────

let socket: Socket | null = null;

const SOCKET_URL =
  process.env['NEXT_PUBLIC_SOCKET_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

/**
 * Returns the Socket.io client singleton.
 * The socket does NOT connect automatically — call connect() explicitly.
 * Attaches a fresh Firebase ID token to the handshake `auth` object
 * before each connection attempt.
 *
 * @returns {Socket} Socket.io client instance
 */
export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: async (cb: (data: { token: string }) => void) => {
      const currentUser = firebaseAuth?.currentUser ?? null;
      if (currentUser) {
        const token = await currentUser.getIdToken(false);
        cb({ token });
      } else {
        cb({ token: '' });
      }
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
  });

  return socket;
}

/**
 * Connects the socket and joins the specified venue room.
 * Safe to call multiple times — already-connected sockets are re-used.
 *
 * @param {string} venueId - Venue to join on connection
 * @returns {Socket} Connected socket instance
 */
export function connectToVenue(venueId: string): Socket {
  const s = getSocket();

  if (!s.connected) {
    s.connect();
  }

  const joinRoom = (): void => {
    s.emit('join:venue', venueId);
  };

  if (s.connected) {
    joinRoom();
  } else {
    s.once('connect', joinRoom);
  }

  return s;
}

/**
 * Disconnects the socket and clears the singleton.
 * Call during component unmount or user sign-out.
 */
export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
}
