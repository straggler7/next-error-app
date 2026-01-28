import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import WorkRecordPage from '../../app/workRecord/page';
import { useAuth } from '../../contexts/AuthContext';
import { mockUserProfile, mockAuthContext, mockEraDto, mockSelectionData } from '../helpers/mockData';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/workRecord'),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('WorkRecord Page Integration Tests', () => {
  const mockPush = jest.fn();
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
    
    mockUseAuth.mockReturnValue(mockAuthContext);
    
    // Mock successful API responses
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    } as Response);
  });

  describe('Page Loading and Initialization', () => {
    it('shows no work available message when no data is present', async () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      
      render(<WorkRecordPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/No Work Records Available/)).toBeInTheDocument();
      });
    });

    it('renders page header and basic structure when data is available', async () => {
      // Mock basic work record data
      mockSessionStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'eraDto':
            return JSON.stringify(mockEraDto);
          case 'selectionData':
            return JSON.stringify(mockSelectionData);
          case 'inventoryId':
            return 'INV123456';
          default:
            return null;
        }
      });
      
      render(<WorkRecordPage />);
      
      await waitFor(() => {
        // Check that basic page structure is rendered
        expect(screen.getByText(/IRS Error Resolution Application/)).toBeInTheDocument();
        expect(screen.getByText(/Service Center:/)).toBeInTheDocument();
        expect(screen.getByText(/Program:/)).toBeInTheDocument();
      });
    });

    it('accesses sessionStorage for required data', async () => {
      mockSessionStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'eraDto':
            return JSON.stringify(mockEraDto);
          case 'selectionData':
            return JSON.stringify(mockSelectionData);
          case 'inventoryId':
            return 'INV123456';
          default:
            return null;
        }
      });
      
      render(<WorkRecordPage />);
      
      // Check that sessionStorage was accessed for required keys
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('eraDto');
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('selectionData');
    });
  });

  describe('Authentication and Permissions', () => {
    it('requires user authentication to access the page', async () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        isAuthenticated: false,
        user: null,
      });
      
      render(<WorkRecordPage />);
      
      // Should show authentication required message
      await waitFor(() => {
        expect(screen.getByText(/Authentication required/)).toBeInTheDocument();
      });
    });

    it('displays user information when authenticated', async () => {
      mockSessionStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'eraDto':
            return JSON.stringify(mockEraDto);
          case 'selectionData':
            return JSON.stringify(mockSelectionData);
          case 'inventoryId':
            return 'INV123456';
          default:
            return null;
        }
      });
      
      render(<WorkRecordPage />);
      
      await waitFor(() => {
        // Should display authenticated user info in header
        expect(screen.getByText(/Test User/)).toBeInTheDocument();
        expect(screen.getByText(/Tax Examiner/)).toBeInTheDocument();
      });
    });
  });

  describe('Data Management', () => {
    it('integrates with sessionStorage for data persistence', async () => {
      mockSessionStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'eraDto':
            return JSON.stringify(mockEraDto);
          case 'selectionData':
            return JSON.stringify(mockSelectionData);
          default:
            return null;
        }
      });
      
      render(<WorkRecordPage />);
      
      // Verify data is loaded from sessionStorage
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('eraDto');
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('selectionData');
    });

    it('handles missing data gracefully', async () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      
      render(<WorkRecordPage />);
      
      await waitFor(() => {
        // Should show "No Work Records Available" message when no data
        expect(screen.getByText(/No Work Records Available/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Go to Home/ })).toBeInTheDocument();
      });
    });
  });

  describe('Page Integration', () => {
    it('integrates header, breadcrumbs, and main content', async () => {
      mockSessionStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'eraDto':
            return JSON.stringify(mockEraDto);
          case 'selectionData':
            return JSON.stringify(mockSelectionData);
          case 'inventoryId':
            return 'INV123456';
          default:
            return null;
        }
      });
      
      render(<WorkRecordPage />);
      
      await waitFor(() => {
        // Verify page components are integrated
        expect(screen.getByText(/IRS Error Resolution Application/)).toBeInTheDocument();
        expect(screen.getByText(/Service Center:/)).toBeInTheDocument();
        expect(screen.getByText(/Program:/)).toBeInTheDocument();
      });
    });

    it('maintains responsive layout structure', async () => {
      mockSessionStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'eraDto':
            return JSON.stringify(mockEraDto);
          case 'selectionData':
            return JSON.stringify(mockSelectionData);
          case 'inventoryId':
            return 'INV123456';
          default:
            return null;
        }
      });
      
      render(<WorkRecordPage />);
      
      await waitFor(() => {
        // Check for main content container
        const mainContent = document.querySelector('#main-content');
        expect(mainContent).toBeInTheDocument();
      });
    });
  });
});
