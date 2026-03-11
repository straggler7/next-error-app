import { NextRequest, NextResponse } from 'next/server';
import { extractSeidFromHeaders, extractGroupFromHeaders } from '../../../../lib/auth';

// Force this API route to be dynamic (non-static)
export const dynamic = 'force-dynamic';
// export const revalidate = 0;

export async function GET(request: NextRequest) {
  
  try {
    // Development bypass - same logic as middleware
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
    const bypassAuth = process.env.BYPASS_AUTH === 'true';
    // const forceBypass = true; // TEMPORARY: Remove when env vars work
    
    // If bypassing auth, return mock SEID
    if ((isDevelopment && bypassAuth)) {
      return NextResponse.json({ 
        seid: 'u1000',
        group: 'tax_examiners'
      });
    }
    
    const seid = extractSeidFromHeaders(request.headers);
    const group = extractGroupFromHeaders(request.headers);
    
    if (!seid) {
      return NextResponse.json(
        { error: 'No SEID found in headers' },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      seid,
      group: group || 'tax_examiners' // Default to tax_examiners if no group found
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
