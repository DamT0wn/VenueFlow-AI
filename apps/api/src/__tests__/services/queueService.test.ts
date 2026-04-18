/**
 * @file queueService.test.ts
 * Unit tests for queue wait-time estimation and status bucketing.
 * Redis is mocked — no real connection required.
 */

import { getQueueStatus, calcWaitMinutes } from '../../services/queueService';

// ── calcWaitMinutes ───────────────────────────────────────────────────────────

describe('calcWaitMinutes', () => {
  it('returns 0 for empty zone (density 0)', () => {
    expect(calcWaitMinutes(0)).toBe(0);
  });

  it('returns correct value at density 100 (max)', () => {
    // 100 × 0.3 = 30
    expect(calcWaitMinutes(100)).toBe(30);
  });

  it('rounds correctly at density 50', () => {
    // 50 × 0.3 = 15
    expect(calcWaitMinutes(50)).toBe(15);
  });

  it('rounds correctly at density 33', () => {
    // 33 × 0.3 = 9.9 → rounds to 10
    expect(calcWaitMinutes(33)).toBe(10);
  });

  it('never returns negative values', () => {
    expect(calcWaitMinutes(-10)).toBe(0);
  });

  it('handles boundary density 1', () => {
    // 1 × 0.3 = 0.3 → rounds to 0
    expect(calcWaitMinutes(1)).toBe(0);
  });
});

// ── getQueueStatus ────────────────────────────────────────────────────────────

describe('getQueueStatus', () => {
  it('returns "low" for 0 minutes', () => {
    expect(getQueueStatus(0)).toBe('low');
  });

  it('returns "low" for 4 minutes (below LOW threshold of 5)', () => {
    expect(getQueueStatus(4)).toBe('low');
  });

  it('returns "medium" at exactly LOW threshold (5 minutes)', () => {
    expect(getQueueStatus(5)).toBe('medium');
  });

  it('returns "medium" for 14 minutes (below HIGH threshold of 15)', () => {
    expect(getQueueStatus(14)).toBe('medium');
  });

  it('returns "high" at exactly HIGH threshold (15 minutes)', () => {
    expect(getQueueStatus(15)).toBe('high');
  });

  it('returns "high" for 30 minutes', () => {
    expect(getQueueStatus(30)).toBe('high');
  });

  it('is consistent with calcWaitMinutes at density 80', () => {
    // 80 × 0.3 = 24 → high
    const wait = calcWaitMinutes(80);
    expect(getQueueStatus(wait)).toBe('high');
  });

  it('is consistent with calcWaitMinutes at density 10', () => {
    // 10 × 0.3 = 3 → low
    const wait = calcWaitMinutes(10);
    expect(getQueueStatus(wait)).toBe('low');
  });
});
