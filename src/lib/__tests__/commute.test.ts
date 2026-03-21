import { describe, it, expect } from 'vitest';
import { getTrackedLocation, getBaseTime, parseHourLabel, formatHourRange } from '../commute';

describe('commute logic module', () => {
  describe('getTrackedLocation', () => {
    it('returns the tracked location mapping if it exists', () => {
      expect(getTrackedLocation('Electronic City Toll')).toBe('Silk Board Junction');
      expect(getTrackedLocation('Indiranagar')).toBe('Koramangala Inner Ring Road');
    });

    it('returns the exact location if no mapping exists', () => {
      expect(getTrackedLocation('MG Road')).toBe('MG Road');
      expect(getTrackedLocation('Unknown Location')).toBe('Unknown Location');
    });
  });

  describe('getBaseTime', () => {
    it('returns 5 minutes for the identical from/to locations', () => {
      expect(getBaseTime('Hebbal Flyover', 'Hebbal Flyover')).toBe(5);
    });

    it('returns 15 minutes for locations within the same zone', () => {
      expect(getBaseTime('Hebbal Flyover', 'Yelahanka')).toBe(15);
    });

    it('returns 30 minutes for locations in adjacent zones', () => {
      expect(getBaseTime('Hebbal Flyover', 'MG Road')).toBe(30); // north -> central
      expect(getBaseTime('Electronic City Toll', 'Whitefield Main Road')).toBe(30); // south -> east
    });

    it('returns 45 minutes for locations across non-adjacent zones', () => {
      expect(getBaseTime('Hebbal Flyover', 'Electronic City Toll')).toBe(45); // north -> south
    });
  });

  describe('parseHourLabel', () => {
    it('correctly parses AM formats', () => {
      expect(parseHourLabel('8 AM')).toBe(8);
      expect(parseHourLabel('12 AM')).toBe(0);
      expect(parseHourLabel('  9AM ')).toBe(9);
    });

    it('correctly parses PM formats', () => {
      expect(parseHourLabel('1 PM')).toBe(13);
      expect(parseHourLabel('12 PM')).toBe(12);
      expect(parseHourLabel('9 PM')).toBe(21);
    });

    it('correctly parses 24-hour style and fallbacks', () => {
      expect(parseHourLabel('14:30')).toBe(14);
      expect(parseHourLabel('15')).toBe(15);
      expect(parseHourLabel('invalid')).toBe(0);
    });
  });

  describe('formatHourRange', () => {
    it('formats an hour range correctly with default duration', () => {
      expect(formatHourRange(8)).toBe('8:00 AM – 10:00 AM');
      expect(formatHourRange(13)).toBe('1:00 PM – 3:00 PM');
      expect(formatHourRange(23)).toBe('11:00 PM – 1:00 AM'); // wrap around
    });

    it('handles custom duration', () => {
      expect(formatHourRange(9, 1)).toBe('9:00 AM – 10:00 AM');
      expect(formatHourRange(11, 3)).toBe('11:00 AM – 2:00 PM');
    });
  });
});
