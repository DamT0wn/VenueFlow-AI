import type { ZoneData } from '@venueflow/shared-types';

// ──────────────────────────────────────────────────────────────────────────────
// Initial crowd density seed values for Stadium One.
// These are the starting densities fed into the crowdSimulator at boot.
// Densities are designed to show interesting variance across zones.
// ──────────────────────────────────────────────────────────────────────────────

const now = new Date();

/**
 * Initial zone data used to seed the crowd simulator.
 * Densities reflect a "gates just opened" state where gates are busy
 * and seating sections are filling up.
 */
export const MOCK_CROWD_SEED: Omit<ZoneData, 'updatedAt'>[] = [
  {
    id: 'zone-gate-a',
    name: 'Gate A (North)',
    density: 78,
    lat: 51.5081,
    lng: -0.1249,
    radius: 80,
  },
  {
    id: 'zone-gate-b',
    name: 'Gate B (East)',
    density: 62,
    lat: 51.5074,
    lng: -0.1232,
    radius: 80,
  },
  {
    id: 'zone-gate-c',
    name: 'Gate C (South)',
    density: 55,
    lat: 51.5061,
    lng: -0.1249,
    radius: 80,
  },
  {
    id: 'zone-gate-d',
    name: 'Gate D (West)',
    density: 48,
    lat: 51.5074,
    lng: -0.1268,
    radius: 80,
  },
  {
    id: 'zone-north-stand',
    name: 'North Stand',
    density: 42,
    lat: 51.5079,
    lng: -0.1249,
    radius: 120,
  },
  {
    id: 'zone-east-stand',
    name: 'East Stand',
    density: 35,
    lat: 51.5074,
    lng: -0.1236,
    radius: 120,
  },
  {
    id: 'zone-south-stand',
    name: 'South Stand',
    density: 28,
    lat: 51.5063,
    lng: -0.1249,
    radius: 120,
  },
  {
    id: 'zone-west-stand',
    name: 'West Stand',
    density: 38,
    lat: 51.5074,
    lng: -0.1264,
    radius: 120,
  },
  {
    id: 'zone-food-north',
    name: 'Food Court North',
    density: 85,
    lat: 51.5077,
    lng: -0.1249,
    radius: 70,
  },
  {
    id: 'zone-food-south',
    name: 'Food Court South',
    density: 66,
    lat: 51.5065,
    lng: -0.1249,
    radius: 70,
  },
  {
    id: 'zone-restrooms-ne',
    name: 'Restrooms NE',
    density: 50,
    lat: 51.5076,
    lng: -0.1237,
    radius: 50,
  },
  {
    id: 'zone-restrooms-nw',
    name: 'Restrooms NW',
    density: 44,
    lat: 51.5076,
    lng: -0.1261,
    radius: 50,
  },
  {
    id: 'zone-restrooms-se',
    name: 'Restrooms SE',
    density: 22,
    lat: 51.5066,
    lng: -0.1237,
    radius: 50,
  },
  {
    id: 'zone-restrooms-sw',
    name: 'Restrooms SW',
    density: 18,
    lat: 51.5066,
    lng: -0.1261,
    radius: 50,
  },
  {
    id: 'zone-concourse',
    name: 'Main Concourse',
    density: 70,
    lat: 51.5071,
    lng: -0.1249,
    radius: 150,
  },
  {
    id: 'zone-first-aid',
    name: 'Medical Centre',
    density: 15,
    lat: 51.5070,
    lng: -0.1249,
    radius: 40,
  },
];

/**
 * Full ZoneData seed with current timestamps.
 * Re-compute timestamps at call time to avoid stale dates in tests.
 *
 * @returns {ZoneData[]} Seeded zone data with current timestamps
 */
export function getMockCrowdSeed(): ZoneData[] {
  const seedTime = new Date();
  return MOCK_CROWD_SEED.map((zone) => ({ ...zone, updatedAt: seedTime }));
}

void now; // suppress unused import warning
