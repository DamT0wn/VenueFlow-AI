import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CrowdSnapshot, VenueGraph } from '@venueflow/shared-types';

// ──────────────────────────────────────────────────────────────────────────────
// Venue Store — holds the currently selected venue and live crowd data
// ──────────────────────────────────────────────────────────────────────────────

interface VenueState {
  /** ID of the currently selected venue */
  venueId: string;
  /** Display name of the venue */
  venueName: string;
  /** Latest crowd snapshot received (may be null on initial load) */
  crowdSnapshot: CrowdSnapshot | null;
  /** Venue graph for navigation */
  venueGraph: VenueGraph | null;
  /** Whether the user is viewing the accessibility "text mode" map alternative */
  isTextModeEnabled: boolean;
  /** Whether the colourblind density overlay is active */
  isColourblindModeEnabled: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  setVenueId: (id: string, name: string) => void;
  setCrowdSnapshot: (snapshot: CrowdSnapshot) => void;
  setVenueGraph: (graph: VenueGraph) => void;
  toggleTextMode: () => void;
  toggleColourblindMode: () => void;
  reset: () => void;
}

const DEFAULT_VENUE_ID   = 'venue-chinnaswamy';
const DEFAULT_VENUE_NAME = 'M. Chinnaswamy Stadium';

/**
 * Zustand store for venue and crowd state.
 * All crowd:update socket events should call setCrowdSnapshot.
 */
export const useVenueStore = create<VenueState>()(
  devtools(
    (set) => ({
      venueId: DEFAULT_VENUE_ID,
      venueName: DEFAULT_VENUE_NAME,
      crowdSnapshot: null,
      venueGraph: null,
      isTextModeEnabled: false,
      isColourblindModeEnabled: false,

      setVenueId: (id, name) => set({ venueId: id, venueName: name }, false, 'setVenueId'),
      setCrowdSnapshot: (snapshot) =>
        set({ crowdSnapshot: snapshot }, false, 'setCrowdSnapshot'),
      setVenueGraph: (graph) => set({ venueGraph: graph }, false, 'setVenueGraph'),
      toggleTextMode: () =>
        set((s) => ({ isTextModeEnabled: !s.isTextModeEnabled }), false, 'toggleTextMode'),
      toggleColourblindMode: () =>
        set(
          (s) => ({ isColourblindModeEnabled: !s.isColourblindModeEnabled }),
          false,
          'toggleColourblindMode',
        ),
      reset: () =>
        set(
          {
            venueId: DEFAULT_VENUE_ID,
            venueName: DEFAULT_VENUE_NAME,
            crowdSnapshot: null,
            venueGraph: null,
          },
          false,
          'reset',
        ),
    }),
    { name: 'VenueStore' },
  ),
);
