# Reusable Components and Styles Plan

## Goal

Make the components and styles in this project reusable in other applications without copying application-specific auth, routing, report logic, or global CSS side effects.

## Current Constraints

This codebase is a Next.js application, not a packaged UI system. Several components are tightly coupled to:

- Next.js routing and navigation
- App auth context and SEID lookup
- Report-specific services and payload types
- Hardcoded route paths and API endpoints
- Global styling defined in `src/app/globals.css`

Representative coupling points:

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/Header.tsx`
- `src/components/Navigation.tsx`
- `src/components/BaseReport.tsx`
- `src/components/WorkLogPanel.tsx`
- `src/components/TanStackInventoryTable.tsx`

## Plan

1. Decide the extraction target first.
   - Choose either a `packages/ui` workspace inside this repo or a separate repository such as `era-ui`.
   - Do not start moving files until ownership, versioning, and publishing are clear.

2. Define the reusable surface area.
   - Extract low-coupling components first.
   - Good first candidates: `DatePicker`, `StatusBadge`, alerts, spinners, pagination, and simple form primitives.
   - Leave `Header`, `Navigation`, `BaseReport`, and `WorkLogPanel` for a later phase because they are product-specific today.

3. Separate presentation from application logic.
   - Any component that calls services, reads auth context, uses `useSeid`, or hardcodes routes should be split into:
   - A presentational component in the shared UI package
   - A container component that stays in this app and wires data/actions into it

4. Remove Next-specific dependencies from reusable components.
   - Replace direct `next/link` and `next/navigation` usage with props such as `href`, `onNavigate`, `renderLink`, or `onLogout`.
   - `Header` should not fetch `/api/...` itself.
   - `TanStackInventoryTable` should not hardcode `/details/:dln`.

5. Create package-owned component types.
   - Do not reuse app-domain types directly from `src/types/index.ts`.
   - Shared components should depend on minimal, generic interfaces rather than IRS-specific report and user models.

6. Extract design tokens from app globals.
   - Move colors, spacing, radius, and typography tokens out of `src/app/globals.css` into a shared token layer.
   - Avoid forcing global selectors such as `html`, `body`, and `::placeholder` on consumers unless that behavior is explicitly opt-in.

7. Choose a styling distribution model.
   - The current components rely heavily on Tailwind utility classes.
   - Pick one of these approaches:
   - Require consuming apps to use Tailwind v4 too
   - Ship compiled CSS with the package
   - If reuse across mixed stacks matters, compiled CSS plus CSS variables is the safer default

8. Split app-specific composites into config-driven APIs.
   - `BaseReport` currently mixes report IDs, payload behavior, columns, filters, and rendering.
   - Refactor this into:
   - A reusable report or table shell
   - Per-app report configuration and fetch logic that remains in the app

9. Add a proper package export surface.
   - Create `index.ts` exports
   - Define peer dependencies
   - Add a build step
   - Make the shared UI installable instead of copy-pasted

10. Add isolated docs and examples.
   - Use Storybook or an equivalent local playground.
   - Each reusable component should have:
   - usage examples
   - prop documentation
   - accessibility expectations

11. Document the consumer contract.
   - State required CSS imports
   - State supported React and Next versions
   - Define the theming contract
   - Mark which components are framework-agnostic versus Next-specific wrappers

12. Prove the approach with one migration slice.
   - First extract:
   - `DatePicker`
   - `StatusBadge`
   - `LoadingSpinner`
   - `Pagination`
   - alert components
   - Once those work in a second app, move to the table layer next

## Recommended Order

1. Tokens and styling contract
2. Primitive components
3. Generic table and form components
4. App shell wrappers
5. Report-specific composites

## Suggested First Backlog

1. Create `packages/ui` and a minimal build/export pipeline.
2. Move design tokens and shared CSS into the package.
3. Extract the primitive components with package-local types.
4. Replace direct app imports with package imports inside this app.
5. Refactor one composite component to use dependency injection via props instead of app services.
6. Add Storybook or a demo app for isolated verification.
7. Validate consumption from a second project before extracting more complex screens.
