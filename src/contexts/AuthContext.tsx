'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContext as AuthContextType } from '../types';
import { getUserFromSeid, validateSeid } from '../lib/auth';

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
        // Check if we're in the browser or during build
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        // Additional check for build environment
        if (process.env.NODE_ENV === 'production' && !window.location) {
          setIsLoading(false);
          return;
        }

        // Clear localStorage user only on actual page refresh/reload (not on component re-renders)
        // Check if this is a page refresh by looking for a session flag
        const isPageRefresh = !sessionStorage.getItem('auth-initialized');
        if (isPageRefresh) {
          localStorage.removeItem('dev-selected-user'); // Legacy cleanup
          localStorage.removeItem('dev-selected-seid');
          sessionStorage.setItem('auth-initialized', 'true');
        }

        // Try to get SEID from various sources
        let userSeid: string | null = null;

        // First, check for dev selected SEID in localStorage (development only)
        const devSelectedSeid = localStorage.getItem('dev-selected-seid');
        if (devSelectedSeid) {
          userSeid = devSelectedSeid;
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
            // Add timeout to prevent hanging during builds
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch('/api/auth/seid', {
              method: 'GET',
              cache: 'no-cache',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const data = await response.json();
              userSeid = data.seid;
            }
          } catch (error) {
            // Silent failure for fallback
          }
        }

        if (userSeid && validateSeid(userSeid)) {
          setSeid(userSeid);
          const userData = await getUserFromSeid(userSeid);
          setUser(userData);
        } else {
          // No valid SEID found - user should be redirected by middleware
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
    try {
      const devSelectedSeid = localStorage.getItem('dev-selected-seid');
      if (devSelectedSeid && validateSeid(devSelectedSeid)) {
        setSeid(devSelectedSeid);
        const userData = await getUserFromSeid(devSelectedSeid);
        setUser(userData);
      } else {
        setSeid(null);
        setUser(null);
      }
    } catch (error) {
      setSeid(null);
      setUser(null);
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
