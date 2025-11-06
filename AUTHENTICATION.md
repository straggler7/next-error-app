# Authentication Implementation

This document describes the SSO authentication implementation for the IRS Error Resolution System.

## Overview

The application integrates with an internal SSO server that handles authentication by:
1. Intercepting requests to the application
2. Adding an SEID (Session ID) header for authenticated users
3. Forwarding the request to the Next.js application
4. Redirecting unauthenticated users to unauthorized pages

## Architecture

### 1. Middleware (`src/middleware.ts`)
- Intercepts all requests before they reach page components
- Checks for SEID header in various formats (`seid`, `x-seid`, `X-SEID`)
- Validates SEID format using basic validation rules
- Redirects to `/unauthorized` if no SEID is found
- Redirects to `/forbidden` if SEID is invalid
- Adds SEID to response headers for client-side access

### 2. Authentication Context (`src/contexts/AuthContext.tsx`)
- Provides authentication state throughout the application
- Manages user data and loading states
- Attempts to retrieve SEID from multiple sources:
  - Meta tags (server-rendered)
  - API endpoint (`/api/auth/seid`)
- Fetches user data based on SEID

### 3. Authentication Utilities (`src/lib/auth.ts`)
- `extractSeidFromHeaders()`: Extracts SEID from various header formats
- `validateSeid()`: Validates SEID format (customize as needed)
- `getUserFromSeid()`: Fetches user data (currently mocked)
- `isAuthenticated()`: Checks authentication status

### 4. Server-Side Authentication (`src/lib/server-auth.ts`)
- `getServerAuth()`: Gets authentication state in Server Components
- `requireAuth()`: Enforces authentication with automatic redirect
- `getServerUser()`: Gets user data without redirect

## Protected Routes

The following routes are protected by the middleware:
- `/home`
- `/workRecord`
- `/qrInventory`
- `/qrDetails`
- `/daily-summary`
- `/details`
- `/form4868`
- `/form4868-ers`

## Public Routes

These routes are accessible without authentication:
- `/unauthorized`
- `/forbidden`
- `/api/health`

## Error Pages

### `/unauthorized`
Displayed when no SEID header is found. This typically means:
- User is not logged into the SSO system
- SSO server is not forwarding the request properly

### `/forbidden`
Displayed when SEID is present but invalid. This typically means:
- SEID format is incorrect
- SEID has expired or been revoked
- Authentication credentials are corrupted

## Usage Examples

### Client-Side Authentication Check
```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, isLoading, seid } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not authenticated</div>;
  
  return <div>Welcome, {user?.name}!</div>;
}
```

### Server-Side Authentication
```tsx
import { requireAuth } from '../lib/server-auth';

export default async function ProtectedPage() {
  const { user, seid } = await requireAuth();
  
  return <div>Hello, {user.name}! Your SEID is {seid}</div>;
}
```

### Higher-Order Component Protection
```tsx
import { withAuth } from '../contexts/AuthContext';

const ProtectedComponent = withAuth(MyComponent);
```

## Configuration

### SEID Validation
Customize the SEID validation in `src/lib/auth.ts`:

```typescript
export function validateSeid(seid: string | null): boolean {
  if (!seid) return false;
  
  // Customize these rules based on your SSO server's SEID format
  if (seid.length < 3 || seid.length > 50) return false;
  
  // Example: SEID should be alphanumeric
  const seidPattern = /^[a-zA-Z0-9]+$/;
  return seidPattern.test(seid);
}
```

### User Data Fetching
Replace the mock implementation in `getUserFromSeid()`:

```typescript
export async function getUserFromSeid(seid: string): Promise<User | null> {
  try {
    // Replace with actual API call
    const response = await fetch(`/api/users/${seid}`);
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}
```

## Security Considerations

1. **SEID Validation**: Implement proper SEID validation based on your SSO server's format
2. **Header Security**: Ensure SEID headers cannot be spoofed by clients
3. **Session Management**: Consider implementing session timeout and refresh logic
4. **Error Handling**: Avoid exposing sensitive information in error messages
5. **Logging**: Log authentication events for security monitoring

## Testing

To test the authentication system:

1. **Without SEID**: Access any protected route directly - should redirect to `/unauthorized`
2. **With Invalid SEID**: Set an invalid SEID header - should redirect to `/forbidden`
3. **With Valid SEID**: Set a valid SEID header - should allow access and show user data

## Troubleshooting

### Common Issues

1. **Infinite Redirects**: Check middleware configuration and route patterns
2. **SEID Not Found**: Verify SSO server is setting headers correctly
3. **User Data Not Loading**: Check `getUserFromSeid()` implementation
4. **Client-Side Errors**: Ensure AuthProvider is wrapped around the app

### Debug Mode

Enable debug logging by adding console.log statements in:
- Middleware SEID extraction
- AuthContext initialization
- User data fetching

## Integration with SSO Server

Ensure your SSO server:
1. Sets the SEID header in the correct format
2. Forwards requests to the Next.js application
3. Handles logout and session expiration
4. Provides user information endpoints if needed
