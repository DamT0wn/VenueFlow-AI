import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import NavigatePage from '../../app/(venue)/navigate/page';

const mockVenueState = {
  isTextModeEnabled: false,
};

vi.mock('../../store/venueStore', () => ({
  useVenueStore: (selector: (state: typeof mockVenueState) => unknown) => selector(mockVenueState),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('../../components/map/VenueMap', () => ({
  VenueMap: () => <div data-testid="venue-map">Map</div>,
  VENUE_ZONES: [
    { id: 'z1', name: 'North Stand', density: 55, position: { lat: 12.98, lng: 77.6 } },
  ],
}));

vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('Navigate page accessibility', () => {
  it('has no critical axe violations', async () => {
    const { container } = render(<NavigatePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
