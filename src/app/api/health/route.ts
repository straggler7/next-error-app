import { NextResponse } from 'next/server';

// Force this API route to be dynamic (non-static)
export const dynamic = 'force-dynamic';
// export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'IRS Error Resolution System API is running'
  });
}
