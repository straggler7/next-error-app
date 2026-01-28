import { workAssignmentService, AssignedWork, FormElement, GMFError } from '@/services/workAssignmentService';

// Mock DOMParser for XML parsing tests
const mockDOMParser = {
  parseFromString: jest.fn()
};

Object.defineProperty(global, 'DOMParser', {
  value: jest.fn(() => mockDOMParser),
  writable: true
});

describe('WorkAssignmentService', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const createMockResponse = (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 404 ? 'Not Found' : 'Error',
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(typeof data === 'string' ? data : JSON.stringify(data)),
  } as any);

  const mockAssignedWork: AssignedWork = {
    processId: 1,
    payloadId: 1,
    gmfUuid: "12345678-1234-1234-1234-123456789012",
    submissionId: "12345678-1234-1234-1234-123456789012",
    formType: "4868",
    controlDay: "2025-106",
    taxPeriod: "2025"
  };

  const mockFormElements: FormElement[] = [
    { id: "first_name", name: "first_name", label: "First Name", value: "John", type: "text", editable: true, hasFieldError: false },
    { id: "last_name", name: "last_name", label: "Last Name", value: "Doe", type: "text", editable: true, hasFieldError: false },
    { id: "ssn", name: "ssn", label: "SSN", value: "123-45-6789", type: "text", editable: true, hasFieldError: false }
  ];

  describe('getAssignedWork', () => {
    it('should successfully fetch assigned work', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockAssignedWork));

      const result = await workAssignmentService.getAssignedWork();

      expect(fetchMock).toHaveBeenCalledWith('/api/work/getAssignedWork');
      expect(result).toEqual({
        hasWork: true,
        work: mockAssignedWork
      });
    });

    it('should handle 404 response (no work available)', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(null, 404));

      const result = await workAssignmentService.getAssignedWork();

      expect(result).toEqual({
        hasWork: false,
        message: "No work records available to assign at this time."
      });
    });

    it('should fall back to mock data on network error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await workAssignmentService.getAssignedWork();

      expect(result.hasWork).toBe(true);
      expect(result.work).toEqual(mockAssignedWork);
    });

    it('should simulate network delay', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockAssignedWork));

      const startTime = Date.now();
      await workAssignmentService.getAssignedWork();
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(500);
    });
  });

  describe('getJsonWorkRecord', () => {
    const mockPayloadId = 123;
    const mockJsonData = { workRecord: { field1: 'value1', field2: 'value2' } };

    it('should successfully fetch JSON work record', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(JSON.stringify(mockJsonData)));

      const result = await workAssignmentService.getJsonWorkRecord(mockPayloadId);

      expect(fetchMock).toHaveBeenCalledWith(`/api/era/inventory/workrecords/documents/${mockPayloadId}`);
      expect(result).toEqual(mockJsonData);
    });

    it('should handle fetch errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(workAssignmentService.getJsonWorkRecord(mockPayloadId)).rejects.toThrow('Network error');
    });
  });

  describe('updateWorkRecord', () => {
    const mockProcessId = 123;

    it('should successfully update work record', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));

      const result = await workAssignmentService.updateWorkRecord(mockProcessId, mockFormElements);

      expect(fetchMock).toHaveBeenCalledWith(
        `/api/work/updateWorkRecord?processId=${mockProcessId}`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/xml'
          },
          body: expect.stringContaining('<?xml version="1.0" encoding="UTF-8"?>')
        })
      );

      expect(result).toEqual({
        success: true,
        message: 'Work record updated successfully'
      });
    });
  });

  describe('updateJsonWorkRecord', () => {
    const mockProcessId = 123;
    const mockOriginalJsonWorkRecord = {
      workRecord: {
        first_name: 'Original',
        last_name: 'Name',
        ssn: '000-00-0000'
      }
    };

    it('should successfully update JSON work record', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));

      const result = await workAssignmentService.updateJsonWorkRecord(mockProcessId, mockFormElements, mockOriginalJsonWorkRecord);

      expect(result).toEqual({
        success: true,
        message: 'JSON work record updated successfully'
      });
    });

    it('should handle fetch errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await workAssignmentService.updateJsonWorkRecord(mockProcessId, mockFormElements, mockOriginalJsonWorkRecord);

      expect(result).toEqual({
        success: false,
        message: 'Failed to update JSON work record'
      });
    });
  });

  describe('helper methods', () => {
    describe('getFormElementByName', () => {
      it('should find form element by name', () => {
        const element = workAssignmentService.getFormElementByName(mockFormElements, 'first_name');

        expect(element).toBeDefined();
        expect(element?.name).toBe('first_name');
        expect(element?.value).toBe('John');
      });

      it('should return undefined for non-existent element', () => {
        const element = workAssignmentService.getFormElementByName(mockFormElements, 'non_existent');

        expect(element).toBeUndefined();
      });
    });

    describe('updateFormElementValue', () => {
      it('should update form element value', () => {
        const updatedElements = workAssignmentService.updateFormElementValue(mockFormElements, 'first_name', 'Jane');

        const updatedElement = updatedElements.find(el => el.name === 'first_name');
        expect(updatedElement?.value).toBe('Jane');
      });

      it('should not mutate original array', () => {
        const originalElements = [...mockFormElements];
        
        workAssignmentService.updateFormElementValue(mockFormElements, 'first_name', 'Jane');

        expect(mockFormElements).toEqual(originalElements);
      });
    });
  });
});
