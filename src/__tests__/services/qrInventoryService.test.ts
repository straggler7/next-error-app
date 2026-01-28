import { QRInventoryService, QRInventoryFilters, QRInventoryRecord, QRInventoryResponse } from '@/services/qrInventoryService';

describe('QRInventoryService', () => {
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

  const mockQRRecord: QRInventoryRecord = {
    inventoryId: 1,
    processId: 123,
    createdTime: '2026-01-20T10:30:00',
    taxPeriod: '202312',
    statusEventId: 1,
    status: 'QR_HOLD',
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
    serviceCenter: 'Andover',
    returnType: '1040',
    errors: ['111 - Tax Period/Transaction Date', '004 - EIF/NAP Mismatch'],
    assignedTo: 'John Doe',
    qrStatus: 'pending'
  };

  describe('getQRRecords', () => {
    it('should successfully fetch QR records with all filters', async () => {
      const mockResponse = [mockQRRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const filters: QRInventoryFilters = {
        searchAll: 'SMITH',
        assignedTo: 'John Doe',
        qrStatus: 'pending',
        serviceCenter: 'Andover',
        seid: '12345',
        program: '44720',
        statusCode: 'SC-1'
      };

      const result = await QRInventoryService.getQRRecords(filters, 1, 15, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith('/api/v1/era/inventories/inventory-search/quality-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': mockSeid,
        },
        body: JSON.stringify({
          pageNumber: 1,
          pageSize: 15,
          seid: '12345',
          programCode: '44720',
          statuses: ['QR_HOLD', 'SUSPEND_HOLD']
        }),
      });

      expect(result).toEqual({
        records: mockResponse,
        totalCount: 1,
        currentPage: 1,
        pageSize: 15
      });
    });

    it('should handle empty filters', async () => {
      const mockResponse = [mockQRRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await QRInventoryService.getQRRecords({}, 1, 15, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith('/api/v1/era/inventories/inventory-search/quality-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': mockSeid,
        },
        body: JSON.stringify({
          pageNumber: 1,
          pageSize: 15,
          statuses: ['QR_HOLD', 'SUSPEND_HOLD']
        }),
      });

      expect(result).toEqual({
        records: mockResponse,
        totalCount: 1,
        currentPage: 1,
        pageSize: 15
      });
    });

    it('should handle pagination correctly', async () => {
      const mockResponse = [mockQRRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await QRInventoryService.getQRRecords({}, 3, 20, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            pageNumber: 3,
            pageSize: 20,
            statuses: ['QR_HOLD', 'SUSPEND_HOLD']
          }),
        })
      );

      expect(result).toEqual({
        records: mockResponse,
        totalCount: 1,
        currentPage: 3,
        pageSize: 20
      });
    });

    it('should include only provided filters in request body', async () => {
      const mockResponse = [mockQRRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const filters: QRInventoryFilters = {
        seid: '12345',
        program: '44720'
        // Other filters not provided
      };

      await QRInventoryService.getQRRecords(filters, 1, 15, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            pageNumber: 1,
            pageSize: 15,
            seid: '12345',
            programCode: '44720',
            statuses: ['QR_HOLD', 'SUSPEND_HOLD']
          }),
        })
      );
    });

    it('should handle empty response data', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse([]));

      const result = await QRInventoryService.getQRRecords({}, 1, 15, mockSeid);

      expect(result).toEqual({
        records: [],
        totalCount: 0,
        currentPage: 1,
        pageSize: 15
      });
    });

    it('should handle null response data', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(null));

      const result = await QRInventoryService.getQRRecords({}, 1, 15, mockSeid);

      expect(result).toEqual({
        records: [],
        totalCount: 0,
        currentPage: 1,
        pageSize: 15
      });
    });

    it('should handle API errors with JSON error message', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue(JSON.stringify({ message: 'Invalid request parameters' })),
      } as any;
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(QRInventoryService.getQRRecords({}, 1, 15, mockSeid)).rejects.toThrow('Invalid request parameters');
    });

    it('should handle API errors with malformed JSON', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Invalid JSON response'),
      } as any;
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(QRInventoryService.getQRRecords({}, 1, 15, mockSeid)).rejects.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await QRInventoryService.getQRRecords({}, 1, 15, mockSeid);

      expect(result).toBeUndefined();
    });

    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await QRInventoryService.getQRRecords({}, 1, 15, mockSeid);

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching QR records:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should include SEID header in all requests', async () => {
      const mockResponse = [mockQRRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      await QRInventoryService.getQRRecords({}, 1, 15, mockSeid);

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
      const mockResponse = [mockQRRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      await QRInventoryService.getQRRecords({}, 1, 15, undefined);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'SEID': 'undefined',
          }),
        })
      );
    });

    it('should always include QR_HOLD and SUSPEND_HOLD statuses', async () => {
      const mockResponse = [mockQRRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      await QRInventoryService.getQRRecords({}, 1, 15, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"statuses":["QR_HOLD","SUSPEND_HOLD"]'),
        })
      );
    });

    it('should handle searchAll filter', async () => {
      const mockResponse = [mockQRRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const filters: QRInventoryFilters = {
        searchAll: 'SMITH JOHN'
      };

      await QRInventoryService.getQRRecords(filters, 1, 15, mockSeid);

      // Note: searchAll is not currently included in the request body based on the implementation
      // This test verifies the current behavior
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            pageNumber: 1,
            pageSize: 15,
            statuses: ['QR_HOLD', 'SUSPEND_HOLD']
          }),
        })
      );
    });

    it('should handle multiple records in response', async () => {
      const mockRecord2 = { ...mockQRRecord, inventoryId: 2, dln: '98765432109876543210' };
      const mockResponse = [mockQRRecord, mockRecord2];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await QRInventoryService.getQRRecords({}, 1, 15, mockSeid);

      expect(result).toEqual({
        records: mockResponse,
        totalCount: 2,
        currentPage: 1,
        pageSize: 15
      });
    });

    it('should handle JSON parsing errors in successful responses', async () => {
      const response = {
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: jest.fn().mockResolvedValue('Invalid response'),
      } as any;
      fetchMock.mockResolvedValueOnce(response);

      const result = await QRInventoryService.getQRRecords({}, 1, 15, mockSeid);

      expect(result).toBeUndefined();
    });

    it('should use correct API endpoint', async () => {
      const mockResponse = [mockQRRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      await QRInventoryService.getQRRecords({}, 1, 15, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/era/inventories/inventory-search/quality-review',
        expect.any(Object)
      );
    });

    it('should use POST method', async () => {
      const mockResponse = [mockQRRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      await QRInventoryService.getQRRecords({}, 1, 15, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should include Content-Type header', async () => {
      const mockResponse = [mockQRRecord];
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      await QRInventoryService.getQRRecords({}, 1, 15, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('error handling edge cases', () => {
    it('should handle 500 server errors', async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue(JSON.stringify({ message: 'Internal Server Error' })),
      } as any;
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(QRInventoryService.getQRRecords({}, 1, 15, mockSeid)).rejects.toThrow('Internal Server Error');
    });

    it('should handle 404 not found errors', async () => {
      const errorResponse = {
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue(JSON.stringify({ message: 'Endpoint not found' })),
      } as any;
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(QRInventoryService.getQRRecords({}, 1, 15, mockSeid)).rejects.toThrow('Endpoint not found');
    });

    it('should handle timeout errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Request timeout'));

      const result = await QRInventoryService.getQRRecords({}, 1, 15, mockSeid);

      expect(result).toBeUndefined();
    });
  });
});
