/**
 * Mock data for testing components and services
 */

// Mock EraDto data
export const mockEraDto = {
  dln: '12345678901234567890',
  primarySSN: '123456789',
  primaryNameCtrl: 'SMITH',
  taxPrd: '202312',
  ersReasonCds: ['111', '004'],
  clearCodes: [],
  suspendStatusCode: 'SC-1',
  MeFReceiptDate: '2026-01-20T10:30:00',
  submissionId: 'SUB123456',
  formType: '1040',
  programCd: '44720',
  programId: '44720',
  serviceCenterId: 16,
  submissionNames: 'JOHN SMITH',
  submissionTins: '123456789',
  taxPeriod: '202312',
  serviceCenter: 'ANDOVER',
  source: 'ELF',
  controlDay: '001',
  daysInInventory: 5,
  submissionErrors: 2,
};

// Mock User Profile data
export const mockUserProfile = {
  seid: 'TEST123',
  name: 'Test User',
  role: 'Tax Examiner',
  team: 'Test Team',
  group: 'tax_examiners' as const,
  profile: {
    userId: 'TEST123',
    seid: 'TEST123',
    userName: 'Test User',
    designation: 'Tax Examiner',
    serviceCenterId: '16',
    teamName: 'Test Team',
    teamCode: 'T001',
    activeStatus: true,
    profile: {
      profiles: {
        '44720': {
          leadRoleEnabled: false,
          rejectsEnabled: true,
          qualityReviewEnabled: true,
          deleteEnabled: true,
          dlnSearch: true,
          suspendStatusCodes: ['SC-1', 'SC-2'],
        },
        '44730': {
          leadRoleEnabled: true,
          rejectsEnabled: false,
          qualityReviewEnabled: false,
          deleteEnabled: false,
          dlnSearch: false,
          suspendStatusCodes: ['SC-3', 'SC-4'],
        },
      },
    },
  },
};

// Mock Selection Data
export const mockSelectionData = {
  program: '44720',
  serviceCenter: 'andover',
  team: 'Test Team',
  seid: 'TEST123',
};

// Mock Suspense Codes
export const mockSuspenseCodes = [
  {
    code: 'SC-1',
    description: 'Pending Review',
    category: 'Review',
    daysSuspended: 5,
  },
  {
    code: 'SC-2',
    description: 'Additional Information Required',
    category: 'Information',
    daysSuspended: 3,
  },
  {
    code: 'SC-3',
    description: 'Quality Review',
    category: 'Quality',
    daysSuspended: 7,
  },
  {
    code: 'SC-4',
    description: 'Supervisor Review',
    category: 'Supervisor',
    daysSuspended: 2,
  },
  {
    code: 'SC-5',
    description: 'Technical Review',
    category: 'Technical',
    daysSuspended: 4,
  },
];

// Mock API Response helpers
export const mockApiResponse = <T>(data: T, status = 200): Partial<Response> => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: new Headers(),
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  clone: jest.fn().mockReturnThis(),
  body: null,
  bodyUsed: false,
  redirected: false,
  type: 'basic' as ResponseType,
  url: '',
});

export const mockApiError = (message: string, status = 500): Partial<Response> => ({
  ok: false,
  status,
  statusText: 'Error',
  headers: new Headers(),
  json: jest.fn().mockResolvedValue({ error: message }),
  text: jest.fn().mockResolvedValue(message),
  clone: jest.fn().mockReturnThis(),
  body: null,
  bodyUsed: false,
  redirected: false,
  type: 'basic' as ResponseType,
  url: '',
});

// Mock Report Data
export const mockReportData = [
  {
    dln: '12345678901234567',
    ssn: '123456789',
    nameControl: 'SMITH',
    serviceCenter: 'ANDOVER',
    formType: '1040',
    program: '44720',
    source: 'ELF',
    controlDay: '001',
    daysInInventory: 5,
    submissionErrors: 2,
  },
  {
    dln: '98765432109876543',
    ssn: '987654321',
    nameControl: 'JONES',
    serviceCenter: 'ATLANTA',
    formType: '1040EZ',
    program: '44730',
    source: 'MeF',
    controlDay: '002',
    daysInInventory: 3,
    submissionErrors: 1,
  },
];

