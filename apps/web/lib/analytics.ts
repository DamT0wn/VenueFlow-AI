'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Google Analytics 4 + Firebase Analytics integration
// Implements GA4 Consent Mode v2 — default deny analytics_storage.
// ──────────────────────────────────────────────────────────────────────────────

const GA_MEASUREMENT_ID = process.env['NEXT_PUBLIC_GA_MEASUREMENT_ID'];

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// ── GA4 custom event names ───────────────────────────────────────────────────

export type TrackableEvent =
  | { name: 'venueflow_route_calculated'; params: { from: string; to: string; eta: number } }
  | { name: 'venueflow_queue_viewed'; params: { zone_id: string; wait_time: number } }
  | { name: 'venueflow_alert_received'; params: { alert_type: string } }
  | { name: 'venueflow_recommendation_used'; params: { node_id: string; type: string } }
  | { name: 'venueflow_map_loaded'; params: { venue_id: string } }
  | { name: 'page_view'; params: { page_path: string; page_title: string } };

// ── gtag helper ──────────────────────────────────────────────────────────────

function gtag(...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag(...args);
}

// ── Initialise GA4 with Consent Mode v2 ─────────────────────────────────────

/**
 * Initialises GA4 with Consent Mode v2 defaults (analytics_storage denied).
 * Must be called once in the root layout after mounting.
 *
 * @returns {void}
 */
export function initAnalytics(): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  // Inject the gtag.js script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialise dataLayer and gtag function
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  // Consent Mode v2 — default deny, update on user consent
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We track page views manually on each route change
  });
}

/**
 * Updates GA4 consent state when the user grants analytics permission.
 *
 * @param {boolean} granted - true if user consented to analytics
 */
export function updateAnalyticsConsent(granted: boolean): void {
  gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
  });
}

/**
 * Tracks a page view. Call in a useLayoutEffect on pathname changes.
 *
 * @param {string} pathname - Current Next.js pathname
 * @param {string} title    - Page title
 */
export function trackPageView(pathname: string, title: string): void {
  if (!GA_MEASUREMENT_ID) return;
  gtag('event', 'page_view', {
    page_path: pathname,
    page_title: title,
    send_to: GA_MEASUREMENT_ID,
  });
}

/**
 * Tracks a custom VenueFlow event.
 *
 * @param {TrackableEvent} event - Event name and typed params
 */
export function trackEvent(event: TrackableEvent): void {
  if (!GA_MEASUREMENT_ID) return;
  gtag('event', event.name, event.params);
}

/**
 * Grants analytics consent — call after user accepts the consent banner.
 * Alias for updateAnalyticsConsent(true) for clearer call sites.
 */
export function grantAnalyticsConsent(): void {
  updateAnalyticsConsent(true);
}

/**
 * Denies analytics consent — call after user declines the consent banner.
 * Alias for updateAnalyticsConsent(false) for clearer call sites.
 */
export function denyAnalyticsConsent(): void {
  updateAnalyticsConsent(false);
}
