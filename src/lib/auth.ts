import { User } from '../types';

/**
 * Extract SEID from various possible header formats
 */
export function extractSeidFromHeaders(headers: Headers): string | null {
  return headers.get('seid') || 
         headers.get('x-seid') || 
         headers.get('X-SEID') || 
         headers.get('x-user-seid') ||
         null;
}

/**
 * Validate SEID format
 */
export function validateSeid(seid: string | null): boolean {
  if (!seid) return false;
  
  // Basic validation - adjust according to your SSO server's SEID format
  if (seid.length < 3 || seid.length > 50) return false;
  
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
      'user123': {
        name: 'Sarah Thompson',
        role: 'Tax Examiner',
        seid: 'user123'
      },
      'admin456': {
        name: 'John Administrator',
        role: 'System Administrator',
        seid: 'admin456'
      },
      'examiner789': {
        name: 'Mike Examiner',
        role: 'Senior Tax Examiner',
        seid: 'examiner789'
      },
      'dev-user-123': {
        name: 'Dev User',
        role: 'Developer (Test Mode)',
        seid: 'dev-user-123'
      },
      'U1000': {
        name: 'Test User U1000',
        role: 'Tax Examiner (Dev Mode)',
        seid: 'U1000'
      }
    };

    return mockUsers[seid] || {
      name: 'Unknown User',
      role: 'Tax Examiner',
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
