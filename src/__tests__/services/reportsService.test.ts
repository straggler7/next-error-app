import { ReportsService, ReportPayload } from '@/services/reportsService';

describe('ReportsService', () => {
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

  describe('get1340Report', () => {
    const mockPayload: ReportPayload = {
      pageNumber: 1,
      pageSize: 100,
      reportId: '1340',
      startDateStr: '01/01/2026',
      endDateStr: '01/31/2026',
      serviceCenter: 'Andover',
      programCode: '44720',
    };

    const mockReportData = [
      {
        inventoryId: 1,
        processId: 123,
        dln: '12345678901234567890',
        submissionTins: '123456789',
        submissionNames: 'SMITH JOHN',
        taxPeriod: '202312',
        formType: '1040',
        serviceCenterId: 16,
        status: 'NEW',
        createdTime: '2026-01-20T10:30:00',
        updatedDate: '2026-01-20T10:30:00',
        submissionErrorCodes: '111,004',
        daysAged: 5,
        controlDay: '001',
        statusEventId: 1,
        payloadId: 1,
        seid: '12345',
        ageFromDate: '2026-01-15T00:00:00',
        suspendedExpirationDate: null,
        suspendedStatusCode: null,
        clearCodes: null,
      },
    ];

    it('should successfully fetch 1340 report data', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockReportData));

      const result = await ReportsService.get1340Report(mockSeid, mockPayload);

      expect(fetchMock).toHaveBeenCalledWith('/api2/v1/era/reports/get-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': mockSeid,
        },
        body: JSON.stringify({
          ...mockPayload,
          status: 'NEW',
        }),
      });
      expect(result).toEqual(mockReportData);
    });

    it('should handle API errors gracefully', async () => {
      const errorResponse = createMockResponse({ message: 'Internal Server Error' }, 500);
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(ReportsService.get1340Report(mockSeid, mockPayload)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(ReportsService.get1340Report(mockSeid, mockPayload)).rejects.toThrow('Network error');
    });
  });

  describe('error handling', () => {
    it('should handle 204 No Content response', async () => {
      const noContentResponse = createMockResponse(null, 204);
      fetchMock.mockResolvedValueOnce(noContentResponse);

      const mockPayload: ReportPayload = {
        pageNumber: 1,
        pageSize: 100,
        reportId: '1340',
        startDateStr: '01/01/2026',
      };

      const result = await ReportsService.get1340Report(mockSeid, mockPayload);
      expect(result).toEqual([]);
    });

    it('should handle JSON parsing errors', async () => {
      const errorResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: jest.fn().mockResolvedValue('Invalid response'),
      } as any;
      
      fetchMock.mockResolvedValueOnce(errorResponse);

      const mockPayload: ReportPayload = {
        pageNumber: 1,
        pageSize: 100,
        reportId: '1340',
        startDateStr: '01/01/2026',
      };
      
      await expect(ReportsService.get1340Report(mockSeid, mockPayload)).rejects.toThrow('Invalid JSON');
    });

    it('should handle 500 server errors', async () => {
      const errorResponse = createMockResponse({ message: 'Server Error' }, 500);
      fetchMock.mockResolvedValueOnce(errorResponse);

      const mockPayload: ReportPayload = {
        pageNumber: 1,
        pageSize: 100,
        reportId: '1340',
        startDateStr: '01/01/2026',
      };
      
      await expect(ReportsService.get1340Report(mockSeid, mockPayload)).rejects.toThrow();
    });
  });

  describe('payload validation', () => {
    it('should include SEID header in all requests', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse([]));

      const mockPayload: ReportPayload = {
        pageNumber: 1,
        pageSize: 100,
        reportId: '1340',
        startDateStr: '01/01/2026',
      };

      await ReportsService.get1340Report(mockSeid, mockPayload);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'SEID': mockSeid,
          }),
        })
      );
    });

    it('should always include status NEW for 1340 reports', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse([]));

      const mockPayload: ReportPayload = {
        pageNumber: 1,
        pageSize: 100,
        reportId: '1340',
        startDateStr: '01/01/2026',
      };

      await ReportsService.get1340Report(mockSeid, mockPayload);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"status":"NEW"'),
        })
      );
    });
  });
});
