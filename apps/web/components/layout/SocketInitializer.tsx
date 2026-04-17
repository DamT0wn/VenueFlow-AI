'use client';

import { useVenueSocket } from '../../hooks/useSocket';

/**
 * Invisible component that boots the single shared socket connection.
 * Lives in the venue layout so it mounts once and stays alive across page nav.
 */
export function SocketInitializer() {
  useVenueSocket();
  return null;
}
