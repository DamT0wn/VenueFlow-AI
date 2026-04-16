import { z } from 'zod';

// ──────────────────────────────────────────────────────────────────────────────
// Branded Types
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Branded ZoneId for type-safe zone identification.
 * @example const id = 'zone-north-stand' as ZoneId
 */
export type ZoneId = string & { readonly __brand: 'ZoneId' };

// ──────────────────────────────────────────────────────────────────────────────
// Density Level
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Crowd density represented as an integer between 0 (empty) and 100 (at capacity).
 */
export const DensityLevelSchema = z
  .number()
  .int()
  .min(0)
  .max(100)
  .describe('Crowd density 0–100 (0 = empty, 100 = at capacity)');

export type DensityLevel = z.infer<typeof DensityLevelSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Zone Data
// ──────────────────────────────────────────────────────────────────────────────

export const ZoneDataSchema = z.object({
  /** Unique zone identifier */
  id: z.string().describe('Unique zone identifier'),
  /** Human-readable zone name (e.g., "North Stand") */
  name: z.string().min(1).describe('Human-readable zone name'),
  /** Current crowd density 0–100 */
  density: DensityLevelSchema,
  /** Zone centre latitude */
  lat: z.number().min(-90).max(90).describe('Zone centre latitude'),
  /** Zone centre longitude */
  lng: z.number().min(-180).max(180).describe('Zone centre longitude'),
  /** Visual radius of the zone in metres for heatmap rendering */
  radius: z
    .number()
    .positive()
    .describe('Visual radius of the zone in metres for heatmap rendering'),
  /** ISO-8601 timestamp of the last density update */
  updatedAt: z.coerce.date().describe('Timestamp of the last density update'),
});

export type ZoneData = z.infer<typeof ZoneDataSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Crowd Snapshot
// ──────────────────────────────────────────────────────────────────────────────

/**
 * A point-in-time snapshot of all zone densities for a given venue.
 * Written to Redis key `crowd:{venueId}:snapshot` with 30-second TTL.
 */
export const CrowdSnapshotSchema = z.object({
  /** Firebase venue document ID */
  venueId: z.string().describe('Firebase venue document ID'),
  /** Density data for every zone in the venue */
  zones: z.array(ZoneDataSchema).min(1).describe('Density data for every zone in the venue'),
  /** When this snapshot was captured */
  capturedAt: z.coerce.date().describe('When this snapshot was captured'),
});

export type CrowdSnapshot = z.infer<typeof CrowdSnapshotSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Socket event payloads
// ──────────────────────────────────────────────────────────────────────────────

/** Payload emitted on the `crowd:update` socket event */
export type CrowdUpdateEvent = {
  readonly venueId: string;
  readonly snapshot: CrowdSnapshot;
};

/** Payload emitted on the `route:update` socket event */
export type RouteUpdateEvent = {
  readonly venueId: string;
  readonly affectedNodeId: string;
  readonly newDensity: DensityLevel;
};
