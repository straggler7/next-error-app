# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Dev server on port 4003 (Turbopack)
npm run dev:no-auth      # Dev with BYPASS_AUTH=true (recommended for local dev)
npm run build            # Production build
npm run start            # Production server on port 3000
npm run lint             # ESLint
```

No committed test suite yet. Run `npm run lint` and exercise affected routes locally before PRs.

## Architecture

**Next.js 15 App Router** with React 19, TypeScript, Tailwind CSS 4. IRS Error Resolution System (ERS) for tax error management with role-based access.

### Authentication Flow

1. `src/middleware.ts` intercepts requests, checks for SEID in headers (`REMOTE_USER` / `employeeId`)
2. Redirects to `/unauthorized` (missing SEID) or `/forbidden` (invalid SEID)
3. `src/contexts/AuthContext.tsx` provides `useAuth()` hook — returns `{ user, isAuthenticated, isLoading, seid, refreshAuth }`
4. Auth context fetches user profile from `/api/v1/era/users/profile`
5. Dev mode: set `BYPASS_AUTH=true` to skip middleware checks; DevBanner component allows SEID switching via localStorage

### API Proxy Layer

Two catch-all routes proxy to separate backends:
- `src/app/api/[...pages]/route.ts` → `INVENTORY_API_URL` (default `localhost:12000`)
- `src/app/api2/[...pages]/route.ts` → `REPORTS_API_URL` (default `localhost:12100`)

Both forward headers, handle all HTTP methods, and have a 5-minute timeout.

### Data Flow Pattern

```
Page Component ('use client') → Service (src/services/) → API Proxy → Backend
```

- **Services** (`src/services/`) contain all API call logic as static async methods
- **Pages** call services, manage local state with `useState`
- **No state management library** — React Context (auth only) + component state
- All pages use `export const dynamic = 'force-dynamic'` (no static generation)

### Key Component Patterns

- `BaseReport.tsx` — shared base for all report pages (column config, sorting, pagination)
- `TanStackInventoryTable.tsx` — TanStack React Table wrapper used across inventory views
- `DevBanner.tsx` — dev-only banner for user/SEID switching (visible when `NODE_ENV === 'development'`)

### Report System

Reports live under `src/app/reports/[reportId]/` with IDs like 0040, 1340, 1342, 7740, etc. Each report page calls `ReportsService` with the user's SEID and filter payload.

## Coding Style

- 2-space indentation, semicolons, single quotes
- Components: `PascalCase`, hooks: `camelCase` with `use` prefix
- Route folders: lowercase matching URLs (e.g., `src/app/dln-search/page.tsx`)
- Business logic in `src/services/` or `src/utils/`, not in page components
- Types consolidated in `src/types/index.ts`
- Commits: `type(scope): description` (Conventional Commits, imperative mood)

## Environment Variables

Key variables in `.env.development` / `.env.local`:
- `BYPASS_AUTH` — skip auth in middleware (dev only, never production)
- `NEXT_PUBLIC_DEV_ROLE` — mock user role (`managers` | `tax_examiners`)
- `INVENTORY_API_URL` — backend inventory API
- `REPORTS_API_URL` — backend reports API

## ESLint

Config in `eslint.config.mjs`. Extends `next/core-web-vitals` and `next/typescript`. Notable disabled rules: `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`.
