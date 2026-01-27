import {
  formatISOTimestamp,
  formatISODate,
  formatISOTime,
} from '@/utils/dateFormatters';

describe('dateFormatters utility', () => {
  describe('formatISOTimestamp', () => {
    it('should format valid ISO timestamp to mm/dd/yyyy hh:mm:ss', () => {
      const isoTimestamp = '2026-01-20T20:41:50.9235932';
      const result = formatISOTimestamp(isoTimestamp);
      expect(result).toBe('01/20/2026 20:41:50');
    });

    it('should format ISO timestamp without milliseconds', () => {
      const isoTimestamp = '2026-01-20T20:41:50';
      const result = formatISOTimestamp(isoTimestamp);
      expect(result).toBe('01/20/2026 20:41:50');
    });

    it('should format ISO timestamp with Z timezone', () => {
      const isoTimestamp = '2026-01-20T20:41:50Z';
      const result = formatISOTimestamp(isoTimestamp);
      // Note: Z timezone will be converted to local time, so we check format instead of exact time
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
    });

    it('should handle single digit months and days', () => {
      const isoTimestamp = '2026-03-05T08:05:03';
      const result = formatISOTimestamp(isoTimestamp);
      expect(result).toBe('03/05/2026 08:05:03');
    });

    it('should return empty string for null input', () => {
      expect(formatISOTimestamp(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(formatISOTimestamp(undefined)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(formatISOTimestamp('')).toBe('');
    });

    it('should return original string for invalid date', () => {
      const invalidDate = 'invalid-date';
      const result = formatISOTimestamp(invalidDate);
      expect(result).toBe(invalidDate);
    });

    it('should handle edge case dates', () => {
      const newYear = '2026-01-01T00:00:00';
      const result = formatISOTimestamp(newYear);
      expect(result).toBe('01/01/2026 00:00:00');
    });
  });

  describe('formatISODate', () => {
    it('should format valid ISO timestamp to mm/dd/yyyy', () => {
      const isoTimestamp = '2026-01-20T20:41:50.9235932';
      const result = formatISODate(isoTimestamp);
      expect(result).toBe('01/20/2026');
    });

    it('should format ISO date without time', () => {
      const isoDate = '2026-01-20T00:00:00';
      const result = formatISODate(isoDate);
      expect(result).toBe('01/20/2026');
    });

    it('should handle single digit months and days', () => {
      const isoTimestamp = '2026-03-05T08:05:03';
      const result = formatISODate(isoTimestamp);
      expect(result).toBe('03/05/2026');
    });

    it('should return empty string for null input', () => {
      expect(formatISODate(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(formatISODate(undefined)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(formatISODate('')).toBe('');
    });

    it('should return original string for invalid date', () => {
      const invalidDate = 'invalid-date';
      const result = formatISODate(invalidDate);
      expect(result).toBe(invalidDate);
    });

    it('should handle leap year dates', () => {
      const leapYear = '2024-02-29T12:00:00';
      const result = formatISODate(leapYear);
      expect(result).toBe('02/29/2024');
    });
  });

  describe('formatISOTime', () => {
    it('should format valid ISO timestamp to hh:mm:ss', () => {
      const isoTimestamp = '2026-01-20T20:41:50.9235932';
      const result = formatISOTime(isoTimestamp);
      expect(result).toBe('20:41:50');
    });

    it('should format time with single digit hours', () => {
      const isoTimestamp = '2026-01-20T08:05:03';
      const result = formatISOTime(isoTimestamp);
      expect(result).toBe('08:05:03');
    });

    it('should handle midnight time', () => {
      const midnight = '2026-01-20T00:00:00';
      const result = formatISOTime(midnight);
      expect(result).toBe('00:00:00');
    });

    it('should handle noon time', () => {
      const noon = '2026-01-20T12:00:00';
      const result = formatISOTime(noon);
      expect(result).toBe('12:00:00');
    });

    it('should return empty string for null input', () => {
      expect(formatISOTime(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(formatISOTime(undefined)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(formatISOTime('')).toBe('');
    });

    it('should return original string for invalid date', () => {
      const invalidDate = 'invalid-date';
      const result = formatISOTime(invalidDate);
      expect(result).toBe(invalidDate);
    });

    it('should handle timezone offsets', () => {
      const withTimezone = '2026-01-20T20:41:50+05:00';
      const result = formatISOTime(withTimezone);
      // Note: This will be converted to local time, so we just check it's a valid time format
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should log warning for invalid dates', () => {
      const invalidDate = 'not-a-date';
      formatISOTimestamp(invalidDate);
      expect(console.warn).toHaveBeenCalledWith('Invalid date:', invalidDate);
    });

    it('should handle malformed ISO strings gracefully', () => {
      const malformed = '2026-13-45T25:70:80'; // Invalid month, day, hour, minute, second
      const result = formatISOTimestamp(malformed);
      expect(result).toBe(malformed);
    });
  });
});
