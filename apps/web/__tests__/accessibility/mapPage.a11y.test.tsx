import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import MapPage from '../../app/(venue)/map/page';

const mockVenueState = {
  venueId: 'venue-chinnaswamy',
  venueName: 'M. Chinnaswamy Stadium',
  crowdSnapshot: null,
};

vi.mock('../../store/venueStore', () => ({
  useVenueStore: (selector: (state: typeof mockVenueState) => unknown) => selector(mockVenueState),
}));

vi.mock('../../components/map/VenueMap', () => ({
  VenueMap: () => <div data-testid="venue-map">Map</div>,
  VENUE_ZONES: [
    { name: 'North Stand', position: { lat: 12.98, lng: 77.6 } },
    { name: 'South Stand', position: { lat: 12.97, lng: 77.6 } },
  ],
}));

vi.mock('next/dynamic', () => ({
  default: () => {
    return (props: { onZoneClick?: (zone: { id: string; name: string; density: number }) => void }) => (
      <button
        type="button"
        data-testid="dynamic-venue-map"
        onClick={() => props.onZoneClick?.({ id: 'z1', name: 'North Stand', density: 50 })}
      >
        DynamicMap
      </button>
    );
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('Map page accessibility', () => {
  it('has no critical axe violations', async () => {
    const { container } = render(<MapPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
