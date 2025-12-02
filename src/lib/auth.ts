import { User } from '../types';

/**
 * Extract SEID from various possible header formats
 */
// export function extractSeidFromHeaders(headers: Headers): string | null {
//   console.log('Extracting SEID from headers: ', headers);
//   return headers.get('seid') || 
//          headers.get('uid') || 
//          headers.get('x-seid') || 
//          headers.get('X-SEID') || 
//          headers.get('x-user-seid') ||
//          null;
// }

export function extractSeidFromHeaders(headers: Headers): string | null {
  console.log('Extracting SEID from headers: ', headers);
  return headers.get('employeeId') || 
         headers.get('REMOTE_USER') || 
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
 * Interface for user profile API response
 */
interface UserProfileResponse {
  userId: string;
  seid: string;
  userName: string;
  designation: string;
  serviceCenterId: string;
  teamCode: string;
  activeStatus: boolean;
  profile: {
    profiles: Record<string, {
      dlnSearch: boolean;
      deleteEnabled: boolean;
      qualityReviewEnabled: boolean;
      leadRoleEnabled: boolean;
      rejectsEnabled: boolean;
      suspendStatusCodes: string[];
    }>;
  };
}

/**
 * Create a development user based on DEV_ROLE environment variable
 */
function createDevUser(seid: string): User | null {
  const devRole = process.env.NEXT_PUBLIC_DEV_ROLE;
  
  if (!devRole || (devRole !== 'managers' && devRole !== 'tax_examiners')) {
    console.log('🔧 DEV_ROLE not set or invalid:', devRole);
    return null;
  }
  
  console.log('🔧 Creating dev user with role:', devRole, 'for SEID:', seid);
  
  const user: User = {
    name: `Dev User (${seid})`,
    role: devRole === 'managers' ? 'Manager' : 'Tax Examiner',
    group: devRole,
    seid: seid,
    profile: {
      userId: seid,
      seid: seid,
      userName: `Dev User (${seid})`,
      designation: devRole === 'managers' ? 'Manager' : 'Tax Examiner',
      teamCode: 'DEV-TEAM',
      serviceCenterId: '16', // Default to Austin
      activeStatus: true,
      profile: {
        profiles: {
          '44720': {
            dlnSearch: true,
            deleteEnabled: devRole === 'managers',
            qualityReviewEnabled: true,
            leadRoleEnabled: devRole === 'managers',
            rejectsEnabled: true,
            suspendStatusCodes: ['SC-1', 'SC-2', 'SC-3', 'SC-4', 'SC-5']
          },
          '44730': {
            dlnSearch: true,
            deleteEnabled: devRole === 'managers',
            qualityReviewEnabled: true,
            leadRoleEnabled: devRole === 'managers',
            rejectsEnabled: true,
            suspendStatusCodes: ['SC-1', 'SC-2', 'SC-3', 'SC-4', 'SC-5']
          }
        }
      }
    }
  };
  
  return user;
}

/**
 * Get user details from SEID by calling the user profile API
 */
export async function getUserFromSeid(seid: string): Promise<User | null> {
  try {
    console.log('Fetching user profile for SEID:', seid);
    
    const response = await fetch('/api/v1/era/users/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'SEID': seid
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
      
      // Check if DEV_ROLE is set and return dev user
      const devUser = createDevUser(seid);
      if (devUser) {
        console.log('🔧 Using dev user due to API failure:', devUser);
        return devUser;
      }
      
      return null;
    }

    const userProfile: UserProfileResponse = await response.json();
    
    // Map the API response to the User interface
    const user: User = {
      name: userProfile.userName,
      role: userProfile.designation,
      group: mapDesignationToGroup(userProfile.designation),
      seid: userProfile.seid,
      profile: userProfile // Include the entire user profile
    };

    console.log('Successfully fetched user profile:', user);
    return user;
    
  } catch (error) {
    console.error('Error fetching user from SEID:', error);
    
    // Check if DEV_ROLE is set and return dev user
    const devUser = createDevUser(seid);
    if (devUser) {
      console.log('🔧 Using dev user due to API error:', devUser);
      return devUser;
    }
    
    return null;
  }
}

/**
 * Map designation from API to user group
 */
function mapDesignationToGroup(designation: string): 'tax_examiners' | 'managers' {
  const lowerDesignation = designation.toLowerCase();
  
  if (lowerDesignation.includes('manager') || 
      lowerDesignation.includes('supervisor') || 
      lowerDesignation.includes('lead')) {
    return 'managers';
  }
  
  return 'tax_examiners';
}

/**
 * Fallback function for development/testing when API is not available
 */
// function getFallbackUser(seid: string): User | null {
//   const mockUsers: Record<string, User> = {
//     'u1000': {
//       name: 'Test User u1000',
//       role: 'Tax Examiner',
//       group: 'tax_examiners',
//       seid: 'u1000'
//     },
//     'f3wpb': {
//       name: 'Test User f3wpb',
//       role: 'Manager',
//       group: 'managers',
//       seid: 'f3wpb'
//     }
//   };

//   console.log('Using fallback user data for SEID:', seid);
//   return mockUsers[seid] || {
//     name: 'Unknown User',
//     role: 'Tax Examiner',
//     group: 'tax_examiners',
//     seid: seid
//   };
// }

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
