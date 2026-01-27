import {
  getServiceCenterName,
  getServiceCenterCodes,
  getServiceCenterByCode,
  isCodeForServiceCenter,
  serviceCenters,
  serviceCenterMap,
} from '@/utils/serviceCenters';

describe('serviceCenters utility', () => {
  describe('getServiceCenterName', () => {
    it('should return correct service center name for valid numeric code', () => {
      expect(getServiceCenterName(16)).toBe('Andover');
      expect(getServiceCenterName(14)).toBe('Andover');
      expect(getServiceCenterName(75)).toBe('Austin');
      expect(getServiceCenterName(30)).toBe('Philadelphia');
    });

    it('should return correct service center name for valid string code', () => {
      expect(getServiceCenterName('16')).toBe('Andover');
      expect(getServiceCenterName('75')).toBe('Austin');
    });

    it('should return fallback string for unknown code', () => {
      expect(getServiceCenterName(999)).toBe('Service Center 999');
      expect(getServiceCenterName('999')).toBe('Service Center 999');
    });

    it('should handle invalid string codes', () => {
      expect(getServiceCenterName('invalid')).toBe('Service Center invalid');
    });
  });

  describe('getServiceCenterCodes', () => {
    it('should return correct codes for valid service center name', () => {
      expect(getServiceCenterCodes('Andover')).toEqual([14, 16]);
      expect(getServiceCenterCodes('Austin')).toEqual([75, 76, 20, 21]);
      expect(getServiceCenterCodes('Philadelphia')).toEqual([30, 32]);
    });

    it('should be case insensitive', () => {
      expect(getServiceCenterCodes('andover')).toEqual([14, 16]);
      expect(getServiceCenterCodes('AUSTIN')).toEqual([75, 76, 20, 21]);
      expect(getServiceCenterCodes('PhIlAdElPhIa')).toEqual([30, 32]);
    });

    it('should return empty array for unknown service center', () => {
      expect(getServiceCenterCodes('Unknown Center')).toEqual([]);
      expect(getServiceCenterCodes('')).toEqual([]);
    });
  });

  describe('getServiceCenterByCode', () => {
    it('should return correct service center object for valid numeric code', () => {
      const result = getServiceCenterByCode(16);
      expect(result).toEqual({ name: 'Andover', codes: [14, 16] });
    });

    it('should return correct service center object for valid string code', () => {
      const result = getServiceCenterByCode('75');
      expect(result).toEqual({ name: 'Austin', codes: [75, 76, 20, 21] });
    });

    it('should return null for unknown code', () => {
      expect(getServiceCenterByCode(999)).toBeNull();
      expect(getServiceCenterByCode('999')).toBeNull();
    });

    it('should handle invalid string codes', () => {
      expect(getServiceCenterByCode('invalid')).toBeNull();
    });
  });

  describe('isCodeForServiceCenter', () => {
    it('should return true for valid code-center combinations', () => {
      expect(isCodeForServiceCenter(16, 'Andover')).toBe(true);
      expect(isCodeForServiceCenter(14, 'Andover')).toBe(true);
      expect(isCodeForServiceCenter(75, 'Austin')).toBe(true);
      expect(isCodeForServiceCenter('30', 'Philadelphia')).toBe(true);
    });

    it('should be case insensitive for center names', () => {
      expect(isCodeForServiceCenter(16, 'andover')).toBe(true);
      expect(isCodeForServiceCenter(75, 'AUSTIN')).toBe(true);
      expect(isCodeForServiceCenter(30, 'PhIlAdElPhIa')).toBe(true);
    });

    it('should return false for invalid combinations', () => {
      expect(isCodeForServiceCenter(16, 'Austin')).toBe(false);
      expect(isCodeForServiceCenter(75, 'Andover')).toBe(false);
      expect(isCodeForServiceCenter(999, 'Andover')).toBe(false);
    });

    it('should return false for unknown service centers', () => {
      expect(isCodeForServiceCenter(16, 'Unknown Center')).toBe(false);
      expect(isCodeForServiceCenter(16, '')).toBe(false);
    });
  });

  describe('serviceCenterMap', () => {
    it('should contain all codes from serviceCenters array', () => {
      const allCodes = serviceCenters.flatMap(center => center.codes);
      allCodes.forEach(code => {
        expect(serviceCenterMap[code]).toBeDefined();
      });
    });

    it('should map codes to correct service center names', () => {
      expect(serviceCenterMap[16]).toBe('Andover');
      expect(serviceCenterMap[14]).toBe('Andover');
      expect(serviceCenterMap[75]).toBe('Austin');
      expect(serviceCenterMap[30]).toBe('Philadelphia');
    });
  });

  describe('serviceCenters array', () => {
    it('should have the expected structure', () => {
      serviceCenters.forEach(center => {
        expect(center).toHaveProperty('name');
        expect(center).toHaveProperty('codes');
        expect(typeof center.name).toBe('string');
        expect(Array.isArray(center.codes)).toBe(true);
        expect(center.codes.length).toBeGreaterThan(0);
      });
    });

    it('should not have duplicate codes across centers', () => {
      const allCodes = serviceCenters.flatMap(center => center.codes);
      const uniqueCodes = [...new Set(allCodes)];
      expect(allCodes.length).toBe(uniqueCodes.length);
    });
  });
});
