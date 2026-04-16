import type { VenueGraph, VenueNode, RouteResponse } from '@venueflow/shared-types';
import { ROUTE_REROUTE_DENSITY_DELTA } from '@venueflow/shared-types';
import type { CrowdSnapshot } from '@venueflow/shared-types';
import { AppError, ErrorCode } from '../middleware/errorHandler';
import { logger } from '../lib/logger';

// ──────────────────────────────────────────────────────────────────────────────
// Adjacency map type
// ──────────────────────────────────────────────────────────────────────────────

type AdjacencyMap = Map<string, Array<{ nodeId: string; baseWeight: number }>>;

// ──────────────────────────────────────────────────────────────────────────────
// Graph utilities
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Builds an adjacency list map from a VenueGraph for O(1) neighbour lookups.
 *
 * @param {VenueGraph} graph - Venue graph to index
 * @returns {AdjacencyMap} Map from nodeId to array of {nodeId, baseWeight} neighbours
 */
export function buildAdjacencyMap(graph: VenueGraph): AdjacencyMap {
  const adj: AdjacencyMap = new Map();

  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }

  for (const edge of graph.edges) {
    const neighbours = adj.get(edge.from);
    if (neighbours) {
      neighbours.push({ nodeId: edge.to, baseWeight: edge.baseWeight });
    }
  }

  return adj;
}

/**
 * Computes the crowd-adjusted edge weight for a traversal.
 *
 * @param {number} baseWeight  - Base traversal weight in seconds
 * @param {number} density     - Crowd density at the destination node (0–100)
 * @returns {number} Weighted traversal time in seconds
 */
export function computeWeightedEdge(baseWeight: number, density: number): number {
  const crowdFactor = density / 100;
  return baseWeight * (1 + crowdFactor);
}

// ──────────────────────────────────────────────────────────────────────────────
// Dijkstra's Algorithm
// ──────────────────────────────────────────────────────────────────────────────

interface DijkstraResult {
  path: VenueNode[];
  totalWeightedTime: number;
}

/**
 * Runs Dijkstra's shortest-path algorithm on a venue graph, adjusting edge
 * weights for real-time crowd density.
 *
 * Edge weight formula: baseWeight × (1 + destinationNodeDensity / 100)
 *
 * @param {VenueGraph} graph      - The venue graph to route within
 * @param {string} fromNodeId     - Starting node ID
 * @param {string} toNodeId       - Destination node ID
 * @param {CrowdSnapshot | null} snapshot - Current crowd snapshot for density factors
 * @returns {DijkstraResult | null} Optimal path or null if unreachable
 */
