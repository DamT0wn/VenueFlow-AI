import { io, type Socket } from 'socket.io-client';
import { ensureAnonymousAuth, getIdToken } from './firebase';

let socket: Socket | null = null;

const SOCKET_URL =
  process.env['NEXT_PUBLIC_SOCKET_URL']?.trim() ||
  process.env['NEXT_PUBLIC_API_URL']?.trim() ||
  'http://localhost:3001';

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: async (cb) => {
      try {
        await ensureAnonymousAuth();
        const token = await getIdToken();
        cb({ token });
      } catch {
        cb({});
      }
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
  });

  return socket;
}

export function connectToVenue(venueId: string): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  const join = () => s.emit('join:venue', venueId);
  if (s.connected) join();
  else s.once('connect', join);
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect();
  socket = null;
}
