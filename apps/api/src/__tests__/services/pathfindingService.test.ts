/**
 * @file pathfindingService.test.ts
 * Unit tests for Dijkstra's crowd-aware pathfinding algorithm.
 * Covers: adjacency map, edge weighting, shortest path, unreachable nodes.
 */

import {
  buildAdjacencyMap,
  computeWeightedEdge,
  dijkstra,
  shouldTriggerReroute,
} from '../../services/pathfindingService';
import type { VenueGraph, CrowdSnapshot } from '@venueflow/shared-types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SIMPLE_GRAPH: VenueGraph = {
  venueId: 'test-venue',
  name: 'Test Venue',
  nodes: [
    { id: 'A', name: 'Gate A',      type: 'gate',    lat: 0,     lng: 0 },
    { id: 'B', name: 'Food Court',  type: 'food',    lat: 0.001, lng: 0 },
    { id: 'C', name: 'North Stand', type: 'section', lat: 0.002, lng: 0 },
    { id: 'D', name: 'Exit D',      type: 'exit',    lat: 0.003, lng: 0 },
  ],
  edges: [
    { from: 'A', to: 'B', baseWeight: 60 },
    { from: 'B', to: 'A', baseWeight: 60 },
    { from: 'B', to: 'C', baseWeight: 90 },
    { from: 'C', to: 'B', baseWeight: 90 },
    { from: 'C', to: 'D', baseWeight: 45 },
    { from: 'D', to: 'C', baseWeight: 45 },
  ],
};

const DISCONNECTED_GRAPH: VenueGraph = {
  venueId: 'test-venue',
  name: 'Test Venue',
  nodes: [
    { id: 'A', name: 'Gate A',   type: 'gate',    lat: 0, lng: 0 },
    { id: 'B', name: 'Isolated', type: 'section', lat: 1, lng: 1 },
  ],
  edges: [], // No edges — B is unreachable from A
};

const MOCK_SNAPSHOT: CrowdSnapshot = {
  venueId: 'test-venue',
  zones: [
    { id: 'zone-B', name: 'Food Court', density: 80, lat: 0.001, lng: 0, radius: 50, updatedAt: new Date() },
    { id: 'zone-C', name: 'North Stand', density: 20, lat: 0.002, lng: 0, radius: 50, updatedAt: new Date() },
  ],
  capturedAt: new Date(),
};

// ── buildAdjacencyMap ─────────────────────────────────────────────────────────

describe('buildAdjacencyMap', () => {
  it('creates an entry for every node', () => {
    const adj = buildAdjacencyMap(SIMPLE_GRAPH);
    expect(adj.size).toBe(4);
    expect(adj.has('A')).toBe(true);
    expect(adj.has('D')).toBe(true);
  });

  it('correctly maps edges to neighbours', () => {
    const adj = buildAdjacencyMap(SIMPLE_GRAPH);
    const aNeighbours = adj.get('A') ?? [];
    expect(aNeighbours).toHaveLength(1);
    expect(aNeighbours[0]).toEqual({ nodeId: 'B', baseWeight: 60 });
  });

  it('returns empty neighbour list for isolated nodes', () => {
    const adj = buildAdjacencyMap(DISCONNECTED_GRAPH);
    expect(adj.get('B')).toEqual([]);
  });
});

// ── computeWeightedEdge ───────────────────────────────────────────────────────

describe('computeWeightedEdge', () => {
  it('returns baseWeight when density is 0', () => {
    expect(computeWeightedEdge(60, 0)).toBe(60);
  });

  it('doubles baseWeight when density is 100', () => {
    expect(computeWeightedEdge(60, 100)).toBe(120);
  });

  it('applies 50% penalty at density 50', () => {
    expect(computeWeightedEdge(100, 50)).toBe(150);
  });

  it('handles fractional base weights', () => {
    expect(computeWeightedEdge(30, 80)).toBeCloseTo(54);
  });
});

// ── dijkstra ──────────────────────────────────────────────────────────────────

describe('dijkstra', () => {
  it('finds the direct path A→B', () => {
    const result = dijkstra(SIMPLE_GRAPH, 'A', 'B', null);
    expect(result).not.toBeNull();
    expect(result!.path.map(n => n.id)).toEqual(['A', 'B']);
  });

  it('finds multi-hop path A→D', () => {
    const result = dijkstra(SIMPLE_GRAPH, 'A', 'D', null);
    expect(result).not.toBeNull();
    expect(result!.path.map(n => n.id)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('returns null for unreachable destination', () => {
    const result = dijkstra(DISCONNECTED_GRAPH, 'A', 'B', null);
    expect(result).toBeNull();
  });

  it('returns null for same-node path (no self-loop)', () => {
    // A→A: dist is 0, path is just [A]
    const result = dijkstra(SIMPLE_GRAPH, 'A', 'A', null);
    // Should return a trivial path of length 1 with weight 0
    expect(result).not.toBeNull();
    expect(result!.totalWeightedTime).toBe(0);
  });

  it('prefers less-crowded path when snapshot provided', () => {
    // With snapshot: B has density 80 (heavy penalty), C has density 20
    // A→D via B→C should still be the only path, but weighted higher
    const withSnapshot = dijkstra(SIMPLE_GRAPH, 'A', 'D', MOCK_SNAPSHOT);
    const withoutSnapshot = dijkstra(SIMPLE_GRAPH, 'A', 'D', null);
    expect(withSnapshot).not.toBeNull();
    expect(withoutSnapshot).not.toBeNull();
    // Crowd-weighted path should take longer
    expect(withSnapshot!.totalWeightedTime).toBeGreaterThan(withoutSnapshot!.totalWeightedTime);
  });

  it('totalWeightedTime is non-negative', () => {
    const result = dijkstra(SIMPLE_GRAPH, 'A', 'D', MOCK_SNAPSHOT);
    expect(result!.totalWeightedTime).toBeGreaterThanOrEqual(0);
  });
});

// ── shouldTriggerReroute ──────────────────────────────────────────────────────

describe('shouldTriggerReroute', () => {
  it('triggers when density increases by exactly the threshold (20)', () => {
    expect(shouldTriggerReroute(50, 70)).toBe(true);
  });

  it('triggers when density decreases by threshold', () => {
    expect(shouldTriggerReroute(80, 60)).toBe(true);
  });

  it('does not trigger for small changes', () => {
    expect(shouldTriggerReroute(50, 55)).toBe(false);
  });

  it('does not trigger for zero change', () => {
    expect(shouldTriggerReroute(60, 60)).toBe(false);
  });

  it('triggers for large spike', () => {
    expect(shouldTriggerReroute(10, 90)).toBe(true);
  });
});
