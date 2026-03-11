'use client';

import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to get the current user's SEID
 * This SEID should be included in API calls for authentication
 */
export function useSeid(): string | null {
  const { seid } = useAuth();
  // Development fallback - return mock SEID if auth SEID is null
  // if (!seid && process.env.NODE_ENV === 'development') {
  //   console.log('🔧 useSeid: Using development fallback SEID');
  //   return 'u1000';
  // }
  
  return seid;
}

/**
 * Custom hook to get the current user's group
 * Useful for role-based access control
 */
export function useUserGroup(): 'tax_examiners' | 'managers' | 'analysts' | null {
  const { user } = useAuth();
  return user?.group || null;
}

/**
 * Custom hook to check if user is a manager
 */
export function useIsManager(): boolean {
  const { user } = useAuth();
  return user?.group === 'managers';
}

/**
 * Custom hook to check if user is a tax examiner
 */
export function useIsTaxExaminer(): boolean {
  const { user } = useAuth();
  return user?.group === 'tax_examiners';
}
