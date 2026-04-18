/**
 * @file venueStore.test.ts
 * Unit tests for the Zustand venue store.
 * Verifies state transitions for crowd snapshots and accessibility toggles.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useVenueStore } from '../../store/venueStore';
import type { CrowdSnapshot } from '@venueflow/shared-types';

const MOCK_SNAPSHOT: CrowdSnapshot = {
  venueId: 'venue-test',
  zones: [
    { id: 'z1', name: 'North Stand', density: 75, lat: 12.98, lng: 77.60, radius: 100, updatedAt: new Date() },
  ],
  capturedAt: new Date(),
};

describe('venueStore', () => {
  beforeEach(() => {
    useVenueStore.getState().reset();
  });

  it('has correct default venueId', () => {
    expect(useVenueStore.getState().venueId).toBe('venue-chinnaswamy');
  });

  it('has null crowdSnapshot by default', () => {
    expect(useVenueStore.getState().crowdSnapshot).toBeNull();
  });

  it('setVenueId updates venueId and venueName', () => {
    useVenueStore.getState().setVenueId('venue-wankhede', 'Wankhede Stadium');
    expect(useVenueStore.getState().venueId).toBe('venue-wankhede');
    expect(useVenueStore.getState().venueName).toBe('Wankhede Stadium');
  });

  it('setCrowdSnapshot stores the snapshot', () => {
    useVenueStore.getState().setCrowdSnapshot(MOCK_SNAPSHOT);
    expect(useVenueStore.getState().crowdSnapshot).toEqual(MOCK_SNAPSHOT);
  });

  it('toggleTextMode flips isTextModeEnabled', () => {
    expect(useVenueStore.getState().isTextModeEnabled).toBe(false);
    useVenueStore.getState().toggleTextMode();
    expect(useVenueStore.getState().isTextModeEnabled).toBe(true);
    useVenueStore.getState().toggleTextMode();
    expect(useVenueStore.getState().isTextModeEnabled).toBe(false);
  });

  it('toggleColourblindMode flips isColourblindModeEnabled', () => {
    expect(useVenueStore.getState().isColourblindModeEnabled).toBe(false);
    useVenueStore.getState().toggleColourblindMode();
    expect(useVenueStore.getState().isColourblindModeEnabled).toBe(true);
  });

  it('reset restores default state', () => {
    useVenueStore.getState().setVenueId('venue-other', 'Other');
    useVenueStore.getState().setCrowdSnapshot(MOCK_SNAPSHOT);
    useVenueStore.getState().toggleTextMode();
    useVenueStore.getState().reset();
    const state = useVenueStore.getState();
    expect(state.venueId).toBe('venue-chinnaswamy');
    expect(state.crowdSnapshot).toBeNull();
    expect(state.isTextModeEnabled).toBe(false);
  });
});
