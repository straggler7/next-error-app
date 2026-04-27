/**
 * Utilities for parsing SSO headers to extract user creation data.
 *
 * memberof format: xbag-era-dev-{designation}-{serviceCenter}
 * Can be a single string or semicolon-separated list (last one is used).
 * Examples:
 *   xbag-era-dev-mgr-austin
 *   xbag-era-dev-analyst-hq-analyst (analyst defaults to Austin service center)
 *   xbag-era-dev-taxex-austin
 *   xbag-era-dev-mgr-austin;xbag-era-dev-analyst-hq-analyst (uses last: analyst-hq-analyst)
 */

import { getServiceCenterCodes } from '../utils/serviceCenters';

const MEMBEROF_PREFIX_LENGTH = 3; // xbag, era, dev

const DESIGNATION_MAP: Record<string, string> = {
  'mgr': 'Manager',
  'taxex': 'Tax Examiner',
  'analyst-hq': 'Analyst',
};

/**
 * Parse memberof header to get the last value from semicolon-separated list.
 * If memberof contains semicolons, splits and returns the last entry.
 * Otherwise returns the memberof string as-is.
 */
function parseMemberOf(memberof: string | null): string | null {
  if (!memberof) return null;
  
  const entries = memberof.split(';');
  return entries[entries.length - 1].trim() || null;
}

/**
 * Extract designation from memberof header.
 * Middle segments (between prefix and last segment) joined with '-' are matched.
 * If memberof is semicolon-separated, uses the last entry.
 */
export function extractDesignationFromMemberOf(memberof: string | null): string | null {
  const parsedMemberOf = parseMemberOf(memberof);
  if (!parsedMemberOf) return null;

  const parts = parsedMemberOf.split('-');
  if (parts.length < MEMBEROF_PREFIX_LENGTH + 2) return null;

  const designationSegments = parts.slice(MEMBEROF_PREFIX_LENGTH, -1).join('-');
  return DESIGNATION_MAP[designationSegments] || null;
}

/**
 * Extract service center city name from memberof header.
 * For analyst role (analyst-hq-analyst format), defaults to 'austin'.
 * For other roles, extracts from last segment.
 * If memberof is semicolon-separated, uses the last entry.
 */
export function extractServiceCenterFromMemberOf(memberof: string | null): string | null {
  const parsedMemberOf = parseMemberOf(memberof);
  if (!parsedMemberOf) return null;

  const parts = parsedMemberOf.split('-');
  if (parts.length < MEMBEROF_PREFIX_LENGTH + 2) return null;

  // Check if this is an analyst role (analyst-hq-analyst format)
  const designationSegments = parts.slice(MEMBEROF_PREFIX_LENGTH, -1).join('-');
  if (designationSegments === 'analyst-hq') {
    return 'austin'; // Default service center for analysts
  }

  // For other roles, extract from last segment
  return parts[parts.length - 1] || null;
}

export interface UserCreationData {
  seid: string;
  userName: string;
  serviceCenterId: number;
  designation: string;
  email: string;
}

/**
 * Extract all user creation fields from request headers.
 * Returns null if any required field is missing.
 */
export function extractUserCreationData(headers: Headers): UserCreationData | null {
  const seid = headers.get('employeeId') || headers.get('REMOTE_USER');
  const userName = headers.get('displayName');
  const email = headers.get('mail');
  const memberof = headers.get('memberof');

  if (!seid || !userName || !email || !memberof) {
    console.log('Missing SSO headers for user creation:', { seid: !!seid, userName: !!userName, email: !!email, memberof: !!memberof });
    return null;
  }

  const serviceCenterName = extractServiceCenterFromMemberOf(memberof);
  const designation = extractDesignationFromMemberOf(memberof);

  if (!serviceCenterName || !designation) {
    console.warn('Could not parse memberof header:', memberof);
    return null;
  }

  const codes = getServiceCenterCodes(serviceCenterName);
  if (codes.length === 0) {
    console.warn('No service center ID found for:', serviceCenterName);
    return null;
  }
  const serviceCenterId = codes[0];

  return { seid, userName, serviceCenterId, designation, email };
}
