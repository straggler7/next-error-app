import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { User } from '../types';
import { extractSeidFromHeaders, getUserFromSeid, validateSeid } from './auth';

/**
 * Server-side authentication helper for App Router
 * Use this in Server Components and Server Actions
 */
export async function getServerAuth(): Promise<{
  user: User | null;
  seid: string | null;
  isAuthenticated: boolean;
}> {
  const headersList = await headers();
  const seid = extractSeidFromHeaders(headersList);

  if (!seid || !validateSeid(seid)) {
    return {
      user: null,
      seid: null,
      isAuthenticated: false
    };
  }

  const user = await getUserFromSeid(seid);

  return {
    user,
    seid,
    isAuthenticated: !!user
  };
}

/**
 * Require authentication in Server Components
 * Redirects to unauthorized page if not authenticated
 */
export async function requireAuth(): Promise<{
  user: User;
  seid: string;
}> {
  const auth = await getServerAuth();

  if (!auth.isAuthenticated || !auth.user || !auth.seid) {
    redirect('/unauthorized');
  }

  return {
    user: auth.user,
    seid: auth.seid
  };
}

/**
 * Get user from server-side context
 * Returns null if not authenticated (doesn't redirect)
 */
export async function getServerUser(): Promise<User | null> {
  const auth = await getServerAuth();
  return auth.user;
}
