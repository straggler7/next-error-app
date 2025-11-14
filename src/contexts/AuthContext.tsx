'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContext as AuthContextType } from '../types';
import { extractSeidFromHeaders, getUserFromSeid, validateSeid } from '../lib/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        // Check if we're in the browser
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        // Clear localStorage user only on actual page refresh/reload (not on component re-renders)
        // Check if this is a page refresh by looking for a session flag
        const isPageRefresh = !sessionStorage.getItem('auth-initialized');
        if (isPageRefresh) {
          console.log('🧹 AuthContext: Clearing localStorage user on page refresh');
          localStorage.removeItem('dev-selected-user');
          sessionStorage.setItem('auth-initialized', 'true');
        }

        // Try to get SEID from various sources
        let userSeid: string | null = null;

        // First, check for dev selected user in localStorage (development only)
        const devSelectedUser = localStorage.getItem('dev-selected-user');
        if (devSelectedUser) {
          try {
            const parsedUser = JSON.parse(devSelectedUser);
            if (parsedUser.seid) {
              userSeid = parsedUser.seid;
              console.log('🔍 AuthContext: Using dev selected user:', parsedUser);
              // Set user data immediately for dev selected user
              setUser(parsedUser);
            }
          } catch (error) {
            console.warn('Failed to parse dev selected user:', error);
          }
        }

        // If not found, try to get from meta tag (set by server)
        if (!userSeid) {
          const seidMeta = document.querySelector('meta[name="user-seid"]');
          if (seidMeta) {
            userSeid = seidMeta.getAttribute('content');
          }
        }

        // If not found, try to get from API endpoint
        if (!userSeid) {
          try {
            console.log('🔍 AuthContext: Fetching SEID from API...');
            const response = await fetch('/api/auth/seid', {
              method: 'GET',
              cache: 'no-cache'
            });
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
            console.warn('Could not fetch SEID from API:', error);
          }
        }

        console.log('🔍 AuthContext: Final SEID check:', { userSeid, isValid: userSeid && validateSeid(userSeid) });
        
        if (userSeid && validateSeid(userSeid)) {
          console.log('SETTING SEID: ', userSeid);
          setSeid(userSeid);
          const userData = await getUserFromSeid(userSeid);
          console.log('🔍 AuthContext: User data:', userData);
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
  const refreshAuth = async () => {
    setIsLoading(true);
    const devSelectedUser = localStorage.getItem('dev-selected-user');
    if (devSelectedUser) {
      try {
        const parsedUser = JSON.parse(devSelectedUser);
        if (parsedUser.seid) {
          setSeid(parsedUser.seid);
          setUser(parsedUser);
          console.log('🔄 AuthContext: Refreshed with dev selected user:', parsedUser);
        }
      } catch (error) {
        console.warn('Failed to parse dev selected user during refresh:', error);
      }
    }
    setIsLoading(false);
  };

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
