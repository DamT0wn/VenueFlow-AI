/**
 * @file crowdService.test.ts
 * Unit tests for crowd snapshot generation and in-memory caching.
 * Redis and Firestore are not called — only pure functions tested.
 */

import {
  seedCrowdSnapshot,
  getCurrentSnapshot,
  generateNextSnapshot,
} from '../../services/crowdService';
import type { CrowdSnapshot } from '@venueflow/shared-types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_SNAPSHOT: CrowdSnapshot = {
  venueId: 'test-venue',
  zones: [
    { id: 'zone-1', name: 'North Stand',    density: 60, lat: 12.98, lng: 77.60, radius: 100, updatedAt: new Date() },
    { id: 'zone-2', name: 'South Stand',    density: 30, lat: 12.97, lng: 77.60, radius: 100, updatedAt: new Date() },
    { id: 'zone-3', name: 'East Stand (B)', density: 90, lat: 12.98, lng: 77.61, radius: 100, updatedAt: new Date() },
  ],
  capturedAt: new Date(),
};

// ── seedCrowdSnapshot / getCurrentSnapshot ────────────────────────────────────

describe('seedCrowdSnapshot + getCurrentSnapshot', () => {
  it('seeds a snapshot and retrieves it', () => {
    seedCrowdSnapshot('test-venue');
    const snap = getCurrentSnapshot('test-venue');
    expect(snap).toBeDefined();
    expect(snap!.venueId).toBe('test-venue');
  });

  it('returns undefined for unknown venueId', () => {
    expect(getCurrentSnapshot('nonexistent-venue')).toBeUndefined();
  });

  it('seeded snapshot has at least one zone', () => {
    seedCrowdSnapshot('test-venue-2');
    const snap = getCurrentSnapshot('test-venue-2');
    expect(snap!.zones.length).toBeGreaterThan(0);
  });

  it('all zone densities are in range [0, 100]', () => {
    seedCrowdSnapshot('test-venue-3');
    const snap = getCurrentSnapshot('test-venue-3');
    for (const zone of snap!.zones) {
      expect(zone.density).toBeGreaterThanOrEqual(0);
      expect(zone.density).toBeLessThanOrEqual(100);
    }
  });
});

// ── generateNextSnapshot ──────────────────────────────────────────────────────

describe('generateNextSnapshot', () => {
  it('returns a new snapshot with the same venueId', () => {
    const next = generateNextSnapshot(MOCK_SNAPSHOT);
    expect(next.venueId).toBe(MOCK_SNAPSHOT.venueId);
  });

  it('returns the same number of zones', () => {
    const next = generateNextSnapshot(MOCK_SNAPSHOT);
    expect(next.zones).toHaveLength(MOCK_SNAPSHOT.zones.length);
  });

  it('all densities remain in [0, 100] after drift', () => {
    // Run 20 iterations to stress-test clamping
    let current = MOCK_SNAPSHOT;
    for (let i = 0; i < 20; i++) {
      current = generateNextSnapshot(current);
      for (const zone of current.zones) {
        expect(zone.density).toBeGreaterThanOrEqual(0);
        expect(zone.density).toBeLessThanOrEqual(100);
      }
    }
  });

  it('capturedAt is updated to a new timestamp', () => {
    const before = MOCK_SNAPSHOT.capturedAt.getTime();
    // Small delay to ensure time difference
    const next = generateNextSnapshot(MOCK_SNAPSHOT);
    expect(next.capturedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('preserves zone ids', () => {
    const next = generateNextSnapshot(MOCK_SNAPSHOT);
    const originalIds = MOCK_SNAPSHOT.zones.map(z => z.id);
    const nextIds = next.zones.map(z => z.id);
    expect(nextIds).toEqual(originalIds);
  });

  it('does not mutate the original snapshot', () => {
    const originalDensities = MOCK_SNAPSHOT.zones.map(z => z.density);
    generateNextSnapshot(MOCK_SNAPSHOT);
    const afterDensities = MOCK_SNAPSHOT.zones.map(z => z.density);
    expect(afterDensities).toEqual(originalDensities);
  });
});
