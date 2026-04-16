import { z } from 'zod';

// ──────────────────────────────────────────────────────────────────────────────
// Branded Types
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Branded VenueId type for type-safe venue identification.
 * @example const id = 'venue-001' as VenueId
 */
export type VenueId = string & { readonly __brand: 'VenueId' };

/**
 * Branded NodeId type for type-safe node identification within a venue graph.
 */
export type NodeId = string & { readonly __brand: 'NodeId' };

// ──────────────────────────────────────────────────────────────────────────────
// Node Schema
// ──────────────────────────────────────────────────────────────────────────────

export const NodeTypeSchema = z.enum([
  'gate',
  'food',
  'restroom',
  'exit',
  'section',
  'first_aid',
]);

/**
 * Valid venue node types for graph traversal and UI icon mapping.
 */
export type NodeType = z.infer<typeof NodeTypeSchema>;

export const VenueNodeSchema = z.object({
  /** Unique node identifier within the venue graph */
  id: z.string().describe('Unique node identifier within the venue graph'),
  /** Human-readable node name for display */
  name: z.string().min(1).describe('Human-readable node name for display'),
  /** Functional type of the venue node */
  type: NodeTypeSchema.describe('Functional type of the venue node'),
  /** Latitude coordinate */
  lat: z.number().min(-90).max(90).describe('Latitude coordinate'),
  /** Longitude coordinate */
  lng: z.number().min(-180).max(180).describe('Longitude coordinate'),
});

export type VenueNode = z.infer<typeof VenueNodeSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Edge Schema
// ──────────────────────────────────────────────────────────────────────────────

export const VenueEdgeSchema = z.object({
  /** Source node ID */
  from: z.string().describe('Source node ID'),
  /** Destination node ID */
  to: z.string().describe('Destination node ID'),
  /**
   * Base traversal weight in seconds at zero crowd density.
   * Actual weight = baseWeight × (1 + crowdFactor)
   */
  baseWeight: z
    .number()
    .positive()
    .describe('Base traversal weight in seconds at zero crowd density'),
});

export type VenueEdge = z.infer<typeof VenueEdgeSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Venue Graph Schema
// ──────────────────────────────────────────────────────────────────────────────

export const VenueGraphSchema = z.object({
  /** Firebase venue document ID */
  venueId: z.string().describe('Firebase venue document ID'),
  /** Human-readable venue name */
  name: z.string().describe('Human-readable venue name'),
  /** All navigable nodes within this venue */
  nodes: z.array(VenueNodeSchema).min(1).describe('All navigable nodes within this venue'),
  /** Directed edges connecting nodes */
  edges: z.array(VenueEdgeSchema).describe('Directed edges connecting nodes'),
});

export type VenueGraph = z.infer<typeof VenueGraphSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Route Schema
// ──────────────────────────────────────────────────────────────────────────────

export const RouteRequestSchema = z.object({
  /** Firebase venue ID */
  venueId: z.string().min(1).describe('Firebase venue ID'),
  /** Starting node ID */
  fromNodeId: z.string().min(1).describe('Starting node ID'),
  /** Destination node ID */
  toNodeId: z.string().min(1).describe('Destination node ID'),
});

export type RouteRequest = z.infer<typeof RouteRequestSchema>;

export const RouteResponseSchema = z.object({
  /** Ordered sequence of nodes forming the route */
  path: z.array(VenueNodeSchema).describe('Ordered sequence of nodes forming the route'),
  /**
   * Total edge weight accounting for crowd factors.
   * Units: seconds (weighted).
   */
  totalWeightedTime: z.number().nonnegative().describe('Total weighted traversal time in seconds'),
  /** Human-usable estimated time in minutes */
  estimatedMinutes: z.number().nonnegative().describe('Estimated traversal time in minutes'),
  /** Up to 2 alternative routes (less optimal) */
  alternateRoutes: z
    .array(
      z.object({
        path: z.array(VenueNodeSchema),
        totalWeightedTime: z.number().nonnegative(),
        estimatedMinutes: z.number().nonnegative(),
      }),
    )
    .max(2)
    .optional()
    .describe('Up to 2 alternative routes'),
});

export type RouteResponse = z.infer<typeof RouteResponseSchema>;
