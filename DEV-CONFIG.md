# Development Configuration

## Authentication Bypass for Local Development

For local development and testing, you can bypass the SSO authentication system using several methods:

### Option 1: Environment Variable Bypass (Recommended)

Create a `.env.local` file in the project root:

```bash
# .env.local
BYPASS_AUTH=true
```

This will:
- Skip all authentication checks in middleware
- Automatically set a mock SEID header (`dev-user-123`)
- Use the "Dev User" with role "Developer (Test Mode)"
- Log bypass activity to console with 🔓 emoji

### Option 2: Manual SEID Header Injection

If you want to test with specific users, you can modify the middleware temporarily:

```typescript
// In src/middleware.ts, replace the mock SEID line:
response.headers.set('x-user-seid', 'user123'); // or 'admin456', 'examiner789'
```

Available test users:
- `user123` - Sarah Thompson (Tax Examiner)
- `admin456` - John Administrator (System Administrator)  
- `examiner789` - Mike Examiner (Senior Tax Examiner)
- `dev-user-123` - Dev User (Developer Test Mode)

### Option 3: Browser Extension (Advanced)

Use a browser extension like "ModHeader" to inject SEID headers:
- Header Name: `x-seid`
- Header Value: `user123` (or any test user SEID)

### Option 4: Temporary Route Bypass

Add specific routes to the PUBLIC_ROUTES array in middleware:

```typescript
const PUBLIC_ROUTES = ['/unauthorized', '/forbidden', '/api/health', '/home']; // Add routes here
```

## Testing Different Authentication States

### Test Unauthenticated State
1. Don't set `BYPASS_AUTH=true`
2. Don't inject any SEID headers
3. Visit any protected route → should redirect to `/unauthorized`

### Test Invalid Authentication
1. Don't set `BYPASS_AUTH=true`
2. Inject an invalid SEID header (e.g., `invalid-seid`)
3. Visit any protected route → should redirect to `/forbidden`

### Test Valid Authentication
1. Set `BYPASS_AUTH=true` OR inject valid SEID header
2. Visit protected routes → should work normally

## Development Scripts

Add these to your `package.json` scripts:

```json
{
  "scripts": {
    "dev:no-auth": "BYPASS_AUTH=true npm run dev",
    "dev:with-auth": "npm run dev"
  }
}
```

Usage:
```bash
# Development with authentication bypassed
npm run dev:no-auth

# Development with authentication enabled (for testing)
npm run dev:with-auth
```

## Security Notes

⚠️ **Important**: 
- The bypass only works when `NODE_ENV === 'development'`
- Never set `BYPASS_AUTH=true` in production
- The `.env.local` file should be in `.gitignore` (already configured)
- Remove any temporary middleware modifications before committing

## Console Logging

When bypass is active, you'll see console logs like:
```
🔓 Development mode: Authentication bypassed for /home
🔓 Development mode: Authentication bypassed for /workRecord
```

This helps you know when authentication is bypassed vs. when it's working normally.
