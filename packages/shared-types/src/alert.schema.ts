import { z } from 'zod';

// ──────────────────────────────────────────────────────────────────────────────
// Alert Type Discriminated Union
// ──────────────────────────────────────────────────────────────────────────────

export const AlertTypeSchema = z
  .enum(['critical', 'info', 'evacuation'])
  .describe('Severity and display behaviour of the alert');

export type AlertType = z.infer<typeof AlertTypeSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Alert Schema
// ──────────────────────────────────────────────────────────────────────────────

export const AlertSchema = z.object({
  /** Firestore document ID */
  id: z.string().describe('Firestore document ID'),
  /** Firebase venue document ID this alert belongs to */
  venueId: z.string().min(1).describe('Firebase venue document ID'),
  /** Short title shown in the alert banner / feed */
  title: z.string().min(1).max(120).describe('Short title shown in the alert banner'),
  /** Detailed message body */
  body: z.string().min(1).max(1200).describe('Detailed message body'),
  /** Severity classification */
  type: AlertTypeSchema,
  /**
   * Optional zone this alert is scoped to.
   * When omitted the alert applies venue-wide.
   */
  targetZoneId: z
    .string()
    .optional()
    .describe('Zone this alert is scoped to; omit for venue-wide alerts'),
  /** When this alert was created */
  createdAt: z.coerce.date().describe('When this alert was created'),
  /** When this alert automatically expires; past dates are treated as expired */
  expiresAt: z.coerce.date().describe('When this alert automatically expires'),
  /** Whether the alert has been explicitly marked as expired */
  expired: z.boolean().default(false).describe('Whether the alert has been marked as expired'),
});

export type Alert = z.infer<typeof AlertSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Alert Creation Request (omits server-generated fields)
// ──────────────────────────────────────────────────────────────────────────────

export const CreateAlertSchema = AlertSchema.omit({
  id: true,
  createdAt: true,
  expired: true,
});

export type CreateAlertRequest = z.infer<typeof CreateAlertSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Queue Point Schema
// ──────────────────────────────────────────────────────────────────────────────

export const QueueStatusSchema = z
  .enum(['low', 'medium', 'high'])
  .describe('Queue congestion level');

export type QueueStatus = z.infer<typeof QueueStatusSchema>;

export const QueuePointSchema = z.object({
  /** Node ID from the venue graph */
  nodeId: z.string().describe('Node ID from the venue graph'),
  /** Human-readable node name */
  nodeName: z.string().describe('Human-readable node name'),
  /** Node type for icon mapping */
  type: z.enum(['gate', 'food', 'restroom', 'exit', 'section', 'first_aid']),
  /** Current density at this node 0–100 */
  currentDensity: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe('Current density at this node'),
  /**
   * Estimated wait time in minutes.
   * Calculated as Math.round(density × 0.3)
   */
  estimatedWaitMinutes: z
    .number()
    .nonnegative()
    .describe('Estimated wait time in minutes'),
  /** Congestion severity bucket */
  status: QueueStatusSchema,
  /** Last 5 density readings for the sparkline chart */
  densityHistory: z
    .array(z.number().int().min(0).max(100))
    .max(5)
    .describe('Last 5 density readings for sparkline'),
  /** When this queue point was last updated */
  updatedAt: z.coerce.date().describe('When this queue point was last updated'),
});

export type QueuePoint = z.infer<typeof QueuePointSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Recommendation Schema
// ──────────────────────────────────────────────────────────────────────────────

export const RecommendationTypeSchema = z
  .enum(['food', 'restroom', 'exit', 'shortcut'])
  .describe('Category of recommendation');

export type RecommendationType = z.infer<typeof RecommendationTypeSchema>;

export const RecommendationSchema = z.object({
  /** Unique recommendation ID */
  id: z.string().describe('Unique recommendation ID'),
  /** Venue this recommendation is for */
  venueId: z.string().describe('Venue this recommendation is for'),
  /** Requesting user ID */
  userId: z.string().describe('Requesting user ID'),
  /** Target venue node */
  nodeId: z.string().describe('Target venue node ID'),
  /** Human-readable node name */
  nodeName: z.string().describe('Human-readable node name'),
  /** Recommendation category */
  type: RecommendationTypeSchema,
  /** Human-readable explanation of why this is recommended */
  reason: z.string().describe('Why this location is recommended'),
  /**
   * Composite score (0–1). Higher = better recommendation.
   * score = proximity_factor × (1 - density / 100)
   */
  score: z.number().min(0).max(1).describe('Composite recommendation score 0–1'),
  /** Distance from user's current location in metres */
  distanceMetres: z.number().nonnegative().describe('Distance from current location in metres'),
  /** Current density at node (0–100) */
  currentDensity: z.number().int().min(0).max(100),
  /** When this recommendation was generated */
  generatedAt: z.coerce.date().describe('When this recommendation was generated'),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

export const RecommendationRequestSchema = z.object({
  venueId: z.string().min(1),
  type: RecommendationTypeSchema,
  /** User latitude */
  lat: z.coerce.number().min(-90).max(90),
  /** User longitude */
  lng: z.coerce.number().min(-180).max(180),
});

export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>;
