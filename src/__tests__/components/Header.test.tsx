import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, usePathname } from 'next/navigation';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { mockUserProfile, mockAuthContext, mockRouter } from '../helpers/mockData';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Header Component', () => {
  const mockPush = jest.fn();
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseRouter.mockReturnValue({
      ...mockRouter,
      push: mockPush,
    });
    mockUsePathname.mockReturnValue('/home');
    mockUseAuth.mockReturnValue(mockAuthContext);
    
    // Mock successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as Response);
  });

  describe('Authentication States', () => {
    it('renders nothing when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        isAuthenticated: false,
      });

      const { container } = render(<Header />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when user is null', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        user: null,
      });

      const { container } = render(<Header />);
      expect(container.firstChild).toBeNull();
    });

    it('renders header when user is authenticated', () => {
      render(<Header />);
      
      expect(screen.getByText('IRS Error Resolution Application')).toBeInTheDocument();
      expect(screen.getByText('Test User (Tax Examiner)')).toBeInTheDocument();
    });
  });

  describe('Header Content', () => {
    it('displays full title on desktop and abbreviated on mobile', () => {
      render(<Header />);
      
      const fullTitle = screen.getByText('IRS Error Resolution Application');
      const shortTitle = screen.getByText('IRS ERS');
      
      expect(fullTitle).toHaveClass('hidden', 'sm:inline');
      expect(shortTitle).toHaveClass('sm:hidden');
    });

    it('displays user information correctly', () => {
      render(<Header />);
      
      expect(screen.getByText('Test User (Tax Examiner)')).toBeInTheDocument();
    });

    it('shows user icon', () => {
      render(<Header />);
      
      const userIcon = screen.getByRole('button', { name: /open user menu/i });
      expect(userIcon).toBeInTheDocument();
    });
  });

  describe('User Menu Functionality', () => {
    it('opens and closes user menu when chevron is clicked', () => {
      render(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open user menu/i });
      
      // Menu should be closed initially
      expect(screen.queryByRole('button', { name: 'Daily Summary' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
      
      // Click to open menu
      fireEvent.click(menuButton);
      
      expect(screen.getByRole('button', { name: 'Daily Summary' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      
      // Click to close menu
      fireEvent.click(menuButton);
      
      expect(screen.queryByRole('button', { name: 'Daily Summary' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes menu when clicking outside overlay', () => {
      render(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open user menu/i });
      fireEvent.click(menuButton);
      
      expect(screen.getByRole('button', { name: 'Daily Summary' })).toBeInTheDocument();
      
      // Click on overlay to close
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
      fireEvent.click(overlay!);
      
      expect(screen.queryByRole('button', { name: 'Daily Summary' })).not.toBeInTheDocument();
    });

    it('navigates to daily summary when menu item is clicked', () => {
      render(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open user menu/i });
      fireEvent.click(menuButton);
      
      const dailySummaryButton = screen.getByRole('button', { name: 'Daily Summary' });
      fireEvent.click(dailySummaryButton);
      
      expect(mockPush).toHaveBeenCalledWith('/daily-summary');
    });

    it('disables daily summary when disableDailySummary prop is true', () => {
      render(<Header disableDailySummary={true} />);
      
      const menuButton = screen.getByRole('button', { name: /open user menu/i });
      fireEvent.click(menuButton);
      
      const dailySummaryButton = screen.getByRole('button', { name: 'Daily Summary' });
      expect(dailySummaryButton).toBeDisabled();
      expect(dailySummaryButton).toHaveClass('text-gray-400', 'cursor-not-allowed');
      
      // Should not navigate when disabled
      fireEvent.click(dailySummaryButton);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Logout Functionality', () => {
    it('handles logout successfully', async () => {
      render(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open user menu/i });
      fireEvent.click(menuButton);
      
      const logoutButton = screen.getByRole('button', { name: 'Logout' });
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/v1/era/users/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'SEID': 'TEST123'
          },
        });
        expect(mockPush).toHaveBeenCalledWith('/logout');
      });
    });

    it('handles logout API failure gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open user menu/i });
      fireEvent.click(menuButton);
      
      const logoutButton = screen.getByRole('button', { name: 'Logout' });
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
        expect(mockPush).toHaveBeenCalledWith('/logout');
      });
      
      consoleSpy.mockRestore();
    });

    it('closes menu before logout', async () => {
      render(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open user menu/i });
      fireEvent.click(menuButton);
      
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
      
      const logoutButton = screen.getByRole('button', { name: 'Logout' });
      fireEvent.click(logoutButton);
      
      // Menu should close immediately
      expect(screen.queryByRole('button', { name: 'Daily Summary' })).not.toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/logout');
      });
    });
  });

  describe('Navigation Bar', () => {
    it('renders navigation links when hideNav is false', () => {
      render(<Header />);
      
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Daily Summary' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Reports' })).toBeInTheDocument();
    });

    it('hides navigation when hideNav is true', () => {
      render(<Header hideNav={true} />);
      
      expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Daily Summary' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Reports' })).not.toBeInTheDocument();
    });

    it('shows active state for current page', () => {
      mockUsePathname.mockReturnValue('/home');
      render(<Header />);
      
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveClass('bg-[#00599c]', 'text-white');
    });

    it('shows active state for reports pages', () => {
      mockUsePathname.mockReturnValue('/reports/1340');
      render(<Header />);
      
      const reportsLink = screen.getByRole('link', { name: 'Reports' });
      expect(reportsLink).toHaveClass('bg-[#00599c]', 'text-white');
    });

    it('shows active state for daily summary pages', () => {
      mockUsePathname.mockReturnValue('/daily-summary');
      render(<Header />);
      
      const dailySummaryLink = screen.getByRole('link', { name: 'Daily Summary' });
      expect(dailySummaryLink).toHaveClass('bg-[#00599c]', 'text-white');
    });

    it('shows Manage Profiles link for managers', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        user: {
          ...mockUserProfile,
          group: 'managers',
        },
      });
      
      render(<Header />);
      
      expect(screen.getByRole('link', { name: 'Manage Profiles' })).toBeInTheDocument();
    });

    it('hides Manage Profiles link for non-managers', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        user: {
          ...mockUserProfile,
          group: 'tax_examiners',
        },
      });
      
      render(<Header />);
      
      expect(screen.queryByRole('link', { name: 'Manage Profiles' })).not.toBeInTheDocument();
    });

    it('shows active state for manage profiles pages', () => {
      mockUsePathname.mockReturnValue('/manage-profiles');
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        user: {
          ...mockUserProfile,
          group: 'managers',
        },
      });
      
      render(<Header />);
      
      const manageProfilesLink = screen.getByRole('link', { name: 'Manage Profiles' });
      expect(manageProfilesLink).toHaveClass('bg-[#00599c]', 'text-white');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for menu button', () => {
      render(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open user menu/i });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-haspopup', 'menu');
      
      fireEvent.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper aria-hidden attribute for chevron icon', () => {
      render(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open user menu/i });
      const chevronIcon = menuButton.querySelector('[aria-hidden="true"]');
      expect(chevronIcon).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('handles all optional props with default values', () => {
      render(<Header />);
      
      // Should render navigation (hideNav default false)
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      
      // Daily Summary should be enabled (disableDailySummary default false)
      const menuButton = screen.getByRole('button', { name: /open user menu/i });
      fireEvent.click(menuButton);
      
      const dailySummaryButton = screen.getByRole('button', { name: 'Daily Summary' });
      expect(dailySummaryButton).not.toBeDisabled();
    });

    it('applies all props correctly when provided', () => {
      render(
        <Header 
          showBackButton={true}
          backHref="/custom-back"
          disableDailySummary={true}
          hideNav={true}
        />
      );
      
      // Navigation should be hidden
      expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument();
      
      // Daily Summary should be disabled
      const menuButton = screen.getByRole('button', { name: /open user menu/i });
      fireEvent.click(menuButton);
      
      const dailySummaryButton = screen.getByRole('button', { name: 'Daily Summary' });
      expect(dailySummaryButton).toBeDisabled();
    });
  });

  describe('User Role Display', () => {
    it('displays user role correctly', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        user: {
          ...mockUserProfile,
          name: 'John Doe',
          role: 'Senior Tax Examiner',
        },
      });
      
      render(<Header />);
      
      expect(screen.getByText('John Doe (Senior Tax Examiner)')).toBeInTheDocument();
    });
  });
});