export function dijkstra(
  graph: VenueGraph,
  fromNodeId: string,
  toNodeId: string,
  snapshot: CrowdSnapshot | null,
): DijkstraResult | null {
  const nodeMap = new Map<string, VenueNode>(graph.nodes.map((n) => [n.id, n]));
  const adj = buildAdjacencyMap(graph);

  // Density lookup from snapshot — keyed by zone name similarity to node id
  const densityMap = new Map<string, number>();
  if (snapshot) {
    for (const zone of snapshot.zones) {
      // Map zone ids to node ids by matching substring patterns
      for (const node of graph.nodes) {
        if (zone.id.includes(node.id) || node.id.includes(zone.id.replace('zone-', ''))) {
          densityMap.set(node.id, zone.density);
        }
      }
    }
  }

  const getDensity = (nodeId: string): number => densityMap.get(nodeId) ?? 0;

  // Distance map — Infinity until visited
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const node of graph.nodes) {
    dist.set(node.id, Infinity);
    prev.set(node.id, null);
  }
  dist.set(fromNodeId, 0);

  // Simple priority queue using a sorted array (acceptable for ≤100 nodes)
  const pq: Array<{ nodeId: string; dist: number }> = [{ nodeId: fromNodeId, dist: 0 }];

  while (pq.length > 0) {
    // Extract minimum
    pq.sort((a, b) => a.dist - b.dist);
    const current = pq.shift();
    if (!current) break;

    const { nodeId: currentId } = current;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    if (currentId === toNodeId) break; // Found target — stop early

    const neighbours = adj.get(currentId) ?? [];
    for (const { nodeId: neighbourId, baseWeight } of neighbours) {
      if (visited.has(neighbourId)) continue;

      const density = getDensity(neighbourId);
      const edgeWeight = computeWeightedEdge(baseWeight, density);
      const newDist = (dist.get(currentId) ?? Infinity) + edgeWeight;

      if (newDist < (dist.get(neighbourId) ?? Infinity)) {
        dist.set(neighbourId, newDist);
        prev.set(neighbourId, currentId);
        pq.push({ nodeId: neighbourId, dist: newDist });
      }
    }
  }

  // Unreachable
  const totalWeight = dist.get(toNodeId) ?? Infinity;
  if (totalWeight === Infinity) return null;

  // Reconstruct path
  const pathIds: string[] = [];
  let cursor: string | null | undefined = toNodeId;
  while (cursor !== null && cursor !== undefined) {
    pathIds.unshift(cursor);
    cursor = prev.get(cursor);
  }

  const path = pathIds
    .map((id) => nodeMap.get(id))
    .filter((n): n is VenueNode => n !== undefined);

  return { path, totalWeightedTime: totalWeight };
}

// ──────────────────────────────────────────────────────────────────────────────
// Pathfinding Service
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Computes a route between two venue nodes using Dijkstra's algorithm
 * with real-time crowd density weighting.
 *
 * @param {VenueGraph} graph      - The venue graph
 * @param {string} fromNodeId     - Starting node ID
 * @param {string} toNodeId       - Destination node ID
 * @param {CrowdSnapshot | null} snapshot - Current crowd data for density weighting
 * @returns {Promise<RouteResponse>} The optimal route with ETA and optional alternates
 * @throws {AppError} 404 if nodes not found; 422 if destination unreachable
 */
export async function computeRoute(
  graph: VenueGraph,
  fromNodeId: string,
  toNodeId: string,
  snapshot: CrowdSnapshot | null,
): Promise<RouteResponse> {
  const nodeIds = new Set(graph.nodes.map((n) => n.id));

  if (!nodeIds.has(fromNodeId)) {
    throw new AppError(`Node '${fromNodeId}' not found in venue graph`, 404, ErrorCode.NOT_FOUND);
  }
  if (!nodeIds.has(toNodeId)) {
    throw new AppError(`Node '${toNodeId}' not found in venue graph`, 404, ErrorCode.NOT_FOUND);
  }

  const primary = dijkstra(graph, fromNodeId, toNodeId, snapshot);

  if (!primary) {
    throw new AppError(
      `No route found from '${fromNodeId}' to '${toNodeId}'`,
      422,
      ErrorCode.VALIDATION_ERROR,
    );
  }

  const estimatedMinutes = Math.ceil(primary.totalWeightedTime / 60);

  logger.info({
    message: 'Route computed',
    from: fromNodeId,
    to: toNodeId,
    steps: primary.path.length,
    estimatedMinutes,
    totalWeightedTime: Math.round(primary.totalWeightedTime),
  });

  return {
    path: primary.path,
    totalWeightedTime: Math.round(primary.totalWeightedTime),
    estimatedMinutes,
  };
}

/**
 * Checks whether a density change on a node warrants a route:update socket event.
 *
 * @param {number} previousDensity - Previous density value (0–100)
 * @param {number} newDensity      - New density value (0–100)
 * @returns {boolean} true if the change exceeds the reroute delta threshold
 */
export function shouldTriggerReroute(previousDensity: number, newDensity: number): boolean {
  return Math.abs(newDensity - previousDensity) >= ROUTE_REROUTE_DENSITY_DELTA;
}
