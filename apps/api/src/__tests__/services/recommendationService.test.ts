/**
 * @file recommendationService.test.ts
 * Unit tests for the recommendation engine.
 * Covers: Haversine distance, scoring, density filtering, type mapping.
 */

import { haversineDistance, getRecommendations } from '../../services/recommendationService';
import type { ZoneData } from '@venueflow/shared-types';

// ── haversineDistance ─────────────────────────────────────────────────────────

describe('haversineDistance', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistance(12.9792, 77.5996, 12.9792, 77.5996)).toBe(0);
  });

  it('returns ~111km for 1 degree latitude difference', () => {
    const dist = haversineDistance(0, 0, 1, 0);
    expect(dist).toBeGreaterThan(110_000);
    expect(dist).toBeLessThan(112_000);
  });

  it('returns ~111km for 1 degree longitude difference at equator', () => {
    const dist = haversineDistance(0, 0, 0, 1);
    expect(dist).toBeGreaterThan(110_000);
    expect(dist).toBeLessThan(112_000);
  });

  it('is symmetric (A→B == B→A)', () => {
    const d1 = haversineDistance(12.9792, 77.5996, 12.9802, 77.6008);
    const d2 = haversineDistance(12.9802, 77.6008, 12.9792, 77.5996);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it('returns positive distance for nearby points', () => {
    const dist = haversineDistance(12.9792, 77.5996, 12.9793, 77.5997);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(200); // Should be ~15m
  });
});

// ── getRecommendations ────────────────────────────────────────────────────────

const MOCK_ZONES: ZoneData[] = [
  { id: 'zone-food-1', name: 'Pavilion Food Court', density: 20, lat: 12.9795, lng: 77.5992, radius: 50, updatedAt: new Date() },
  { id: 'zone-food-2', name: 'Corporate Lounge',    density: 35, lat: 12.9789, lng: 77.6000, radius: 50, updatedAt: new Date() },
  { id: 'zone-rest-1', name: 'North Restrooms',     density: 10, lat: 12.9800, lng: 77.5994, radius: 30, updatedAt: new Date() },
];

// User standing near the centre of the stadium
const USER_LAT = 12.9792;
const USER_LNG = 77.5996;

describe('getRecommendations', () => {
  it('returns an array', async () => {
    const recs = await getRecommendations('test-venue', 'user-1', 'food', USER_LAT, USER_LNG, MOCK_ZONES);
    expect(Array.isArray(recs)).toBe(true);
  });

  it('returns at most RECOMMENDATION_TOP_N (3) results', async () => {
    const recs = await getRecommendations('test-venue', 'user-1', 'food', USER_LAT, USER_LNG, MOCK_ZONES);
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it('each recommendation has required fields', async () => {
    const recs = await getRecommendations('test-venue', 'user-1', 'food', USER_LAT, USER_LNG, MOCK_ZONES);
    for (const rec of recs) {
      expect(rec).toHaveProperty('id');
      expect(rec).toHaveProperty('nodeId');
      expect(rec).toHaveProperty('nodeName');
      expect(rec).toHaveProperty('type', 'food');
      expect(rec).toHaveProperty('score');
      expect(rec).toHaveProperty('distanceMetres');
      expect(rec).toHaveProperty('currentDensity');
      expect(rec).toHaveProperty('reason');
      expect(rec).toHaveProperty('generatedAt');
    }
  });

  it('scores are between 0 and 1', async () => {
    const recs = await getRecommendations('test-venue', 'user-1', 'food', USER_LAT, USER_LNG, MOCK_ZONES);
    for (const rec of recs) {
      expect(rec.score).toBeGreaterThanOrEqual(0);
      expect(rec.score).toBeLessThanOrEqual(1);
    }
  });

  it('results are sorted by score descending', async () => {
    const recs = await getRecommendations('test-venue', 'user-1', 'food', USER_LAT, USER_LNG, MOCK_ZONES);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1]!.score).toBeGreaterThanOrEqual(recs[i]!.score);
    }
  });

  it('returns empty array when user is far from all nodes', async () => {
    // User in the middle of the ocean — no nodes within 500m
    const recs = await getRecommendations('test-venue', 'user-1', 'food', 0, 0, MOCK_ZONES);
    expect(recs).toHaveLength(0);
  });

  it('venueId and userId are set correctly on results', async () => {
    const recs = await getRecommendations('venue-xyz', 'user-abc', 'food', USER_LAT, USER_LNG, MOCK_ZONES);
    for (const rec of recs) {
      expect(rec.venueId).toBe('venue-xyz');
      expect(rec.userId).toBe('user-abc');
    }
  });
});
