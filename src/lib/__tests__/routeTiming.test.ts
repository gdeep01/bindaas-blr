import { describe, it, expect } from 'vitest';
import { getRouteBaseTime, getWeightedRouteCongestion, getRouteHash, getTrackedRouteSummary } from '../routeTiming';

describe('routeTiming logic module', () => {
  describe('getRouteBaseTime', () => {
    it('returns 5 minutes if from/to are identical', () => {
      expect(getRouteBaseTime('Hebbal Flyover', 'Hebbal Flyover')).toBe(5);
    });

    it('applies override times correctly', () => {
      expect(getRouteBaseTime('Silk Board Junction', 'Marathahalli Bridge')).toBe(30);
      expect(getRouteBaseTime('MG Road', 'Hebbal Flyover')).toBe(28);
    });

    it('calculates fallback base times automatically via coordinates distance', () => {
      // Very close: < 3 km
      expect(getRouteBaseTime('Koramangala Inner Ring Road', 'HSR Layout')).toBe(12);
      // Medium distance
      expect(getRouteBaseTime('Majestic', 'Indiranagar')).toBe(26);
      // Very far
      expect(getRouteBaseTime('Yelahanka', 'Electronic City Toll')).toBe(42);
    });

    it('returns a default of 25 if coordinates are unknown', () => {
      expect(getRouteBaseTime('Fake Location A', 'Fake Location B')).toBe(25);
    });
  });

  describe('getWeightedRouteCongestion', () => {
    it('calculates weighted sum correctly', () => {
      expect(getWeightedRouteCongestion(100, 50)).toBe(80); // 100*0.6 + 50*0.4 = 60 + 20
      expect(getWeightedRouteCongestion(0, 0)).toBe(0);
      expect(getWeightedRouteCongestion(10, 90)).toBe(42); // 6 + 36 = 42
    });
  });

  describe('getRouteHash', () => {
    it('generates consistent hash for same routes', () => {
      const hash1 = getRouteHash('A', 'B');
      const hash2 = getRouteHash('A', 'B');
      const hash3 = getRouteHash('a', 'b');
      expect(hash1).toBe(hash2);
      expect(hash1).toBe(hash3);
    });

    it('generates completely different hashes for different routes', () => {
      const hash1 = getRouteHash('A', 'B');
      const hash2 = getRouteHash('B', 'A');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getTrackedRouteSummary', () => {
    it('returns normalized tracking data', () => {
      const result = getTrackedRouteSummary('Electronic City Toll', 'Malleswaram');
      expect(result.trackedFrom).toBe('Silk Board Junction');
      expect(result.trackedTo).toBe('MG Road');
      expect(result.baseTime).toBeGreaterThan(0);
    });
  });
});
