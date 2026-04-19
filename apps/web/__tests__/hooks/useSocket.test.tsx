import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useVenueSocket, useSocketStatus } from '../../hooks/useSocket';

const on = vi.fn();
const off = vi.fn();
const connect = vi.fn();
const mockSocket = {
  connected: false,
  on,
  off,
  connect,
};

const setCrowdSnapshot = vi.fn();

vi.mock('../../store/venueStore', () => ({
  useVenueStore: (selector: (state: any) => unknown) =>
    selector({ venueId: 'venue-1', setCrowdSnapshot }),
}));

vi.mock('../../lib/socket', () => ({
  connectToVenue: vi.fn(() => mockSocket),
  getSocket: vi.fn(() => ({ connected: true })),
}));

describe('useSocket hooks', () => {
  it('connects and subscribes to crowd updates', () => {
    const { unmount } = renderHook(() => useVenueSocket());

    expect(on).toHaveBeenCalledWith('crowd:update', expect.any(Function));

    unmount();
    expect(off).toHaveBeenCalledWith('crowd:update', expect.any(Function));
  });

  it('returns current socket connected status', () => {
    const { result } = renderHook(() => useSocketStatus());
    expect(result.current).toBe(true);
  });
});
