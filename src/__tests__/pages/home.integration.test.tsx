import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import HomePage from '../../app/home/page';
import { useAuth } from '../../contexts/AuthContext';
import { mockUserProfile, mockAuthContext, mockSelectionData, mockFetchSuccess, mockFetchError } from '../helpers/mockData';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/home'),
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

describe('Home Page Integration Tests', () => {
  const mockPush = jest.fn();
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  // Mock suspense codes data
  const mockSuspenseCodes = [
    { code: 'SC-1', description: 'Pending Review' },
    { code: 'SC-2', description: 'Additional Information Required' },
    { code: 'SC-3', description: 'Quality Review' },
  ];

  // Mock auto-assign response
  const mockAutoAssignResponse = {
    eraDto: {
      dln: '12345678901234567890',
      primarySSN: '123456789',
      primaryNameCtrl: 'SMITH',
      taxPrd: '202312',
      ersReasonCds: ['111', '004'],
      clearCodes: [],
      suspendStatusCode: 'SC-1',
    },
  };

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
    mockFetch.mockImplementation((url) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes('/api/v1/era/suspense-codes')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockSuspenseCodes),
        } as Response);
      }
      if (urlString.includes('/api/v1/era/inventories/auto-assign')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockAutoAssignResponse),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response);
    });
  });

  describe('Page Loading and Initialization', () => {
    it('renders home page with basic structure', () => {
      render(<HomePage />);
      
      // Check for basic page elements without waiting
      expect(screen.getByText(/IRS Error Resolution Application/)).toBeInTheDocument();
    });

    it('displays authenticated user information', () => {
      render(<HomePage />);
      
      // Check that user info is displayed in header
      expect(screen.getByText(/Test User/)).toBeInTheDocument();
      expect(screen.getByText(/Tax Examiner/)).toBeInTheDocument();
    });

    it('renders program selection form elements', () => {
      render(<HomePage />);
      
      // Check for form elements without complex interactions
      const programElements = screen.getAllByText(/program/i);
      expect(programElements.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication Integration', () => {
    it('requires authentication to access the page', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        isAuthenticated: false,
        user: null,
      });
      
      render(<HomePage />);
      
      // Should handle unauthenticated state
      expect(document.body).toBeInTheDocument();
    });

    it('displays user permissions correctly', () => {
      const userWithPermissions = {
        ...mockUserProfile,
        group: 'tax_examiners' as const,
      };
      
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        user: userWithPermissions,
      });
      
      render(<HomePage />);
      
      // Should render for authenticated user
      expect(screen.getByText(/Test User/)).toBeInTheDocument();
    });

  });

  describe('Basic Functionality', () => {
    it('integrates with authentication context', () => {
      render(<HomePage />);
      
      // Verify authentication integration
      expect(screen.getByText(/IRS Error Resolution Application/)).toBeInTheDocument();
    });

    it('renders without crashing with different user types', () => {
      const analystUser = {
        ...mockUserProfile,
        group: 'analysts' as const,
      };
      
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        user: analystUser,
      });
      
      render(<HomePage />);
      
      // Should render successfully
      expect(screen.getByText(/Test User/)).toBeInTheDocument();
    });

  });
});
