import { NextRequest, NextResponse } from 'next/server';
import { extractUserCreationData } from '../../../../lib/ssoHeaders';
import mockUsers from '../../../../data/mockUsers.json';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.INVENTORY_API_URL || 'http://localhost:8081';

export async function POST(request: NextRequest) {
  try {
    const seid = request.headers.get('SEID');
    const isDevelopment = process.env.NODE_ENV === 'development';

    // In dev mode, look up mock user and create mock SSO headers
    if (isDevelopment && seid) {
      const mockUser = mockUsers.find(u => u.seid === seid);
      
      if (mockUser) {
        console.log('🔧 Dev mode: Found mock user, creating mock SSO headers:', mockUser);
        
        // Create mock SSO headers from mockUser data
        const mockHeaders = new Headers();
        mockHeaders.set('employeeId', mockUser.seid);
        mockHeaders.set('displayName', mockUser.name);
        mockHeaders.set('mail', mockUser.email);
        
        // Create memberof header: xbag-era-dev-{designation}-{serviceCenter}
        const designationKey = mockUser.designation.toLowerCase().includes('manager') ? 'mgr' : 'taxex';
        mockHeaders.set('memberof', `xbag-era-dev-${designationKey}-${mockUser.serviceCenter}`);
        
        const userData = extractUserCreationData(mockHeaders);
        
        if (userData) {
          console.log('🔧 Dev mode: Extracted user creation data:', userData);
          
          // Call backend to create profile
          const backendResponse = await fetch(`${BACKEND_URL}/api/v1/era/users/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error(`Backend create user failed: ${backendResponse.status}`, errorText);
            return NextResponse.json(
              { error: 'Failed to create user profile', details: errorText },
              { status: backendResponse.status }
            );
          }

          const createdProfile = await backendResponse.json();
          console.log('✅ User profile created successfully:', createdProfile);

          return NextResponse.json(createdProfile, { status: 201 });
        }
      }
    }

    // Production mode or fallback: extract from actual SSO headers
    const userData = extractUserCreationData(request.headers);

    if (!userData) {
      return NextResponse.json(
        { error: 'Missing required SSO headers for user creation' },
        { status: 400 }
      );
    }

    console.log('Auto-creating user profile:', userData);

    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/era/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Backend create user failed: ${backendResponse.status}`, errorText);
      return NextResponse.json(
        { error: 'Failed to create user profile', details: errorText },
        { status: backendResponse.status }
      );
    }

    const createdProfile = await backendResponse.json();
    console.log('User profile created successfully:', createdProfile);

    return NextResponse.json(createdProfile, { status: 201 });
  } catch (error) {
    console.error('Error in auto-create-profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
