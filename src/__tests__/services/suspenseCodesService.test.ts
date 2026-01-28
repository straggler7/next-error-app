import { SuspenseCodesService, SuspenseCode, SuspenseCodesResponse } from '@/services/suspenseCodesService';

describe('SuspenseCodesService', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;
  const mockSeid = '12345';

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const createMockResponse = (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  } as any);

  const mockSuspenseCodesResponse: SuspenseCodesResponse = {
    'SC-1': {
      code: 'SC-1',
      description: 'Pending Review',
      daysSuspended: 30
    },
    'SC-2': {
      code: 'SC-2',
      description: 'Additional Documentation Required',
      daysSuspended: 45
    },
    'SC-3': {
      code: 'SC-3',
      description: 'Awaiting Taxpayer Response',
      daysSuspended: 60
    },
    'SC-4': {
      code: 'SC-4',
      description: 'Technical Review',
      daysSuspended: 15
    },
    'SC-5': {
      code: 'SC-5',
      description: 'Supervisor Approval',
      daysSuspended: 7
    }
  };

  describe('getSuspenseCodes', () => {
    it('should successfully fetch suspense codes', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockSuspenseCodesResponse));

      const result = await SuspenseCodesService.getSuspenseCodes(mockSeid);

      expect(fetchMock).toHaveBeenCalledWith('/api/v1/era/inventories/suspenseCodes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'SEID': mockSeid,
        },
      });

      expect(result).toEqual(mockSuspenseCodesResponse);
    });

    it('should include SEID header in request', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockSuspenseCodesResponse));

      await SuspenseCodesService.getSuspenseCodes(mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'SEID': mockSeid,
          }),
        })
      );
    });

    it('should use GET method', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockSuspenseCodesResponse));

      await SuspenseCodesService.getSuspenseCodes(mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should include Content-Type header', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockSuspenseCodesResponse));

      await SuspenseCodesService.getSuspenseCodes(mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle empty response', async () => {
      const emptyResponse = {};
      fetchMock.mockResolvedValueOnce(createMockResponse(emptyResponse));

      const result = await SuspenseCodesService.getSuspenseCodes(mockSeid);

      expect(result).toEqual(emptyResponse);
    });

    it('should handle HTTP 400 error', async () => {
      const errorResponse = createMockResponse({ message: 'Bad Request' }, 400);
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(SuspenseCodesService.getSuspenseCodes(mockSeid)).rejects.toThrow('HTTP error! status: 400');
    });

    it('should handle HTTP 401 error', async () => {
      const errorResponse = createMockResponse({ message: 'Unauthorized' }, 401);
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(SuspenseCodesService.getSuspenseCodes(mockSeid)).rejects.toThrow('HTTP error! status: 401');
    });

    it('should handle HTTP 403 error', async () => {
      const errorResponse = createMockResponse({ message: 'Forbidden' }, 403);
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(SuspenseCodesService.getSuspenseCodes(mockSeid)).rejects.toThrow('HTTP error! status: 403');
    });

    it('should handle HTTP 404 error', async () => {
      const errorResponse = createMockResponse({ message: 'Not Found' }, 404);
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(SuspenseCodesService.getSuspenseCodes(mockSeid)).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle HTTP 500 error', async () => {
      const errorResponse = createMockResponse({ message: 'Internal Server Error' }, 500);
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(SuspenseCodesService.getSuspenseCodes(mockSeid)).rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(SuspenseCodesService.getSuspenseCodes(mockSeid)).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      const response = {
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: jest.fn().mockResolvedValue('Invalid response'),
      } as any;
      fetchMock.mockResolvedValueOnce(response);

      await expect(SuspenseCodesService.getSuspenseCodes(mockSeid)).rejects.toThrow('Invalid JSON');
    });

    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      try {
        await SuspenseCodesService.getSuspenseCodes(mockSeid);
      } catch (error) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching suspense codes:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should use correct API endpoint', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockSuspenseCodesResponse));

      await SuspenseCodesService.getSuspenseCodes(mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/era/inventories/suspenseCodes',
        expect.any(Object)
      );
    });

    it('should handle different SEID values', async () => {
      const differentSeid = 'ABCDE';
      fetchMock.mockResolvedValueOnce(createMockResponse(mockSuspenseCodesResponse));

      await SuspenseCodesService.getSuspenseCodes(differentSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'SEID': differentSeid,
          }),
        })
      );
    });
  });

  describe('getSuspenseCodesArray', () => {
    it('should return array of suspense code keys', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockSuspenseCodesResponse));

      const result = await SuspenseCodesService.getSuspenseCodesArray(mockSeid);

      expect(result).toEqual(['SC-1', 'SC-2', 'SC-3', 'SC-4', 'SC-5']);
    });

    it('should handle empty response', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({}));

      const result = await SuspenseCodesService.getSuspenseCodesArray(mockSeid);

      expect(result).toEqual([]);
    });

    it('should call getSuspenseCodes internally', async () => {
      const getSuspenseCodesSpy = jest.spyOn(SuspenseCodesService, 'getSuspenseCodes');
      fetchMock.mockResolvedValueOnce(createMockResponse(mockSuspenseCodesResponse));

      await SuspenseCodesService.getSuspenseCodesArray(mockSeid);

      expect(getSuspenseCodesSpy).toHaveBeenCalledWith(mockSeid);
      getSuspenseCodesSpy.mockRestore();
    });

    it('should propagate errors from getSuspenseCodes', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(SuspenseCodesService.getSuspenseCodesArray(mockSeid)).rejects.toThrow('Network error');
    });

    it('should return codes in consistent order', async () => {
      const unorderedResponse = {
        'SC-3': { code: 'SC-3', description: 'Test 3', daysSuspended: 30 },
        'SC-1': { code: 'SC-1', description: 'Test 1', daysSuspended: 15 },
        'SC-2': { code: 'SC-2', description: 'Test 2', daysSuspended: 45 }
      };
      fetchMock.mockResolvedValueOnce(createMockResponse(unorderedResponse));

      const result = await SuspenseCodesService.getSuspenseCodesArray(mockSeid);

      // Object.keys() returns keys in insertion order for string keys
      expect(result).toEqual(['SC-3', 'SC-1', 'SC-2']);
    });
  });

  describe('getSuspenseCodesWithDetails', () => {
    it('should return array of suspense code objects', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockSuspenseCodesResponse));

      const result = await SuspenseCodesService.getSuspenseCodesWithDetails(mockSeid);

      expect(result).toEqual([
        { code: 'SC-1', description: 'Pending Review', daysSuspended: 30 },
        { code: 'SC-2', description: 'Additional Documentation Required', daysSuspended: 45 },
        { code: 'SC-3', description: 'Awaiting Taxpayer Response', daysSuspended: 60 },
        { code: 'SC-4', description: 'Technical Review', daysSuspended: 15 },
        { code: 'SC-5', description: 'Supervisor Approval', daysSuspended: 7 }
      ]);
    });

    it('should handle empty response', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({}));

      const result = await SuspenseCodesService.getSuspenseCodesWithDetails(mockSeid);

      expect(result).toEqual([]);
    });

    it('should call getSuspenseCodes internally', async () => {
      const getSuspenseCodesSpy = jest.spyOn(SuspenseCodesService, 'getSuspenseCodes');
      fetchMock.mockResolvedValueOnce(createMockResponse(mockSuspenseCodesResponse));

      await SuspenseCodesService.getSuspenseCodesWithDetails(mockSeid);

      expect(getSuspenseCodesSpy).toHaveBeenCalledWith(mockSeid);
      getSuspenseCodesSpy.mockRestore();
    });

    it('should propagate errors from getSuspenseCodes', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(SuspenseCodesService.getSuspenseCodesWithDetails(mockSeid)).rejects.toThrow('Network error');
    });

    it('should return complete SuspenseCode objects', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockSuspenseCodesResponse));

      const result = await SuspenseCodesService.getSuspenseCodesWithDetails(mockSeid);

      result.forEach((suspenseCode: SuspenseCode) => {
        expect(suspenseCode).toHaveProperty('code');
        expect(suspenseCode).toHaveProperty('description');
        expect(suspenseCode).toHaveProperty('daysSuspended');
        expect(typeof suspenseCode.code).toBe('string');
        expect(typeof suspenseCode.description).toBe('string');
        expect(typeof suspenseCode.daysSuspended).toBe('number');
      });
    });

    it('should handle single suspense code', async () => {
      const singleCodeResponse = {
        'SC-1': { code: 'SC-1', description: 'Single Code', daysSuspended: 30 }
      };
      fetchMock.mockResolvedValueOnce(createMockResponse(singleCodeResponse));

      const result = await SuspenseCodesService.getSuspenseCodesWithDetails(mockSeid);

      expect(result).toEqual([
        { code: 'SC-1', description: 'Single Code', daysSuspended: 30 }
      ]);
    });

    it('should preserve all properties of suspense code objects', async () => {
      const responseWithExtraProps = {
        'SC-1': {
          code: 'SC-1',
          description: 'Test Code',
          daysSuspended: 30,
          extraProperty: 'should be preserved'
        }
      };
      fetchMock.mockResolvedValueOnce(createMockResponse(responseWithExtraProps));

      const result = await SuspenseCodesService.getSuspenseCodesWithDetails(mockSeid);

      expect(result[0]).toEqual({
        code: 'SC-1',
        description: 'Test Code',
        daysSuspended: 30,
        extraProperty: 'should be preserved'
      });
    });
  });

  describe('error handling consistency', () => {
    it('should handle the same error consistently across all methods', async () => {
      const networkError = new Error('Network timeout');
      
      // Test getSuspenseCodes
      fetchMock.mockRejectedValueOnce(networkError);
      await expect(SuspenseCodesService.getSuspenseCodes(mockSeid)).rejects.toThrow('Network timeout');

      // Test getSuspenseCodesArray
      fetchMock.mockRejectedValueOnce(networkError);
      await expect(SuspenseCodesService.getSuspenseCodesArray(mockSeid)).rejects.toThrow('Network timeout');

      // Test getSuspenseCodesWithDetails
      fetchMock.mockRejectedValueOnce(networkError);
      await expect(SuspenseCodesService.getSuspenseCodesWithDetails(mockSeid)).rejects.toThrow('Network timeout');
    });

    it('should handle HTTP errors consistently across all methods', async () => {
      const httpError = createMockResponse({ message: 'Unauthorized' }, 401);
      
      // Test getSuspenseCodes
      fetchMock.mockResolvedValueOnce(httpError);
      await expect(SuspenseCodesService.getSuspenseCodes(mockSeid)).rejects.toThrow('HTTP error! status: 401');

      // Test getSuspenseCodesArray
      fetchMock.mockResolvedValueOnce(httpError);
      await expect(SuspenseCodesService.getSuspenseCodesArray(mockSeid)).rejects.toThrow('HTTP error! status: 401');

      // Test getSuspenseCodesWithDetails
      fetchMock.mockResolvedValueOnce(httpError);
      await expect(SuspenseCodesService.getSuspenseCodesWithDetails(mockSeid)).rejects.toThrow('HTTP error! status: 401');
    });
  });
});
