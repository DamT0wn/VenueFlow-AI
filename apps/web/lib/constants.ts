/**
 * @file constants.ts
 * Shared UI constants for VenueFlow web app.
 * Import from here instead of hardcoding values across components.
 */

// ── Density thresholds ────────────────────────────────────────────────────────

/** Density at or above this value is considered HIGH (red) */
export const DENSITY_HIGH_THRESHOLD = 80 as const;

/** Density at or above this value is considered MEDIUM (amber) */
export const DENSITY_MEDIUM_THRESHOLD = 50 as const;

// ── Brand / IPL colours ───────────────────────────────────────────────────────

export const COLOR_CSK   = '#FDB913' as const;
export const COLOR_RCB   = '#C8102E' as const;
export const COLOR_IPL   = '#6366F1' as const;

// ── Semantic status colours ───────────────────────────────────────────────────

export const COLOR_SUCCESS = '#22C55E' as const;
export const COLOR_WARNING = '#F59E0B' as const;
export const COLOR_DANGER  = '#EF4444' as const;
export const COLOR_INFO    = '#38BDF8' as const;
export const COLOR_PRIMARY = '#6366F1' as const;

// ── Density colour helper ─────────────────────────────────────────────────────

/**
 * Returns the semantic colour for a given density value.
 * @param density - Crowd density 0–100
 */
export function densityColor(density: number): string {
  if (density >= DENSITY_HIGH_THRESHOLD)   return COLOR_DANGER;
  if (density >= DENSITY_MEDIUM_THRESHOLD) return COLOR_WARNING;
  return COLOR_SUCCESS;
}

/**
 * Returns the density label for a given density value.
 * @param density - Crowd density 0–100
 */
export function densityLabel(density: number): 'High' | 'Medium' | 'Low' {
  if (density >= DENSITY_HIGH_THRESHOLD)   return 'High';
  if (density >= DENSITY_MEDIUM_THRESHOLD) return 'Medium';
  return 'Low';
}

// ── Layout ────────────────────────────────────────────────────────────────────

export const TOP_BAR_HEIGHT_PX    = 72 as const;
export const BOTTOM_NAV_HEIGHT_PX = 68 as const;
export const TOUCH_TARGET_PX      = 44 as const;

// ── Venue ─────────────────────────────────────────────────────────────────────

export const DEFAULT_VENUE_ID   = 'venue-chinnaswamy' as const;
export const DEFAULT_VENUE_NAME = 'M. Chinnaswamy Stadium' as const;
export const VENUE_CENTER_LAT   = 12.9792 as const;
export const VENUE_CENTER_LNG   = 77.5996 as const;
