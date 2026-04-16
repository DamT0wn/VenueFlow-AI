/**
 * @file packages/shared-types/src/index.ts
 * Central re-export for all shared types, schemas, and constants.
 * Import from `@venueflow/shared-types` in both frontend and backend code.
 */

// Venue types
export {
  VenueNodeSchema,
  VenueEdgeSchema,
  VenueGraphSchema,
  RouteRequestSchema,
  RouteResponseSchema,
  NodeTypeSchema,
  type VenueId,
  type NodeId,
  type NodeType,
  type VenueNode,
  type VenueEdge,
  type VenueGraph,
  type RouteRequest,
  type RouteResponse,
} from './venue.schema';

// Crowd types
export {
  DensityLevelSchema,
  ZoneDataSchema,
  CrowdSnapshotSchema,
  type ZoneId,
  type DensityLevel,
  type ZoneData,
  type CrowdSnapshot,
  type CrowdUpdateEvent,
  type RouteUpdateEvent,
} from './crowd.schema';

// Alert, Queue, and Recommendation types
export {
  AlertTypeSchema,
  AlertSchema,
  CreateAlertSchema,
  QueueStatusSchema,
  QueuePointSchema,
  RecommendationTypeSchema,
  RecommendationSchema,
  RecommendationRequestSchema,
  type AlertType,
  type Alert,
  type CreateAlertRequest,
  type QueueStatus,
  type QueuePoint,
  type RecommendationType,
  type Recommendation,
  type RecommendationRequest,
} from './alert.schema';

// ──────────────────────────────────────────────────────────────────────────────
// Shared Constants
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Crowd update interval in milliseconds.
 * The simulator emits a new CrowdSnapshot every CROWD_UPDATE_INTERVAL_MS.
 */
export const CROWD_UPDATE_INTERVAL_MS = 5_000 as const;

/**
 * Redis TTL for crowd snapshots in seconds.
 */
export const CROWD_SNAPSHOT_TTL_SECONDS = 30 as const;

/**
 * Redis TTL for queue points in seconds.
 */
export const QUEUE_TTL_SECONDS = 60 as const;

/**
 * Maximum search radius for recommendations in metres.
 */
export const RECOMMENDATION_SEARCH_RADIUS_METRES = 500 as const;

/**
 * Maximum crowd density allowed for a node to be recommended.
 * Nodes with density >= this value are excluded from recommendations.
 */
export const RECOMMENDATION_MAX_DENSITY = 40 as const;

/**
 * Maximum number of recommendations returned per request.
 */
export const RECOMMENDATION_TOP_N = 3 as const;

/**
 * Density delta (0–100 points) that triggers a dynamic route:update event.
 * When a node on an active route increases by this many density points,
 * the server proactively notifies connected clients to re-route.
 */
export const ROUTE_REROUTE_DENSITY_DELTA = 20 as const;

/**
 * Queue status thresholds in minutes.
 * - low:    < LOW_QUEUE_THRESHOLD_MINUTES
 * - medium: >= LOW_QUEUE_THRESHOLD_MINUTES && < HIGH_QUEUE_THRESHOLD_MINUTES
 * - high:   >= HIGH_QUEUE_THRESHOLD_MINUTES
 */
export const LOW_QUEUE_THRESHOLD_MINUTES = 5 as const;
export const HIGH_QUEUE_THRESHOLD_MINUTES = 15 as const;

/**
 * Baseline wait time coefficient for queue estimation.
 * estimatedWaitMinutes = Math.round(density × QUEUE_WAIT_COEFFICIENT)
 */
export const QUEUE_WAIT_COEFFICIENT = 0.3 as const;

/**
 * Duration in milliseconds before 'info' alert banners auto-dismiss.
 */
export const INFO_ALERT_AUTO_DISMISS_MS = 8_000 as const;

/**
 * WebSocket room prefix for venue-scoped events.
 * @example `${VENUE_ROOM_PREFIX}venue-001`
 */
export const VENUE_ROOM_PREFIX = 'venue:' as const;

/**
 * Redis key template for crowd snapshots.
 * @example crowdSnapshotKey('venue-001') → 'crowd:venue-001:snapshot'
 */
export const crowdSnapshotKey = (venueId: string): string =>
  `crowd:${venueId}:snapshot`;

/**
 * Redis key template for individual queue points.
 * @example queuePointKey('venue-001', 'node-gate-a') → 'queue:venue-001:node-gate-a'
 */
export const queuePointKey = (venueId: string, nodeId: string): string =>
  `queue:${venueId}:${nodeId}`;
