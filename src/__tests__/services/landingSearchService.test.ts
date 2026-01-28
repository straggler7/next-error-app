import { landingSearchService, SearchCriteria, ProgramSelection } from '@/services/landingSearchService';

// Mock sessionStorage
const mockSessionStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn().mockImplementation((key: string) => mockSessionStorage.store[key] || null),
  setItem: jest.fn().mockImplementation((key: string, value: string) => {
    mockSessionStorage.store[key] = value;
  }),
  removeItem: jest.fn().mockImplementation((key: string) => {
    delete mockSessionStorage.store[key];
  }),
  clear: jest.fn().mockImplementation(() => {
    mockSessionStorage.store = {};
  })
};

// Mock window and sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

describe('LandingSearchService', () => {
  beforeEach(() => {
    // Clear mock sessionStorage before each test
    mockSessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('searchRecords', () => {
    const mockSearchCriteria: SearchCriteria = {
      dln: '12345678901234567',
      nameControl: 'SMIT',
      tin: '123456789',
      taxpayerName: 'John Smith'
    };

    it('should successfully search records and store data in sessionStorage', async () => {
      const result = await landingSearchService.searchRecords(mockSearchCriteria);

      expect(result).toEqual({
        success: true,
        message: 'Search completed successfully',
        data: {
          criteria: mockSearchCriteria,
          recordsFound: true
        }
      });

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('searchData', JSON.stringify(mockSearchCriteria));
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('searchType', 'enhanced');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('landingSearchPerformed', 'true');
    });

    it('should handle empty search criteria', async () => {
      const result = await landingSearchService.searchRecords({});

      expect(result.success).toBe(true);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('searchData', JSON.stringify({}));
    });

    it('should simulate network delay', async () => {
      const startTime = Date.now();
      await landingSearchService.searchRecords(mockSearchCriteria);
      const endTime = Date.now();

      // Should take at least 500ms due to simulated delay
      expect(endTime - startTime).toBeGreaterThanOrEqual(500);
    });

    it('should handle errors gracefully', async () => {
      // Mock sessionStorage to throw an error
      const originalSetItem = mockSessionStorage.setItem;
      mockSessionStorage.setItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      const result = await landingSearchService.searchRecords(mockSearchCriteria);

      expect(result).toEqual({
        success: false,
        message: 'Failed to search records. Please try again.'
      });

      // Restore original setItem
      mockSessionStorage.setItem = originalSetItem;
    });
  });

  describe('selectProgramAndServiceCenter', () => {
    const mockProgramSelection: ProgramSelection = {
      program: '44720',
      statusCode: 'SC-1',
      serviceCenter: 'Andover'
    };

    it('should successfully select program and service center with both program and status code', async () => {
      const result = await landingSearchService.selectProgramAndServiceCenter(mockProgramSelection);

      expect(result).toEqual({
        success: true,
        message: 'Selection completed successfully',
        data: {
          selection: mockProgramSelection,
          workAssigned: true
        }
      });

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('selectedProgram', '44720');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('selectedStatusCode', 'SC-1');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('selectedServiceCenter', 'Andover');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('landingSelectionPerformed', 'true');
    });

    it('should handle program selection without status code', async () => {
      const selection: ProgramSelection = {
        program: '44720',
        serviceCenter: 'Andover'
      };

      const result = await landingSearchService.selectProgramAndServiceCenter(selection);

      expect(result.success).toBe(true);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('selectedProgram', '44720');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('searchType', 'program');
      expect(mockSessionStorage.setItem).not.toHaveBeenCalledWith('selectedStatusCode', expect.anything());
    });

    it('should handle status code selection without program', async () => {
      const selection: ProgramSelection = {
        statusCode: 'SC-1',
        serviceCenter: 'Andover'
      };

      const result = await landingSearchService.selectProgramAndServiceCenter(selection);

      expect(result.success).toBe(true);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('selectedStatusCode', 'SC-1');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('searchType', 'statusCode');
      expect(mockSessionStorage.setItem).not.toHaveBeenCalledWith('selectedProgram', expect.anything());
    });

    it('should simulate network delay', async () => {
      const startTime = Date.now();
      await landingSearchService.selectProgramAndServiceCenter(mockProgramSelection);
      const endTime = Date.now();

      // Should take at least 300ms due to simulated delay
      expect(endTime - startTime).toBeGreaterThanOrEqual(300);
    });

    it('should handle errors gracefully', async () => {
      // Mock sessionStorage to throw an error
      const originalSetItem = mockSessionStorage.setItem;
      mockSessionStorage.setItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      const result = await landingSearchService.selectProgramAndServiceCenter(mockProgramSelection);

      expect(result).toEqual({
        success: false,
        message: 'Failed to process selection. Please try again.'
      });

      // Restore original setItem
      mockSessionStorage.setItem = originalSetItem;
    });
  });

  describe('getStoredSearchData', () => {
    it('should retrieve stored search data', () => {
      const mockData = { dln: '12345678901234567', tin: '123456789' };
      mockSessionStorage.store['searchData'] = JSON.stringify(mockData);

      const result = landingSearchService.getStoredSearchData();

      expect(result).toEqual(mockData);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('searchData');
    });

    it('should return null when no search data is stored', () => {
      const result = landingSearchService.getStoredSearchData();

      expect(result).toBeNull();
    });

    it('should handle JSON parsing errors', () => {
      mockSessionStorage.store['searchData'] = 'invalid json';

      const result = landingSearchService.getStoredSearchData();

      expect(result).toBeNull();
    });
  });

  describe('getStoredSelectionData', () => {
    it('should retrieve complete stored selection data', () => {
      mockSessionStorage.store['selectedProgram'] = '44720';
      mockSessionStorage.store['selectedStatusCode'] = 'SC-1';
      mockSessionStorage.store['selectedServiceCenter'] = 'Andover';

      const result = landingSearchService.getStoredSelectionData();

      expect(result).toEqual({
        program: '44720',
        statusCode: 'SC-1',
        serviceCenter: 'Andover'
      });
    });

    it('should retrieve selection data with only program', () => {
      mockSessionStorage.store['selectedProgram'] = '44720';
      mockSessionStorage.store['selectedServiceCenter'] = 'Andover';

      const result = landingSearchService.getStoredSelectionData();

      expect(result).toEqual({
        program: '44720',
        statusCode: undefined,
        serviceCenter: 'Andover'
      });
    });

    it('should retrieve selection data with only status code', () => {
      mockSessionStorage.store['selectedStatusCode'] = 'SC-1';
      mockSessionStorage.store['selectedServiceCenter'] = 'Andover';

      const result = landingSearchService.getStoredSelectionData();

      expect(result).toEqual({
        program: undefined,
        statusCode: 'SC-1',
        serviceCenter: 'Andover'
      });
    });

    it('should return null when no service center is stored', () => {
      mockSessionStorage.store['selectedProgram'] = '44720';

      const result = landingSearchService.getStoredSelectionData();

      expect(result).toBeNull();
    });

    it('should return null when no selection data is stored', () => {
      const result = landingSearchService.getStoredSelectionData();

      expect(result).toBeNull();
    });
  });

  describe('getSearchType', () => {
    it('should retrieve stored search type', () => {
      mockSessionStorage.store['searchType'] = 'enhanced';

      const result = landingSearchService.getSearchType();

      expect(result).toBe('enhanced');
    });

    it('should return null when no search type is stored', () => {
      const result = landingSearchService.getSearchType();

      expect(result).toBeNull();
    });
  });

  describe('hasLandingSearchBeenPerformed', () => {
    it('should return true when landing search was performed', () => {
      mockSessionStorage.store['landingSearchPerformed'] = 'true';

      const result = landingSearchService.hasLandingSearchBeenPerformed();

      expect(result).toBe(true);
    });

    it('should return false when landing search was not performed', () => {
      const result = landingSearchService.hasLandingSearchBeenPerformed();

      expect(result).toBe(false);
    });

    it('should return false when landing search flag is not "true"', () => {
      mockSessionStorage.store['landingSearchPerformed'] = 'false';

      const result = landingSearchService.hasLandingSearchBeenPerformed();

      expect(result).toBe(false);
    });
  });

  describe('hasLandingSelectionBeenPerformed', () => {
    it('should return true when landing selection was performed', () => {
      mockSessionStorage.store['landingSelectionPerformed'] = 'true';

      const result = landingSearchService.hasLandingSelectionBeenPerformed();

      expect(result).toBe(true);
    });

    it('should return false when landing selection was not performed', () => {
      const result = landingSearchService.hasLandingSelectionBeenPerformed();

      expect(result).toBe(false);
    });
  });

  describe('clearStoredData', () => {
    it('should clear all stored landing data', () => {
      // Set up some stored data
      mockSessionStorage.store['searchData'] = 'test';
      mockSessionStorage.store['searchType'] = 'enhanced';
      mockSessionStorage.store['selectedProgram'] = '44720';
      mockSessionStorage.store['selectedStatusCode'] = 'SC-1';
      mockSessionStorage.store['selectedServiceCenter'] = 'Andover';
      mockSessionStorage.store['landingSearchPerformed'] = 'true';
      mockSessionStorage.store['landingSelectionPerformed'] = 'true';

      landingSearchService.clearStoredData();

      const expectedKeys = [
        'searchData',
        'searchType',
        'selectedProgram',
        'selectedStatusCode',
        'selectedServiceCenter',
        'landingSearchPerformed',
        'landingSelectionPerformed'
      ];

      expectedKeys.forEach(key => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(key);
      });
    });
  });

  describe('validation methods', () => {
    describe('validateDLN', () => {
      it('should validate correct DLN format', () => {
        expect(landingSearchService.validateDLN('12345678901234567')).toBe(true);
        expect(landingSearchService.validateDLN('98765432109876543')).toBe(true);
      });

      it('should reject incorrect DLN format', () => {
        expect(landingSearchService.validateDLN('123456789012345')).toBe(false); // Too short
        expect(landingSearchService.validateDLN('123456789012345678')).toBe(false); // Too long
        expect(landingSearchService.validateDLN('1234567890123456a')).toBe(false); // Contains letter
        expect(landingSearchService.validateDLN('')).toBe(false); // Empty
      });

      it('should handle DLN with non-numeric characters', () => {
        expect(landingSearchService.validateDLN('123-456-789-012-345-67')).toBe(true); // Strips dashes
        expect(landingSearchService.validateDLN('123 456 789 012 345 67')).toBe(true); // Strips spaces
      });
    });

    describe('validateTIN', () => {
      it('should validate correct TIN format', () => {
        expect(landingSearchService.validateTIN('123456789')).toBe(true);
        expect(landingSearchService.validateTIN('987654321')).toBe(true);
      });

      it('should reject incorrect TIN format', () => {
        expect(landingSearchService.validateTIN('12345678')).toBe(false); // Too short
        expect(landingSearchService.validateTIN('1234567890')).toBe(false); // Too long
        expect(landingSearchService.validateTIN('12345678a')).toBe(false); // Contains letter
        expect(landingSearchService.validateTIN('')).toBe(false); // Empty
      });

      it('should handle TIN with formatting characters', () => {
        expect(landingSearchService.validateTIN('123-45-6789')).toBe(true); // SSN format
        expect(landingSearchService.validateTIN('12-3456789')).toBe(true); // EIN format
      });
    });

    describe('validateNameControl', () => {
      it('should validate correct name control format', () => {
        expect(landingSearchService.validateNameControl('SMIT')).toBe(true);
        expect(landingSearchService.validateNameControl('DOE')).toBe(true);
        expect(landingSearchService.validateNameControl('A')).toBe(true);
        expect(landingSearchService.validateNameControl('')).toBe(true); // Empty is valid
      });

      it('should reject incorrect name control format', () => {
        expect(landingSearchService.validateNameControl('SMITH')).toBe(false); // Too long
        expect(landingSearchService.validateNameControl('smit')).toBe(false); // Lowercase
        expect(landingSearchService.validateNameControl('SM1T')).toBe(false); // Contains number
        expect(landingSearchService.validateNameControl('SM-T')).toBe(false); // Contains special char
      });
    });
  });

  describe('formatting methods', () => {
    describe('formatDLN', () => {
      it('should format DLN by removing non-digits', () => {
        expect(landingSearchService.formatDLN('123-456-789-012-345-67')).toBe('12345678901234567');
        expect(landingSearchService.formatDLN('123 456 789 012 345 67')).toBe('12345678901234567');
        expect(landingSearchService.formatDLN('123abc456def789')).toBe('123456789');
      });

      it('should limit DLN to 17 digits', () => {
        expect(landingSearchService.formatDLN('123456789012345678901')).toBe('12345678901234567');
      });

      it('should handle empty input', () => {
        expect(landingSearchService.formatDLN('')).toBe('');
      });
    });

    describe('formatTIN', () => {
      it('should format SSN with dashes', () => {
        expect(landingSearchService.formatTIN('123456789')).toBe('123-45-6789');
        expect(landingSearchService.formatTIN('12345')).toBe('123-45');
        expect(landingSearchService.formatTIN('123')).toBe('123');
      });

      it('should handle partial SSN input', () => {
        expect(landingSearchService.formatTIN('1234')).toBe('123-4');
        expect(landingSearchService.formatTIN('123456')).toBe('123-45-6');
      });

      it('should limit to 9 digits for SSN', () => {
        expect(landingSearchService.formatTIN('1234567890123')).toBe('123-45-6789');
      });

      it('should handle empty input', () => {
        expect(landingSearchService.formatTIN('')).toBe('');
      });

      it('should preserve existing formatting', () => {
        expect(landingSearchService.formatTIN('123-45-6789')).toBe('123-45-6789');
      });
    });

    describe('formatNameControl', () => {
      it('should convert to uppercase and limit to 4 characters', () => {
        expect(landingSearchService.formatNameControl('smith')).toBe('SMIT');
        expect(landingSearchService.formatNameControl('doe')).toBe('DOE');
        expect(landingSearchService.formatNameControl('a')).toBe('A');
      });

      it('should handle mixed case input', () => {
        expect(landingSearchService.formatNameControl('SmItH')).toBe('SMIT');
      });

      it('should handle empty input', () => {
        expect(landingSearchService.formatNameControl('')).toBe('');
      });

      it('should preserve uppercase input', () => {
        expect(landingSearchService.formatNameControl('SMIT')).toBe('SMIT');
      });
    });
  });

  describe('server-side rendering compatibility', () => {
    const originalWindow = global.window;

    beforeAll(() => {
      // @ts-ignore
      delete global.window;
    });

    afterAll(() => {
      global.window = originalWindow;
    });

    it('should handle missing window object gracefully', () => {
      expect(landingSearchService.getStoredSearchData()).toBeNull();
      expect(landingSearchService.getStoredSelectionData()).toBeNull();
      expect(landingSearchService.getSearchType()).toBeNull();
      expect(landingSearchService.hasLandingSearchBeenPerformed()).toBe(false);
      expect(landingSearchService.hasLandingSelectionBeenPerformed()).toBe(false);
      
      // Should not throw errors
      expect(() => landingSearchService.clearStoredData()).not.toThrow();
    });
  });
});
