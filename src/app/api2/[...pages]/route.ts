import { NextRequest, NextResponse } from 'next/server';

// Force this API route to be dynamic
export const dynamic = 'force-dynamic';
// export const revalidate = 0;

// Set maximum execution time to 2 minutes (120 seconds)
export const maxDuration = 300;

// Backend URL for reports
const REPORTS_BACKEND_URL = process.env.REPORTS_API_URL || 'http://localhost:8081';

export async function GET(request: NextRequest, { params }: { params: Promise<{ pages: string[] }> }) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ pages: string[] }> }) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ pages: string[] }> }) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'PUT');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ pages: string[] }> }) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'DELETE');
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ pages: string[] }> }) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'PATCH');
}

async function handleRequest(
  request: NextRequest, 
  params: { pages: string[] }, 
  method: string
) {
  try {
    // Build the backend URL from the dynamic route segments
    const path = params.pages;
    const originalUrl = request.nextUrl.pathname;
    
    
    // Reconstruct the full path with api2 prefix
    const apiPath = `api/${path.join('/')}`;
    const url = `${REPORTS_BACKEND_URL}/${apiPath}`;
    
    // Get search params from the original request
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;


    // Prepare headers - forward important ones and exclude problematic ones
    const forwardHeaders = new Headers();
    
    // Forward all headers except problematic ones
    const excludeHeaders = ['host', 'connection', 'content-length', 'transfer-encoding'];
    
    request.headers.forEach((value, key) => {
      if (!excludeHeaders.includes(key.toLowerCase())) {
        forwardHeaders.set(key, value);
      }
    });

    // Ensure content-type is set for requests with body
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (!forwardHeaders.has('content-type')) {
        forwardHeaders.set('content-type', 'application/json');
      }
    }

    // Prepare request body for methods that support it
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const requestBody = await request.text();
        body = requestBody || undefined;
      } catch (error) {
      }
    }

    // Make the request to backend
    const response = await fetch(fullUrl, {
      method,
      headers: forwardHeaders,
      body,
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(300000) // (5 minutes)
    });


    // Handle 204 No Content - return empty response with status
    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'cache-control': response.headers.get('cache-control') || 'no-cache',
        }
      });
    }

    // Handle different response types
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { 
        status: response.status,
        headers: {
          // Forward relevant response headers
          'content-type': response.headers.get('content-type') || 'application/json',
          'cache-control': response.headers.get('cache-control') || 'no-cache',
        }
      });
    } else if (contentType.includes('text/')) {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          'content-type': response.headers.get('content-type') || 'text/plain',
        }
      });
    } else {
      // Handle binary responses (files, images, etc.)
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: response.status,
        headers: {
          'content-type': response.headers.get('content-type') || 'application/octet-stream',
          'content-length': response.headers.get('content-length') || buffer.byteLength.toString(),
        }
      });
    }

  } catch (error) {
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        // { error: 'Backend request timeout' },
        // { error: 'Backend request timeout', message: error instanceof Error ? error.message : 'Request Timeout' },
        { message: 'Backend request timeout' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      // { error: 'Backend service unavailable', details: error instanceof Error ? error.message : 'Unknown error' },
      // { error: 'Backend service unavailable', message: error instanceof Error ? error.message : 'Service Unavailable' },
      { message: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}
