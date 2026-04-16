import type { Recommendation, RecommendationType, ZoneData } from '@venueflow/shared-types';
import {
  RECOMMENDATION_SEARCH_RADIUS_METRES,
  RECOMMENDATION_MAX_DENSITY,
  RECOMMENDATION_TOP_N,
} from '@venueflow/shared-types';
import { VENUE_GRAPH } from '@venueflow/venue-data';
import { logger } from '../lib/logger';

// ──────────────────────────────────────────────────────────────────────────────
// Haversine distance calculation
// ──────────────────────────────────────────────────────────────────────────────

const EARTH_RADIUS_METRES = 6_371_000;

/**
 * Calculates the great-circle distance between two coordinates using the
 * Haversine formula.
 *
 * @param {number} lat1 - Source latitude in degrees
 * @param {number} lng1 - Source longitude in degrees
 * @param {number} lat2 - Destination latitude in degrees
 * @param {number} lng2 - Destination longitude in degrees
 * @returns {number} Distance in metres
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METRES * c;
}

// ──────────────────────────────────────────────────────────────────────────────
// Recommendation Service
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Generates personalised venue recommendations for a user based on their
 * current location, the desired node type, and real-time crowd densities.
 *
 * Algorithm:
 *   1. Filter venue nodes to the requested type
 *   2. Filter to nodes within 500m of user's position (Haversine)
 *   3. Filter to nodes with density < 40 (crowd threshold)
 *   4. Sort by composite score: proximity × (1 - density / 100)
 *   5. Return top 3
 *
 * @param {string} venueId              - Venue to search within
 * @param {string} userId               - Requesting user ID
 * @param {RecommendationType} type     - Type of node to recommend
 * @param {number} userLat              - User's current latitude
 * @param {number} userLng              - User's current longitude
 * @param {ZoneData[]} zones            - Current crowd snapshot zones
 * @returns {Promise<Recommendation[]>} Top N recommendations sorted by score
 */
export async function getRecommendations(
  venueId: string,
  userId: string,
  type: RecommendationType,
  userLat: number,
  userLng: number,
  zones: ZoneData[],
): Promise<Recommendation[]> {
  // Build a density look up by node proximity
  const getDensityForNode = (nodeLat: number, nodeLng: number): number => {
    // Find nearest zone to this node
    let minDist = Infinity;
    let nearestDensity = 30; // Default mid-density if no zone found

    for (const zone of zones) {
      const dist = haversineDistance(nodeLat, nodeLng, zone.lat, zone.lng);
      if (dist < minDist) {
        minDist = dist;
        nearestDensity = zone.density;
      }
    }
    return nearestDensity;
  };

  // Map RecommendationType to NodeType
  const nodeTypeMap: Record<RecommendationType, string[]> = {
    food: ['food'],
    restroom: ['restroom'],
    exit: ['exit'],
    shortcut: ['gate', 'section'],
  };

  const targetTypes = nodeTypeMap[type];

  // Step 1: filter by type
  const candidateNodes = VENUE_GRAPH.nodes.filter((n) => targetTypes.includes(n.type));

  // Step 2 + 3: filter by distance and density
  type ScoredCandidate = {
    node: (typeof VENUE_GRAPH.nodes)[number];
    distance: number;
    density: number;
    score: number;
    reason: string;
  };

  const candidates: ScoredCandidate[] = [];

  for (const node of candidateNodes) {
    const distance = haversineDistance(userLat, userLng, node.lat, node.lng);
    if (distance > RECOMMENDATION_SEARCH_RADIUS_METRES) continue;

    const density = getDensityForNode(node.lat, node.lng);
    if (density >= RECOMMENDATION_MAX_DENSITY) continue;

    // Normalised proximity score: 1 at 0m, 0 at RECOMMENDATION_SEARCH_RADIUS_METRES
    const proximityScore = 1 - distance / RECOMMENDATION_SEARCH_RADIUS_METRES;
    const crowdScore = 1 - density / 100;
    const score = proximityScore * crowdScore;

    const reason = buildReason(node.name, type, distance, density);

    candidates.push({ node, distance, density, score, reason });
  }

  // Step 4: sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Step 5: return top N
  const topN = candidates.slice(0, RECOMMENDATION_TOP_N);

  const recommendations: Recommendation[] = topN.map((c, index) => ({
    id: `rec-${venueId}-${c.node.id}-${Date.now()}-${index}`,
    venueId,
    userId,
    nodeId: c.node.id,
    nodeName: c.node.name,
    type,
    reason: c.reason,
    score: Math.round(c.score * 1000) / 1000,
    distanceMetres: Math.round(c.distance),
    currentDensity: c.density,
    generatedAt: new Date(),
  }));

  logger.info({
    message: 'Recommendations generated',
    venueId,
    userId,
    type,
    count: recommendations.length,
  });

  return recommendations;
}

/**
 * Builds a human-readable recommendation reason string.
 *
 * @param {string} nodeName  - Node display name
 * @param {RecommendationType} type - Recommendation type
 * @param {number} distance  - Distance in metres
 * @param {number} density   - Current density (0–100)
 * @returns {string} Human-readable reason
 */
function buildReason(
  nodeName: string,
  type: RecommendationType,
  distance: number,
  density: number,
): string {
  const distStr = distance < 100 ? 'nearby' : `${Math.round(distance)}m away`;
  const crowdStr = density < 20 ? 'very quiet' : density < 35 ? 'mostly quiet' : 'moderate crowds';

  switch (type) {
    case 'food':
      return `${nodeName} is ${distStr} with ${crowdStr} — great time to grab a bite!`;
    case 'restroom':
      return `${nodeName} is ${distStr} and has ${crowdStr} right now.`;
    case 'exit':
      return `${nodeName} exit is ${distStr} with ${crowdStr} — fastest way out.`;
    case 'shortcut':
      return `${nodeName} is ${distStr} and less congested — good shortcut.`;
  }
}
