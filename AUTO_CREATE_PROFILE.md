# Auto-Create User Profile on 404

## Context

Previously, `getUserFromSeid()` in `src/lib/auth.ts` called `GET /api/v1/era/users/profile`. If the profile didn't exist (404), it fell back to a dev user or returned null — meaning new users with valid SSO credentials couldn't use the app until manually created. This change auto-creates the user from SSO header data when a 404 is returned.

## Approach: Server-Side API Route

A new API route `/api/auth/auto-create-profile` reads SSO headers server-side and calls the backend create endpoint. The client calls this when the profile endpoint returns 404.

**Why a server-side route (not middleware or client-side)?**
- Middleware can't reliably make async backend calls (Edge runtime limitations)
- SSO headers (`displayName`, `mail`, `memberof`) are only available on the server — the browser never sees them
- Expanding `/api/auth/seid` would mix identity discovery with profile creation concerns

## Files Changed

| File | Action |
|------|--------|
| `src/lib/ssoHeaders.ts` | Created — SSO header parsing utilities |
| `src/app/api/auth/auto-create-profile/route.ts` | Created — server-side create endpoint |
| `src/lib/auth.ts` | Modified — added 404 → auto-create logic in `getUserFromSeid()` |

## How `auto-create-profile/route.ts` Works

This is a Next.js API route handler that acts as a bridge between the client and the backend user creation API. It exists because SSO headers are only available on the server side.

### Flow

1. **Client calls `POST /api/auth/auto-create-profile`** — no request body needed. The SSO headers (`displayName`, `mail`, `memberof`, `employeeId`/`REMOTE_USER`) are already on the incoming request from the upstream SSO proxy.

2. **`extractUserCreationData(request.headers)`** reads those SSO headers and parses them:
   - `seid` from `employeeId` or `REMOTE_USER`
   - `name` from `displayName`
   - `email` from `mail`
   - `serviceCenter` and `designation` from `memberof` (see parsing logic below)

3. **Validation** — if any required field is missing (e.g., no `memberof` header), returns 400 immediately.

4. **Backend call** — sends `POST ${INVENTORY_API_URL}/api/v1/era/users/create` with the JSON payload `{ seid, name, serviceCenter, designation, email }`.

5. **Response** — returns the created user profile (201) or forwards the backend error status.

### Why no request body?

The route doesn't need one. All data comes from SSO headers on the request itself. The browser's `fetch('/api/auth/auto-create-profile', { method: 'POST' })` passes through the Next.js server, which receives the original SSO headers from the reverse proxy. The route reads them directly via `request.headers`.

## Memberof Parsing Logic

The `memberof` SSO header follows the format: `xbag-era-dev-{designation}-{serviceCenter}`

Split on `-`:
- First 3 segments (`xbag-era-dev`) are a fixed prefix
- **Last segment** is always the service center city name (e.g., `austin`)
- **Middle segments** (index 3 to second-to-last) joined with `-` represent designation

### Examples

| memberof value | Designation segments | Designation | Service Center |
|---|---|---|---|
| `xbag-era-dev-mgr-austin` | `mgr` | Manager | austin |
| `xbag-era-dev-analyst-hq-austin` | `analyst-hq` | Analyst | austin |
| `xbag-era-dev-taxex-austin` | `taxex` | Tax Examiner | austin |

### Designation Mapping

| Segment | Maps to |
|---|---|
| `mgr` | Manager |
| `taxex` | Tax Examiner |
| `analyst-hq` | Analyst |

Service center is sent as the city name string (e.g., `"austin"`), not a numeric code.

## Auth Flow (Updated)

```
AuthContext → getUserFromSeid(seid)
  → GET /api/v1/era/users/profile (with SEID header)
    → 200: map to User, return ✓
    → 404: attempt auto-create ↓
      → POST /api/auth/auto-create-profile
        → reads SSO headers from request
        → POST ${INVENTORY_API_URL}/api/v1/era/users/create
          → 201: return created user profile → map to User, return ✓
          → 409: user already exists, fall through
          → other error: fall through
    → other errors: fall through
  → fallback: createDevUser() if DEV_ROLE set, else null
```

## Edge Cases

- **Missing SSO headers**: auto-create route returns 400, client falls through to dev user fallback or null
- **Dev mode (`BYPASS_AUTH=true`)**: SSO headers are absent, existing dev user fallback handles this — no change in behavior
- **User already exists (409)**: auto-create returns 409, client logs and falls through
- **Unrecognized memberof format**: `extractUserCreationData()` returns null, route returns 400

## Verification

1. `npm run dev:no-auth` — existing dev mode still works (no SSO headers = dev fallback)
2. `npm run lint` — no lint errors in changed files
3. With SSO headers (via proxy/curl):
   - Profile exists → normal flow, no create call
   - Profile 404 → auto-create called → user created and returned
   - Missing headers → graceful fallback
