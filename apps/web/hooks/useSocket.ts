'use client';

import { useEffect, useRef, useCallback } from 'react';
import { connectToVenue, getSocket } from '../lib/socket';
import { useVenueStore } from '../store/venueStore';
import type { CrowdSnapshot } from '@venueflow/shared-types';

/**
 * Central socket hook — manages one shared connection for the whole app.
 * Uses Firebase-authenticated socket connections.
 */
export function useVenueSocket() {
  const venueId          = useVenueStore(s => s.venueId);
  const setCrowdSnapshot = useVenueStore(s => s.setCrowdSnapshot);
  const connectedRef     = useRef(false);

  const onUpdate = useCallback(
    (payload: { snapshot: CrowdSnapshot } | CrowdSnapshot) => {
      const snap = 'snapshot' in payload ? payload.snapshot : payload;
      setCrowdSnapshot(snap);
    },
    [setCrowdSnapshot],
  );

  useEffect(() => {
    if (connectedRef.current) return;
    connectedRef.current = true;

    const socket = connectToVenue(venueId);
    socket.on('crowd:update', onUpdate);

    return () => {
      socket.off('crowd:update', onUpdate);
      connectedRef.current = false;
    };
  }, [venueId, onUpdate]);
}

export function useSocketStatus() {
  const socket = getSocket();
  return socket.connected;
}
