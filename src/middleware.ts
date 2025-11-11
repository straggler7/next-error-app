import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/unauthorized', '/forbidden', '/api/health'];

// Routes that require authentication
const PROTECTED_ROUTES = ['/home', '/workRecord', '/qrInventory', '/qrDetails', '/daily-summary', '/details', '/form4868', '/form4868-ers', '/profile'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Development bypass - check environment variables at runtime
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
  const bypassAuth = process.env.BYPASS_AUTH === 'true';
  
  // TEMPORARY: Force bypass for development (remove this line when env vars work)
  const forceBypass = true; // Set to false to disable
  
  console.log('🔍 Middleware Debug:', {
    pathname,
    NODE_ENV: process.env.NODE_ENV,
    BYPASS_AUTH: process.env.BYPASS_AUTH,
    isDevelopment,
    bypassAuth,
    shouldBypass: isDevelopment && bypassAuth
  });
  
  // Development bypass - skip authentication entirely
  if ((isDevelopment && bypassAuth) || forceBypass) {
    console.log('🔓 Development mode: Authentication bypassed for', pathname);
    const response = NextResponse.next();
    // Set a mock SEID for development
    response.headers.set('x-user-seid', 'U1000');
    return response;
  }
  
  // Allow public routes without authentication
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for SEID header from SSO server
  const seid = request.headers.get('seid') || request.headers.get('x-seid') || request.headers.get('X-SEID');
  
  // If accessing protected routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/') {
    if (!seid) {
      // No SEID header found - redirect to unauthorized page
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }

    // Validate SEID format (basic validation - adjust as needed)
    if (!isValidSeid(seid)) {
      const url = request.nextUrl.clone();
      url.pathname = '/forbidden';
      return NextResponse.redirect(url);
    }

    // Add SEID to response headers for client-side access
    const response = NextResponse.next();
    response.headers.set('x-user-seid', seid);
    return response;
  }

  return NextResponse.next();
}

function isValidSeid(seid: string): boolean {
  // Basic SEID validation - adjust according to your SSO server's format
  // This is a placeholder - implement your actual SEID validation logic
  if (!seid || seid.length < 3 || seid.length > 50) {
    return false;
  }
  
  // Example: SEID should be alphanumeric
  const seidPattern = /^[a-zA-Z0-9]+$/;
  return seidPattern.test(seid);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