// Mock Error Configuration
export const mockErrorConfig = {
  '004': {
    description: 'EIF/NAP Mismatch',
    clearable: true,
  },
  '005': {
    description: 'Name Control Mismatch NAP/EIF',
    clearable: true,
  },
  '011': {
    description: 'Invalid Tax Period',
    clearable: false,
  },
  '103': {
    description: 'Missing Required Field',
    clearable: false,
  },
  '107': {
    description: 'Invalid Format',
    clearable: false,
  },
  '111': {
    description: 'Tax Period/Transaction Date',
    clearable: true,
  },
  '113': {
    description: 'Data Validation Error',
    clearable: false,
  },
  '135': {
    description: 'System Error',
    clearable: false,
  },
  '01TIN': {
    description: 'Primary SSN Error',
    fieldMappings: ['primarySSN'],
  },
  '01NC': {
    description: 'Primary Name Control Error',
    fieldMappings: ['primaryNameCtrl'],
  },
  '01TXP': {
    description: 'Tax Period Error',
    fieldMappings: ['taxPrd'],
  },
  '01TDT': {
    description: 'Receipt Date Error',
    fieldMappings: ['MeFReceiptDate'],
  },
};

// Mock Service Centers
export const mockServiceCenters = [
  { name: 'Andover', codes: [14, 16] },
  { name: 'Atlanta', codes: [31] },
  { name: 'Austin', codes: [73] },
  { name: 'Brookhaven', codes: [10] },
  { name: 'Cincinnati', codes: [21] },
  { name: 'Fresno', codes: [93] },
  { name: 'Kansas City', codes: [64] },
  { name: 'Memphis', codes: [55] },
  { name: 'Ogden', codes: [87] },
  { name: 'Philadelphia', codes: [12] },
];

// Mock QR Inventory Data
export const mockQrInventoryData = [
  {
    dln: '12345678901234567',
    primarySSN: '123456789',
    primaryNameCtrl: 'SMITH',
    taxPrd: '202312',
    submissionId: 'SUB123456',
    formType: '1040',
    programCd: '44720',
    serviceCenterId: 16,
    ersReasonCds: ['111', '004'],
    suspendStatusCode: 'SC-1',
    MeFReceiptDate: '2026-01-20T10:30:00',
    daysInErs: 5,
    assignedTo: 'TEST123',
    reviewStatus: 'Pending',
  },
  {
    dln: '98765432109876543',
    primarySSN: '987654321',
    primaryNameCtrl: 'JONES',
    taxPrd: '202312',
    submissionId: 'SUB789012',
    formType: '1040EZ',
    programCd: '44730',
    serviceCenterId: 31,
    ersReasonCds: ['005', '103'],
    suspendStatusCode: 'SC-2',
    MeFReceiptDate: '2026-01-19T14:15:00',
    daysInErs: 7,
    assignedTo: 'TEST456',
    reviewStatus: 'In Progress',
  },
];

// Mock Daily Summary Data
export const mockDailySummaryData = [
  {
    date: '2026-01-20',
    serviceCenter: 'ANDOVER',
    program: '44720',
    totalProcessed: 150,
    resolved: 120,
    suspended: 20,
    deleted: 10,
    averageProcessingTime: 45,
    qualityScore: 95.5,
  },
  {
    date: '2026-01-20',
    serviceCenter: 'ATLANTA',
    program: '44730',
    totalProcessed: 200,
    resolved: 180,
    suspended: 15,
    deleted: 5,
    averageProcessingTime: 38,
    qualityScore: 97.2,
  },
];

// Mock Authentication Context
export const mockAuthContext = {
  user: mockUserProfile,
  isAuthenticated: true,
  isLoading: false,
  seid: 'TEST123',
  login: jest.fn(),
  logout: jest.fn(),
};

// Mock Router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

// Mock Fetch Responses
export const mockFetchSuccess = (data: any) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response);
};

export const mockFetchError = (message: string, status = 500) => {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(JSON.stringify({ message })),
  } as Response);
};

// Mock Session Storage
export const mockSessionStorage = () => {
  const storage: { [key: string]: string } = {};
  
  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    get storage() {
      return { ...storage };
    },
  };
};
