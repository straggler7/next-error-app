/btw explain how the app router works and why create the route.ts files and how do they differ from pages files                                                  
                                                                                                                                                                 
    Next.js App Router: Routes vs Pages                                                                                                                            
                                                                                                                                                                   
    How the App Router Works
                                                                                                                                                                   
    The App Router (introduced in Next.js 13) uses the file system to define routes. Every folder inside src/app/ maps to a URL path segment. Special filenames    
    inside those folders determine what that route does:                                                                                                           
                                                                                                                                                                   
    - page.tsx — Renders UI for that URL. Visiting /home renders src/app/home/page.tsx.                                                                            
    - route.ts — Handles HTTP requests (GET, POST, PUT, DELETE) as an API endpoint. Hitting /api/auth/seid calls src/app/api/auth/seid/route.ts.                   
    - layout.tsx — Wraps child routes with shared UI (header, providers, etc.)                                                                                     
    - error.tsx — Error boundary for that route segment                                                                                                            
                                                                                                                                                                   
    page.tsx vs route.ts                                                                                                                                           
                                                                                                                                                                   
    ┌──────────────┬───────────────────────────────────────────────────┬────────────────────────────────────────────────┐                                          
    │              │                     page.tsx                      │                    route.ts                    │                                          
    ├──────────────┼───────────────────────────────────────────────────┼────────────────────────────────────────────────┤                                          
    │ Purpose      │ Renders a React component (HTML/UI)               │ Handles raw HTTP requests (JSON API)           │                                          
    ├──────────────┼───────────────────────────────────────────────────┼────────────────────────────────────────────────┤                                          
    │ Returns      │ JSX                                               │ NextResponse.json(...) or other HTTP responses │                                          
    ├──────────────┼───────────────────────────────────────────────────┼────────────────────────────────────────────────┤                                          
    │ Used for     │ User-facing pages                                 │ API endpoints, server-side logic               │                                          
    ├──────────────┼───────────────────────────────────────────────────┼────────────────────────────────────────────────┤                                          
    │ Accessed by  │ Browser navigation                                │ fetch() calls from client or external services │
    ├──────────────┼───────────────────────────────────────────────────┼────────────────────────────────────────────────┤
    │ Can coexist? │ No — a folder can have one or the other, not both │                                                │
    └──────────────┴───────────────────────────────────────────────────┴────────────────────────────────────────────────┘

    Why We Created route.ts for auto-create-profile

    The new file at src/app/api/auth/auto-create-profile/route.ts is an API route, not a page, because:

    1. SSO headers are only available server-side — The browser never sees headers like displayName, mail, memberof. But when the browser makes a
    fetch('/api/auth/auto-create-profile'), that request passes through the Next.js server, which does have access to the original SSO headers from the upstream
    proxy.
    2. It's a backend-to-backend bridge — It reads SSO headers from the incoming request, builds a JSON payload, and forwards it to POST
    ${INVENTORY_API_URL}/api/v1/era/users/create. No UI involved.
    3. Consistent with existing patterns — The project already uses this approach: /api/auth/seid/route.ts reads SSO headers and returns the SEID, and
    /api/[...pages]/route.ts proxies all API calls to the backend.

    In this project's flow

    Browser visits /home  →  src/app/home/page.tsx  →  renders React UI
                                ↓ (fetch call)
                         src/app/api/auth/auto-create-profile/route.ts  →  reads SSO headers, calls backend

    The page.tsx is what the user sees. The route.ts is the plumbing that talks to backend services on the user's behalf.

  Press Space, Enter, or Escape to dismiss