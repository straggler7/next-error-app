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


## Summary (11/14/2025)
Here’s how SSO-style authentication is wired in this app.

---

## 1. Core idea: SEID header = “logged-in user”

- The app assumes an upstream IRS SSO/proxy sits in front of Next.js.
- When a user is authenticated, that system injects an SEID header into every request (e.g. `SEID`, `X-SEID`, etc.).
- The app treats “valid SEID header present” as “user is authenticated”.

---

## 2. Middleware: gatekeeper for every request

**File:** [src/middleware.ts](cci:7://file:///Users/madhub/Documents/s2/ERS_4868/wireframes/next-app/irs-error-resolution/src/middleware.ts:0:0-0:0)

- Runs on every request to protected routes.
- It:
  - Reads the SEID from the incoming request headers (supports multiple header names).
  - Validates it against configurable rules (e.g. pattern like `U1000` / `u1000`, non-empty).
- **If SEID is missing or invalid:**
  - Redirects the user to `/unauthorized`.
- **If SEID is present but user/group doesn’t have required access (for certain routes):**
  - Redirects to `/forbidden`.
- Public routes (like `/unauthorized`, `/forbidden`, maybe `/`) are excluded from protection.

Result: You can’t hit any main app page without a valid SEID.

---

## 3. Server-side helpers

**File:** [src/lib/server-auth.ts](cci:7://file:///Users/madhub/Documents/s2/ERS_4868/wireframes/next-app/irs-error-resolution/src/lib/server-auth.ts:0:0-0:0)

- Provides utilities for server components / route handlers:
  - Extract SEID from `headers()`.
  - Optionally fetch user details from a data source (mocked for now).
  - Throw or redirect to `/unauthorized` / `/forbidden` if checks fail.
- This ensures server-rendered pages and API routes can trust the SEID the middleware already enforced.

---

## 4. API route for SEID

**File:** `src/app/api/auth/seid/route.ts`

- Simple Next.js API endpoint.
- Reads the SEID from the request headers (same logic as middleware).
- Returns JSON like:

  ```json
  { "seid": "u1000" }
  ```

- Used by the client-side auth context to learn “who am I?” in the browser, based on the header the SSO/proxy already attached.

---

## 5. Client-side AuthContext

**File:** [src/contexts/AuthContext.tsx](cci:7://file:///Users/madhub/Documents/s2/ERS_4868/wireframes/next-app/irs-error-resolution/src/contexts/AuthContext.tsx:0:0-0:0)

- React context that manages auth state on the client:
  - On mount, calls `/api/auth/seid` to get the SEID.
  - Using that SEID, it either:
    - Builds/fetches a `user` object (name, role, group, etc.), or
    - Marks the user as unauthenticated if no SEID.
- Exposes to components:

  - `user` (with fields like `name`, `role`, `group`)
  - `isAuthenticated`
  - Possibly helpers like `isManager`, etc.

- Components like [Header](cci:1://file:///Users/madhub/Documents/s2/ERS_4868/wireframes/next-app/irs-error-resolution/src/components/Header.tsx:15:0-155:1) use this:

  - If `!isAuthenticated || !user`, [Header](cci:1://file:///Users/madhub/Documents/s2/ERS_4868/wireframes/next-app/irs-error-resolution/src/components/Header.tsx:15:0-155:1) returns `null` so no header appears on pages when you don’t have a valid user.
  - On normal authenticated pages, [Header](cci:1://file:///Users/madhub/Documents/s2/ERS_4868/wireframes/next-app/irs-error-resolution/src/components/Header.tsx:15:0-155:1) shows the user name/role and nav based on this context.

---

## 6. Unauthorized and Forbidden pages

**Files:**

- [src/app/unauthorized/page.tsx](cci:7://file:///Users/madhub/Documents/s2/ERS_4868/wireframes/next-app/irs-error-resolution/src/app/unauthorized/page.tsx:0:0-0:0)
- [src/app/forbidden/page.tsx](cci:7://file:///Users/madhub/Documents/s2/ERS_4868/wireframes/next-app/irs-error-resolution/src/app/forbidden/page.tsx:0:0-0:0)

- These are **public** pages, so middleware allows them even when SEID is missing/invalid.
- They show:
  - Explanation that SSO/credentials are missing or invalid.
  - A “Try Again” button (reloads the page, giving SSO another chance to inject SEID).
- They now also include a static copy of the header + nav bar, but **not** the shared [Header](cci:1://file:///Users/madhub/Documents/s2/ERS_4868/wireframes/next-app/irs-error-resolution/src/components/Header.tsx:15:0-155:1) component (since that requires `isAuthenticated`).

---

## 7. Overall flow

1. User accesses an app URL.
2. IRS SSO/proxy authenticates them and injects SEID header.
3. [middleware.ts](cci:7://file:///Users/madhub/Documents/s2/ERS_4868/wireframes/next-app/irs-error-resolution/src/middleware.ts:0:0-0:0) checks the SEID and route access:
   - If OK → request proceeds.
   - If no/invalid SEID → redirect to `/unauthorized`.
   - If SEID is OK but not authorized for that resource → redirect to `/forbidden`.
4. For normal pages:
   - Server helpers can use SEID.
   - Client-side `AuthContext` calls `/api/auth/seid`, builds `user`, and sets `isAuthenticated`.
   - Components (like [Header](cci:1://file:///Users/madhub/Documents/s2/ERS_4868/wireframes/next-app/irs-error-resolution/src/components/Header.tsx:15:0-155:1)) render based on that context.

If you want, I can walk through a specific request (e.g. hitting `/manage-profiles` as a non-manager) and trace exactly what happens step by step in the code.