import { QRDetailsService, QRDetailsData } from '@/services/qrDetailsService';

describe('QRDetailsService', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;
  const mockSeid = '12345';
  const mockInventoryId = '123';
  const mockDln = '00217-102-05701-123';
  const mockServiceCenter = 'Austin';

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

  const mockQRDetailsData: QRDetailsData = {
    NEW: {
      workRecord: {
        primaryNameControlTxt: "JOHN",
        nameLine1Txt: "Johnson, Michael R",
        primarySSN: "",
        TaxPeriodEndDt: "2025-12-31",
        transDt: "2025-01-15",
        napEifTaxPrdUndrprt: "N",
        napAccessInd: "Y",
        masterFileSystemIdCode: "MF01",
        transCd: "405",
        secondaryTransCd: "405",
        tertiaryTransCd: "409"
      }
    },
    QR_HOLD: {
      workRecord: {
        primaryNameControlTxt: "JOHN",
        nameLine1Txt: "Johnson, Michael R",
        primarySSN: "123-45-6789",
        TaxPeriodEndDt: "2025-12-31",
        transDt: "2025-01-16",
        napEifTaxPrdUndrprt: "Y",
        napAccessInd: "Y",
        masterFileSystemIdCode: "MF01",
        transCd: "405",
        secondaryTransCd: "405",
        tertiaryTransCd: "409"
      }
    },
    metadata: {
      dln: mockDln,
      serviceCenter: mockServiceCenter,
      taxPeriod: "2025",
      submissionAge: 2,
      lastModifiedBy: "1ABCD (Sarah Thompson)",
      lastModifiedDate: "2025-01-03 14:30:15",
      errors: ["01ED - Extended Due Date", "01TIN - Missing TIN"]
    }
  };

  describe('getQRDetails', () => {
    it('should successfully fetch QR details with all parameters', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockQRDetailsData));

      const result = await QRDetailsService.getQRDetails(mockInventoryId, mockDln, mockServiceCenter, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(`/api/v1/era/qualityreview/${mockInventoryId}/review`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'seid': mockSeid,
        },
      });

      expect(result).toEqual(mockQRDetailsData);
    });

    it('should successfully fetch QR details with only required parameters', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockQRDetailsData));

      const result = await QRDetailsService.getQRDetails(mockInventoryId);

      expect(fetchMock).toHaveBeenCalledWith(`/api/v1/era/qualityreview/${mockInventoryId}/review`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockQRDetailsData);
    });

    it('should include seid header when provided', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockQRDetailsData));

      await QRDetailsService.getQRDetails(mockInventoryId, undefined, undefined, mockSeid);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'seid': mockSeid,
          }),
        })
      );
    });

    it('should not include seid header when not provided', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockQRDetailsData));

      await QRDetailsService.getQRDetails(mockInventoryId);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle 422 error with JSON error message', async () => {
      const errorMessage = 'User already has assignment';
      const errorResponse = {
        ok: false,
        status: 422,
        text: jest.fn().mockResolvedValue(JSON.stringify({ message: errorMessage })),
      } as any;
      fetchMock.mockResolvedValueOnce(errorResponse);

      try {
        await QRDetailsService.getQRDetails(mockInventoryId, mockDln, mockServiceCenter, mockSeid);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toBe(errorMessage);
        expect(error.status).toBe(422);
      }
    });

    it('should handle 422 error with plain text error message', async () => {
      const errorMessage = 'Unprocessable Entity';
      const errorResponse = {
        ok: false,
        status: 422,
        text: jest.fn().mockResolvedValue(errorMessage),
      } as any;
      fetchMock.mockResolvedValueOnce(errorResponse);

      try {
        await QRDetailsService.getQRDetails(mockInventoryId, mockDln, mockServiceCenter, mockSeid);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toBe(errorMessage);
        expect(error.status).toBe(422);
      }
    });

    it('should handle 422 error with invalid JSON', async () => {
      const errorResponse = {
        ok: false,
        status: 422,
        text: jest.fn().mockResolvedValue('Invalid JSON response'),
      } as any;
      fetchMock.mockResolvedValueOnce(errorResponse);

      try {
        await QRDetailsService.getQRDetails(mockInventoryId, mockDln, mockServiceCenter, mockSeid);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toBe('Invalid JSON response');
        expect(error.status).toBe(422);
      }
    });

    it('should handle other HTTP errors', async () => {
      const errorResponse = createMockResponse({ message: 'Server Error' }, 500);
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(QRDetailsService.getQRDetails(mockInventoryId, mockDln, mockServiceCenter, mockSeid))
        .rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(QRDetailsService.getQRDetails(mockInventoryId, mockDln, mockServiceCenter, mockSeid))
        .rejects.toThrow('Failed to fetch QR details');
    });

    it('should re-throw 422 errors with original message', async () => {
      const originalError = new Error('User already has assignment');
      (originalError as any).status = 422;
      
      fetchMock.mockRejectedValueOnce(originalError);

      try {
        await QRDetailsService.getQRDetails(mockInventoryId, mockDln, mockServiceCenter, mockSeid);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toBe('User already has assignment');
        expect(error.status).toBe(422);
      }
    });

    it('should handle JSON parsing errors', async () => {
      const response = {
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: jest.fn().mockResolvedValue('Invalid response'),
      } as any;
      fetchMock.mockResolvedValueOnce(response);

      await expect(QRDetailsService.getQRDetails(mockInventoryId, mockDln, mockServiceCenter, mockSeid))
        .rejects.toThrow('Failed to fetch QR details');
    });

    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      try {
        await QRDetailsService.getQRDetails(mockInventoryId, mockDln, mockServiceCenter, mockSeid);
      } catch (error) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching QR details:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getMockQRDetails', () => {
    it('should return mock data with all parameters', () => {
      const result = QRDetailsService.getMockQRDetails(mockInventoryId, mockDln, mockServiceCenter, mockSeid);

      expect(result).toEqual({
        NEW: {
          workRecord: {
            primaryNameControlTxt: "JOHN",
            nameLine1Txt: "Johnson, Michael R",
            primarySSN: "",
            TaxPeriodEndDt: "2025-12-31",
            transDt: "2025-01-15",
            napEifTaxPrdUndrprt: "N",
            napAccessInd: "Y",
            masterFileSystemIdCode: "MF01",
            transCd: "405",
            secondaryTransCd: "405",
            tertiaryTransCd: "409"
          }
        },
        QR_HOLD: {
          workRecord: {
            primaryNameControlTxt: "JOHN",
            nameLine1Txt: "Johnson, Michael R",
            primarySSN: "123-45-6789",
            TaxPeriodEndDt: "2025-12-31",
            transDt: "2025-01-16",
            napEifTaxPrdUndrprt: "Y",
            napAccessInd: "Y",
            masterFileSystemIdCode: "MF01",
            transCd: "405",
            secondaryTransCd: "405",
            tertiaryTransCd: "409"
          }
        },
        metadata: {
          dln: mockDln,
          serviceCenter: mockServiceCenter,
          taxPeriod: "2025",
          submissionAge: 2,
          lastModifiedBy: `${mockSeid} (Sarah Thompson)`,
          lastModifiedDate: "2025-01-03 14:30:15",
          errors: ["01ED - Extended Due Date", "01TIN - Missing TIN"]
        }
      });
    });

    it('should return mock data with default values when parameters are not provided', () => {
      const result = QRDetailsService.getMockQRDetails(mockInventoryId);

      expect(result.metadata.dln).toBe(`00217-102-05701-${mockInventoryId}`);
      expect(result.metadata.serviceCenter).toBe("Austin");
      expect(result.metadata.lastModifiedBy).toBe("1ABCD (Sarah Thompson)");
    });

    it('should use provided DLN when specified', () => {
      const customDln = '00217-102-05701-999';
      const result = QRDetailsService.getMockQRDetails(mockInventoryId, customDln);

      expect(result.metadata.dln).toBe(customDln);
    });

    it('should use provided service center when specified', () => {
      const customServiceCenter = 'Andover';
      const result = QRDetailsService.getMockQRDetails(mockInventoryId, undefined, customServiceCenter);

      expect(result.metadata.serviceCenter).toBe(customServiceCenter);
    });

    it('should use provided SEID in lastModifiedBy when specified', () => {
      const customSeid = 'ABCDE';
      const result = QRDetailsService.getMockQRDetails(mockInventoryId, undefined, undefined, customSeid);

      expect(result.metadata.lastModifiedBy).toBe(`${customSeid} (Sarah Thompson)`);
    });

    it('should have consistent structure between NEW and QR_HOLD', () => {
      const result = QRDetailsService.getMockQRDetails(mockInventoryId);

      expect(result.NEW.workRecord).toHaveProperty('primaryNameControlTxt');
      expect(result.NEW.workRecord).toHaveProperty('nameLine1Txt');
      expect(result.NEW.workRecord).toHaveProperty('TaxPeriodEndDt');
      expect(result.NEW.workRecord).toHaveProperty('transDt');

      expect(result.QR_HOLD.workRecord).toHaveProperty('primaryNameControlTxt');
      expect(result.QR_HOLD.workRecord).toHaveProperty('nameLine1Txt');
      expect(result.QR_HOLD.workRecord).toHaveProperty('TaxPeriodEndDt');
      expect(result.QR_HOLD.workRecord).toHaveProperty('transDt');
    });

    it('should have different values between NEW and QR_HOLD records', () => {
      const result = QRDetailsService.getMockQRDetails(mockInventoryId);

      // NEW record should have empty SSN
      expect(result.NEW.workRecord.primarySSN).toBe("");
      // QR_HOLD record should have populated SSN
      expect(result.QR_HOLD.workRecord.primarySSN).toBe("123-45-6789");

      // Different transaction dates
      expect(result.NEW.workRecord.transDt).toBe("2025-01-15");
      expect(result.QR_HOLD.workRecord.transDt).toBe("2025-01-16");

      // Different NAP EIF Tax Period Underreport flags
      expect(result.NEW.workRecord.napEifTaxPrdUndrprt).toBe("N");
      expect(result.QR_HOLD.workRecord.napEifTaxPrdUndrprt).toBe("Y");
    });

    it('should include metadata with expected structure', () => {
      const result = QRDetailsService.getMockQRDetails(mockInventoryId);

      expect(result.metadata).toHaveProperty('dln');
      expect(result.metadata).toHaveProperty('serviceCenter');
      expect(result.metadata).toHaveProperty('taxPeriod');
      expect(result.metadata).toHaveProperty('submissionAge');
      expect(result.metadata).toHaveProperty('lastModifiedBy');
      expect(result.metadata).toHaveProperty('lastModifiedDate');
      expect(result.metadata).toHaveProperty('errors');

      expect(Array.isArray(result.metadata.errors)).toBe(true);
      expect(result.metadata.errors.length).toBeGreaterThan(0);
    });
  });
});
