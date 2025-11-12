import { User } from '../types';

/**
 * Extract SEID from various possible header formats
 */
export function extractSeidFromHeaders(headers: Headers): string | null {
  console.log('Extracting SEID from headers: ', headers);
  return headers.get('seid') || 
         headers.get('uid') || 
         headers.get('x-seid') || 
         headers.get('X-SEID') || 
         headers.get('x-user-seid') ||
         null;
}

/**
 * Extract group information from headers
 */
export function extractGroupFromHeaders(headers: Headers): 'tax_examiners' | 'managers' | null {
  const group = headers.get('x-user-group') || 
                headers.get('user-group') || 
                headers.get('group') ||
                null;
  
  if (group === 'tax_examiners' || group === 'managers') {
    return group;
  }
  
  return null;
}

/**
 * Validate SEID format
 */
export function validateSeid(seid: string | null): boolean {
  if (!seid) return false;
  
  // Basic validation - adjust according to your SSO server's SEID format
  if (seid.length !== 5) return false;
  
  // Example: SEID should be alphanumeric
  const seidPattern = /^[a-zA-Z0-9]+$/;
  return seidPattern.test(seid);
}

/**
 * Mock function to get user details from SEID
 * In a real implementation, this would call your user service/API
 */
export async function getUserFromSeid(seid: string): Promise<User | null> {
  try {
    // This is a mock implementation
    // In production, you would call your user service API with the SEID
    // Example: const response = await fetch(`/api/users/${seid}`);
    
    // Mock user data based on SEID
    const mockUsers: Record<string, User> = {
      'U1234': {
        name: 'Sarah Thompson',
        role: 'Tax Examiner',
        group: 'tax_examiners',
        seid: 'U1234'
      },
      'A1234': {
        name: 'John Administrator',
        role: 'Manager',
        group: 'managers',
        seid: 'A1234'
      },
      'X1234': {
        name: 'Mike Examiner',
        role: 'Manager',
        group: 'managers',
        seid: 'X1234'
      },
      'D1234': {
        name: 'Dev User',
        role: 'Tax Examiner',
        group: 'tax_examiners',
        seid: 'D1234'
      },
      'u1000': {
        name: 'Test User u1000',
        role: 'Tax Examiner',
        group: 'tax_examiners',
        seid: 'u1000'
      }
    };

    return mockUsers[seid] || {
      name: 'Unknown User',
      role: 'Tax Examiner',
      group: 'tax_examiners',
      seid: seid
    };
  } catch (error) {
    console.error('Error fetching user from SEID:', error);
    return null;
  }
}

/**
 * Check if user is authenticated based on SEID
 */
export function isAuthenticated(seid: string | null): boolean {
  console.log('Authenticating user with SEID ----------- :', seid);
  return seid !== null && validateSeid(seid);
}

/**
 * Get authentication status from request headers
 */
export function getAuthStatusFromHeaders(headers: Headers) {
  const seid = extractSeidFromHeaders(headers);
  return {
    isAuthenticated: isAuthenticated(seid),
    seid
  };
}
