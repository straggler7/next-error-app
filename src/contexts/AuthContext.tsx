'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthContext as AuthContextType, UserProfile } from '../types';
import { extractSeidFromHeaders, getUserFromSeid, validateSeid } from '../lib/auth';
import mockUsers from '../data/mockUsers.json';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Create a fallback dev user when the backend is unreachable.
 * Uses mock user name if available, otherwise falls back to SEID.
 */
function createFallbackDevUser(userSeid: string): User {
  const mockUser = mockUsers.find(u => u.seid === userSeid);
  return {
    name: mockUser?.name || `Dev User (${userSeid})`,
    role: 'Tax Examiner',
    group: 'tax_examiners',
    seid: userSeid,
    profile: {
      userId: userSeid,
      seid: userSeid,
      userName: mockUser?.name || `Dev User (${userSeid})`,
      designation: 'Tax Examiner',
      teamCode: 'DEV-TEAM',
      serviceCenterId: '16',
      activeStatus: true,
      profile: {
        profiles: {
          '44720': {
            dlnSearch: true,
            deleteEnabled: false,
            qualityReviewEnabled: false,
            leadRoleEnabled: false,
            rejectsEnabled: true,
            suspendStatusCodes: []
          },
          '44730': {
            dlnSearch: true,
            deleteEnabled: false,
            qualityReviewEnabled: false,
            leadRoleEnabled: false,
            rejectsEnabled: true,
            suspendStatusCodes: []
          }
        }
      }
    }
  };
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [seid, setSeid] = useState<string | null>(null);


  useEffect(() => {
    async function initializeAuth() {
      try {
        // Check if we're in the browser or during build
        if (typeof window === 'undefined') {
          console.log('🔍 AuthContext: Server-side or build environment detected, skipping auth initialization');
          setIsLoading(false);
          return;
        }

        // Additional check for build environment
        if (process.env.NODE_ENV === 'production' && !window.location) {
          console.log('🔍 AuthContext: Build environment detected, skipping auth initialization');
          setIsLoading(false);
          return;
        }

        const isDevelopment = process.env.NODE_ENV === 'development';

        // Try to get SEID from various sources
        let userSeid: string | null = null;

        // First, check for dev selected SEID in localStorage (development only)
        const devSelectedSeid = localStorage.getItem('dev-selected-seid');
        if (devSelectedSeid) {
          console.log('🔍 AuthContext: Found dev selected SEID:', devSelectedSeid);
          userSeid = devSelectedSeid;
        }

        // In dev mode, auto-select first mock user if nothing stored
        if (!userSeid && isDevelopment && mockUsers.length > 0) {
          const defaultSeid = mockUsers[0].seid;
          console.log('🔍 AuthContext: No stored SEID, auto-selecting first mock user:', defaultSeid);
          localStorage.setItem('dev-selected-seid', defaultSeid);
          userSeid = defaultSeid;
        }

        // If not found, try to get from meta tag (set by server)
        if (!userSeid) {
          const seidMeta = document.querySelector('meta[name="user-seid"]');
          if (seidMeta) {
            userSeid = seidMeta.getAttribute('content');
          }
        }

        // If not found, try to get from API endpoint (only in browser environment)
        if (!userSeid && typeof window !== 'undefined') {
          try {
            console.log('🔍 AuthContext: Fetching SEID from API...');
            
            // Add timeout to prevent hanging during builds
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch('/api/auth/seid', {
              method: 'GET',
              cache: 'no-cache',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log('🔍 AuthContext: API response status:', response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log('🔍 AuthContext: API response data:', data);
              userSeid = data.seid;
            } else {
              const errorData = await response.json();
              console.log('🔍 AuthContext: API error:', errorData);
            }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              console.warn('AuthContext: API request timed out');
            } else {
              console.warn('Could not fetch SEID from API:', error);
            }
          }
        }

        console.log('🔍 AuthContext: Final SEID check:', { userSeid, isValid: userSeid && validateSeid(userSeid) });
        
        if (userSeid && validateSeid(userSeid)) {
          setSeid(userSeid);
          let userData = await getUserFromSeid(userSeid);

          // In dev mode, use fallback user if backend is unreachable
          if (!userData && isDevelopment) {
            console.log('🔍 AuthContext: Backend unreachable, using fallback dev user for:', userSeid);
            // userData = createFallbackDevUser(userSeid);
          }

          console.log('🔍 AuthContext: User data with profile:', userData);
          setUser(userData);
        } else {
          // No valid SEID found - user should be redirected by middleware
          console.log('🔍 AuthContext: No valid SEID found');
          setSeid(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication initialization error:', error);
        setSeid(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initializeAuth();
  }, []);

  // Function to refresh auth context (useful for dev user selection)
  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const devSelectedSeid = localStorage.getItem('dev-selected-seid');
      if (devSelectedSeid && validateSeid(devSelectedSeid)) {
        console.log('🔄 AuthContext: Refreshing with dev selected SEID:', devSelectedSeid);
        setSeid(devSelectedSeid);
        let userData = await getUserFromSeid(devSelectedSeid);

        // In dev mode, use fallback user if backend is unreachable
        if (!userData && process.env.NODE_ENV === 'development') {
          console.log('🔄 AuthContext: Backend unreachable, using fallback dev user for:', devSelectedSeid);
          userData = createFallbackDevUser(devSelectedSeid);
        }

        console.log('🔄 AuthContext: Refreshed user data:', userData);
        setUser(userData);
      } else {
        console.log('🔄 AuthContext: No valid dev SEID found during refresh');
        setSeid(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error during auth refresh:', error);
      setSeid(null);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user && !!seid,
    isLoading,
    seid,
    isDevelopmentMode: process.env.NODE_ENV === 'development',
    refreshAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // This should not happen due to middleware, but just in case
      window.location.href = '/unauthorized';
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
