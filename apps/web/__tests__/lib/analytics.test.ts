import { beforeEach, describe, expect, it, vi } from 'vitest';

function setGaId(value: string | undefined) {
  if (value === undefined) {
    delete process.env['NEXT_PUBLIC_GA_MEASUREMENT_ID'];
  } else {
    process.env['NEXT_PUBLIC_GA_MEASUREMENT_ID'] = value;
  }
}

describe('analytics helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    document.head.innerHTML = '';
    (window as any).dataLayer = [];
    (window as any).gtag = undefined;
  });

  it('does nothing when GA id is missing', async () => {
    setGaId(undefined);
    const mod = await import('../../lib/analytics');

    mod.initAnalytics();
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
  });

  it('initializes analytics and injects gtag script when id is present', async () => {
    setGaId('G-TEST1234');
    const mod = await import('../../lib/analytics');

    mod.initAnalytics();

    expect(document.querySelector('script[src*="G-TEST1234"]')).not.toBeNull();
    expect(Array.isArray((window as any).dataLayer)).toBe(true);
  });

  it('tracks page views and custom events when id is present', async () => {
    setGaId('G-TEST1234');
    const mod = await import('../../lib/analytics');
    mod.initAnalytics();

    mod.trackPageView('/map', 'Map');
    mod.trackEvent({ name: 'venueflow_map_loaded', params: { venue_id: 'venue-1' } });
    mod.grantAnalyticsConsent();
    mod.denyAnalyticsConsent();

    expect((window as any).dataLayer.length).toBeGreaterThan(0);
  });
});
