import type { VenueGraph } from '@venueflow/shared-types';

// ──────────────────────────────────────────────────────────────────────────────
// Sample Venue: "Stadium One" — 20-node weighted directed graph
// All weights are base traversal times in seconds at zero crowd density.
//
// Node types: gate | food | restroom | exit | section | first_aid
// Layout mirrors a typical oval stadium with 4 stands and concourse level.
// ──────────────────────────────────────────────────────────────────────────────
export const VENUE_GRAPH: VenueGraph = {
  venueId: 'venue-stadium-one',
  name: 'Stadium One',
  nodes: [
    // ── Gates (entry points) ──────────────────────────────────────────────
    { id: 'gate-a', name: 'Gate A (North)', type: 'gate', lat: 51.5081, lng: -0.1249 },
    { id: 'gate-b', name: 'Gate B (East)', type: 'gate', lat: 51.5074, lng: -0.1232 },
    { id: 'gate-c', name: 'Gate C (South)', type: 'gate', lat: 51.5061, lng: -0.1249 },
    { id: 'gate-d', name: 'Gate D (West)', type: 'gate', lat: 51.5074, lng: -0.1268 },

    // ── Sections (seating areas) ──────────────────────────────────────────
    { id: 'section-north', name: 'North Stand', type: 'section', lat: 51.5079, lng: -0.1249 },
    { id: 'section-east', name: 'East Stand', type: 'section', lat: 51.5074, lng: -0.1236 },
    { id: 'section-south', name: 'South Stand', type: 'section', lat: 51.5063, lng: -0.1249 },
    { id: 'section-west', name: 'West Stand', type: 'section', lat: 51.5074, lng: -0.1264 },

    // ── Food stalls ────────────────────────────────────────────────────────
    { id: 'food-north-1', name: 'Concession Stand N1', type: 'food', lat: 51.5077, lng: -0.1240 },
    { id: 'food-north-2', name: 'Concession Stand N2', type: 'food', lat: 51.5077, lng: -0.1258 },
    { id: 'food-south-1', name: 'Concession Stand S1', type: 'food', lat: 51.5065, lng: -0.1240 },
    { id: 'food-south-2', name: 'Concession Stand S2', type: 'food', lat: 51.5065, lng: -0.1258 },

    // ── Restrooms ─────────────────────────────────────────────────────────
    { id: 'restroom-ne', name: 'Restrooms NE', type: 'restroom', lat: 51.5076, lng: -0.1237 },
    { id: 'restroom-nw', name: 'Restrooms NW', type: 'restroom', lat: 51.5076, lng: -0.1261 },
    { id: 'restroom-se', name: 'Restrooms SE', type: 'restroom', lat: 51.5066, lng: -0.1237 },
    { id: 'restroom-sw', name: 'Restrooms SW', type: 'restroom', lat: 51.5066, lng: -0.1261 },

    // ── Exits ─────────────────────────────────────────────────────────────
    { id: 'exit-north', name: 'Emergency Exit North', type: 'exit', lat: 51.5082, lng: -0.1249 },
    { id: 'exit-south', name: 'Emergency Exit South', type: 'exit', lat: 51.5060, lng: -0.1249 },

    // ── First Aid ─────────────────────────────────────────────────────────
    { id: 'first-aid-main', name: 'Medical Centre', type: 'first_aid', lat: 51.5070, lng: -0.1249 },
    { id: 'first-aid-east', name: 'First Aid Post East', type: 'first_aid', lat: 51.5074, lng: -0.1239 },
  ],

  edges: [
    // ── Gate → Section connections ────────────────────────────────────────
    { from: 'gate-a', to: 'section-north', baseWeight: 60 },
    { from: 'gate-b', to: 'section-east', baseWeight: 60 },
    { from: 'gate-c', to: 'section-south', baseWeight: 60 },
    { from: 'gate-d', to: 'section-west', baseWeight: 60 },

    // Reverse gate → section
    { from: 'section-north', to: 'gate-a', baseWeight: 60 },
    { from: 'section-east', to: 'gate-b', baseWeight: 60 },
    { from: 'section-south', to: 'gate-c', baseWeight: 60 },
    { from: 'section-west', to: 'gate-d', baseWeight: 60 },

    // ── Gate → Gate concourse ring (clockwise) ─────────────────────────
    { from: 'gate-a', to: 'gate-b', baseWeight: 120 },
    { from: 'gate-b', to: 'gate-c', baseWeight: 120 },
    { from: 'gate-c', to: 'gate-d', baseWeight: 120 },
    { from: 'gate-d', to: 'gate-a', baseWeight: 120 },
    // Counter-clockwise
    { from: 'gate-b', to: 'gate-a', baseWeight: 120 },
    { from: 'gate-c', to: 'gate-b', baseWeight: 120 },
    { from: 'gate-d', to: 'gate-c', baseWeight: 120 },
    { from: 'gate-a', to: 'gate-d', baseWeight: 120 },

    // ── Gate → Food stalls ────────────────────────────────────────────────
    { from: 'gate-a', to: 'food-north-1', baseWeight: 45 },
    { from: 'gate-a', to: 'food-north-2', baseWeight: 45 },
    { from: 'gate-b', to: 'food-north-1', baseWeight: 50 },
    { from: 'gate-c', to: 'food-south-1', baseWeight: 45 },
    { from: 'gate-c', to: 'food-south-2', baseWeight: 45 },
    { from: 'gate-d', to: 'food-south-2', baseWeight: 50 },

    // Reverse food → gate
    { from: 'food-north-1', to: 'gate-a', baseWeight: 45 },
    { from: 'food-north-2', to: 'gate-a', baseWeight: 45 },
    { from: 'food-south-1', to: 'gate-c', baseWeight: 45 },
    { from: 'food-south-2', to: 'gate-c', baseWeight: 45 },

    // ── Gate → Restrooms ──────────────────────────────────────────────────
    { from: 'gate-a', to: 'restroom-ne', baseWeight: 40 },
    { from: 'gate-a', to: 'restroom-nw', baseWeight: 40 },
    { from: 'gate-b', to: 'restroom-ne', baseWeight: 35 },
    { from: 'gate-c', to: 'restroom-se', baseWeight: 40 },
    { from: 'gate-c', to: 'restroom-sw', baseWeight: 40 },
    { from: 'gate-d', to: 'restroom-nw', baseWeight: 35 },
    { from: 'gate-d', to: 'restroom-sw', baseWeight: 35 },

    // Reverse restroom → gate
    { from: 'restroom-ne', to: 'gate-a', baseWeight: 40 },
    { from: 'restroom-nw', to: 'gate-a', baseWeight: 40 },
    { from: 'restroom-se', to: 'gate-c', baseWeight: 40 },
    { from: 'restroom-sw', to: 'gate-c', baseWeight: 40 },

    // ── Exits ─────────────────────────────────────────────────────────────
    { from: 'gate-a', to: 'exit-north', baseWeight: 30 },
    { from: 'exit-north', to: 'gate-a', baseWeight: 30 },
    { from: 'gate-c', to: 'exit-south', baseWeight: 30 },
    { from: 'exit-south', to: 'gate-c', baseWeight: 30 },

    // ── First Aid ─────────────────────────────────────────────────────────
    { from: 'gate-a', to: 'first-aid-main', baseWeight: 90 },
    { from: 'gate-b', to: 'first-aid-east', baseWeight: 60 },
    { from: 'gate-c', to: 'first-aid-main', baseWeight: 90 },
    { from: 'first-aid-main', to: 'gate-a', baseWeight: 90 },
    { from: 'first-aid-main', to: 'gate-c', baseWeight: 90 },
    { from: 'first-aid-east', to: 'gate-b', baseWeight: 60 },
  ],
};
