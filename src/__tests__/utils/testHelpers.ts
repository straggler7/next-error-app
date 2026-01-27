/**
 * Test helper utilities for consistent testing across the application
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Mock data generators
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
  serviceCenterNumber: 16,
};

export const mockUserProfile = {
  seid: '12345',
  name: 'Test User',
  team: 'Test Team',
  profile: {
    profiles: {
      '44720': {
        leadRoleEnabled: false,
        rejectsEnabled: true,
        qualityReviewEnabled: false,
        deleteEnabled: true,
        dlnSearch: true,
        suspendStatusCodes: ['SC-1', 'SC-2'],
      },
      '44730': {
        leadRoleEnabled: true,
        rejectsEnabled: false,
        qualityReviewEnabled: true,
        deleteEnabled: false,
        dlnSearch: false,
        suspendStatusCodes: ['SC-3', 'SC-4'],
      },
    },
  },
};

export const mockSelectionData = {
  program: '44720',
  serviceCenter: 'Andover',
  team: 'Test Team',
};

// Mock API responses
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

// Session storage helpers
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

// Fetch mock helper
export const setupFetchMock = () => {
  const fetchMock = jest.fn();
  global.fetch = fetchMock;
  return fetchMock;
};

// Custom render function for components that need providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, {
    ...options,
  });
};

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock router helpers
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

// Mock search params
export const mockSearchParams = (params: Record<string, string> = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value);
  });
  return searchParams;
};

// Error boundary test helper
export const expectToThrow = (fn: () => void, errorMessage?: string) => {
  expect(fn).toThrow(errorMessage);
};

// Date helpers for consistent testing
export const mockDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  return mockDate;
};

export const restoreDate = () => {
  jest.restoreAllMocks();
};

// Console mock helpers
export const mockConsole = () => {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  return originalConsole;
};

// Form data helpers
export const createFormData = (data: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

// File upload helpers
export const createMockFile = (
  name: string,
  content: string,
  type = 'text/plain'
) => {
  return new File([content], name, { type });
};

// Local storage helpers (similar to session storage)
export const mockLocalStorage = () => {
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
