import { DLNSearchService, DLNSearchFilters, DLNSearchRecord, DLNSearchResponse } from '@/services/dlnSearchService';

describe('DLNSearchService', () => {
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

  const mockDLNRecord: DLNSearchRecord = {
    inventoryId: 1,
    processId: 123,
    createdTime: '2026-01-20T10:30:00',
    taxPeriod: '202312',
    statusEventId: 1,
    status: 'NEW',
    updatedDate: '2026-01-20T10:30:00',
    payloadId: 1,
    seid: '12345',
    submissionTins: '123456789',
    submissionErrorCodes: '111,004',
    submissionNames: 'SMITH JOHN',
    ageFromDate: '2026-01-15T00:00:00',
    daysAged: 5,
    suspendedExpirationDate: null,
    suspendedStatusCode: null,
    clearCodes: null,
    dln: '12345678901234567890',
    formType: '1040',
    controlDay: '001',
    serviceCenterId: 16,
  };

  describe('searchByDLN', () => {
    it('should successfully search by DLN with all filters', async () => {
      const mockResponse = [mockDLNRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const filters: DLNSearchFilters = {
        dln: '12345678901234567890',
        tin: '123456789',
        nameControl: 'SMITH',
        programCode: '44720',
        serviceCenter: 'Andover'
      };

      const result = await DLNSearchService.searchByDLN(filters, 1, 15, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith('/api/v1/era/inventories/inventory-search/dlnSearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': mockSeid,
        },
        body: JSON.stringify({
          pageNumber: '1',
          pageSize: '15',
          dln: '12345678901234567890',
          tin: '123456789',
          nameControl: 'SMITH',
          programCode: '44720',
          serviceCenter: 'Andover'
        }),
      });

      expect(result).toEqual({
        records: mockResponse,
        totalCount: 1,
        currentPage: 1,
        pageSize: 15,
        totalPages: 1
      });
    });

    it('should handle empty filters', async () => {
      const mockResponse = [mockDLNRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await DLNSearchService.searchByDLN({}, 1, 15, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith('/api/v1/era/inventories/inventory-search/dlnSearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': mockSeid,
        },
        body: JSON.stringify({
          pageNumber: '1',
          pageSize: '15'
        }),
      });

      expect(result).toEqual({
        records: mockResponse,
        totalCount: 1,
        currentPage: 1,
        pageSize: 15,
        totalPages: 1
      });
    });

    it('should handle 204 No Content response', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(null, 204));

      const result = await DLNSearchService.searchByDLN({}, 1, 15, mockSeid);

      expect(result).toEqual({
        records: [],
        totalCount: 0,
        currentPage: 1,
        pageSize: 15,
        totalPages: 0
      });
    });

    it('should handle object response with records property', async () => {
      const mockResponse = {
        records: [mockDLNRecord],
        totalCount: 25
      };
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await DLNSearchService.searchByDLN({}, 1, 15, mockSeid);

      expect(result).toEqual({
        records: [mockDLNRecord],
        totalCount: 25,
        currentPage: 1,
        pageSize: 15,
        totalPages: 2
      });
    });

    it('should handle pagination correctly', async () => {
      const mockResponse = {
        records: [mockDLNRecord],
        totalCount: 100
      };
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await DLNSearchService.searchByDLN({}, 3, 20, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            pageNumber: '3',
            pageSize: '20'
          }),
        })
      );

      expect(result).toEqual({
        records: [mockDLNRecord],
        totalCount: 100,
        currentPage: 3,
        pageSize: 20,
        totalPages: 5
      });
    });

    it('should handle API errors with JSON error message', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue(JSON.stringify({ message: 'Invalid DLN format' })),
      } as any;
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(DLNSearchService.searchByDLN({}, 1, 15, mockSeid)).rejects.toThrow('Invalid DLN format');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(DLNSearchService.searchByDLN({}, 1, 15, mockSeid)).rejects.toThrow('Network error');
    });

    it('should only include filters with values in payload', async () => {
      const mockResponse = [mockDLNRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const filters: DLNSearchFilters = {
        dln: '12345678901234567890',
        tin: '', // Empty string should not be included
        nameControl: 'SMITH',
        programCode: undefined, // Undefined should not be included
        serviceCenter: 'Andover'
      };

      await DLNSearchService.searchByDLN(filters, 1, 15, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            pageNumber: '1',
            pageSize: '15',
            dln: '12345678901234567890',
            nameControl: 'SMITH',
            serviceCenter: 'Andover'
            // tin and programCode should not be present
          }),
        })
      );
    });
  });

  describe('searchRecords', () => {
    it('should successfully search records with all criteria', async () => {
      const mockResponse = [mockDLNRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const searchCriteria = {
        dln: '12345678901234567890',
        tin: '123456789',
        nameControl: 'SMITH'
      };

      const result = await DLNSearchService.searchRecords(searchCriteria, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith('/api/v1/era/inventories/inventory-search/dlnSearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': mockSeid,
        },
        body: JSON.stringify({
          pageNumber: 1,
          pageSize: 15,
          dln: '12345678901234567890',
          tin: '123456789',
          nameControl: 'SMITH'
        }),
      });

      expect(result).toEqual({
        success: true,
        records: mockResponse
      });
    });

    it('should handle empty search criteria', async () => {
      const mockResponse = [mockDLNRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await DLNSearchService.searchRecords({}, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith('/api/v1/era/inventories/inventory-search/dlnSearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': mockSeid,
        },
        body: JSON.stringify({
          pageNumber: 1,
          pageSize: 15
        }),
      });

      expect(result).toEqual({
        success: true,
        records: mockResponse
      });
    });

    it('should handle object response with records property', async () => {
      const mockResponse = {
        records: [mockDLNRecord],
        totalCount: 1
      };
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await DLNSearchService.searchRecords({}, mockSeid);

      expect(result).toEqual({
        success: true,
        records: [mockDLNRecord]
      });
    });

    it('should handle API errors with JSON error message', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue(JSON.stringify({ message: 'Invalid search criteria' })),
      } as any;
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(DLNSearchService.searchRecords({}, mockSeid)).rejects.toThrow('Invalid search criteria');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(DLNSearchService.searchRecords({}, mockSeid)).rejects.toThrow('Network error');
    });

    it('should only include criteria with values in payload', async () => {
      const mockResponse = [mockDLNRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const searchCriteria = {
        dln: '12345678901234567890',
        tin: '', // Empty string should not be included
        nameControl: undefined // Undefined should not be included
      };

      await DLNSearchService.searchRecords(searchCriteria, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            pageNumber: 1,
            pageSize: 15,
            dln: '12345678901234567890'
            // tin and nameControl should not be present
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle JSON parsing errors in error responses', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Invalid JSON response'),
      } as any;
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(DLNSearchService.searchByDLN({}, 1, 15, mockSeid)).rejects.toThrow();
    });

    it('should include SEID header in all requests', async () => {
      const mockResponse = [mockDLNRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      await DLNSearchService.searchByDLN({}, 1, 15, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'SEID': mockSeid,
          }),
        })
      );
    });

    it('should handle undefined SEID', async () => {
      const mockResponse = [mockDLNRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      await DLNSearchService.searchByDLN({}, 1, 15, undefined);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'SEID': 'undefined',
          }),
        })
      );
    });
  });
});
