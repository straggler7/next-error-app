# Reusable Components Extraction Backlog

## Goal

Turn the current app-local UI into a reusable package without dragging along:

- Next.js routing assumptions
- app auth and SEID context
- report-specific services and payloads
- hardcoded API endpoints
- global CSS side effects

This backlog is the implementation companion to `REUSABLE-COMPONENTS-PLAN.md`.

## Proposed Target Structure

Create a workspace package in this repository first:

`packages/ui`

Suggested structure:

- `packages/ui/package.json`
- `packages/ui/tsconfig.json`
- `packages/ui/src/index.ts`
- `packages/ui/src/components/`
- `packages/ui/src/styles/tokens.css`
- `packages/ui/src/styles/components.css`
- `packages/ui/src/types/`
- `packages/ui/src/utils/`

Keep app-specific wrappers in the existing Next app:

- `src/components/app-shell/`
- `src/components/reporting/`
- `src/components/containers/`

## File-by-File Extraction Targets

### Move Early With Minimal Refactor

These are the best first candidates for `packages/ui` because they are mostly presentational:

- `src/components/DatePicker.tsx`
- `src/components/StatusBadge.tsx`
- `src/components/LoadingSpinner.tsx`
- `src/components/ErrorAlert.tsx`
- `src/components/InfoAlert.tsx`
- `src/components/ColumnSelector.tsx`
- `src/components/ActionDropdown.tsx`
- `src/components/ComboBox.tsx`
- `src/components/ProgramRoleGrid.tsx`
- `src/components/WorkLogCard.tsx`
- `src/components/FormSection.tsx`
- `src/components/NotesSection.tsx`

Refactor needed before moving:

- Replace app-owned types from `src/types/index.ts` with package-local types.
- Standardize prop shapes where they currently encode product-specific language such as `seid`.
- Review random ID generation in `DatePicker` and switch to `useId` for stable rendering.

### Refactor Then Move

These components are reusable in concept, but not in their current form:

- `src/components/Breadcrumbs.tsx`
- `src/components/Pagination.tsx`
- `src/components/TanStackInventoryTable.tsx`
- `src/components/InventoryTable.tsx`
- `src/components/QRInventoryTable.tsx`
- `src/components/ExaminerCard.tsx`
- `src/components/ErrorBoundary.tsx`

Required changes:

- `Breadcrumbs` must stop calling `next/navigation` directly and accept navigation via props or rendered links.
- `Pagination` must stop depending on app-level `PaginationState` and expose a package-local pagination model.
- `TanStackInventoryTable` must stop importing `next/link`, `SubmissionRecord`, and route conventions such as `/details/:dln`.
- `InventoryTable` has the same issue and should likely be retired in favor of a single generic table abstraction.
- `QRInventoryTable` must stop depending on `QRInventoryRecord` from the service layer.
- `ExaminerCard` is close to reusable, but its prop names and copy are domain-specific.
- `ErrorBoundary` can move as-is once its fallback and logging behavior are defined as package policy.

### Keep In App As Containers Or Product Shell

These should stay in the app and be rewritten as wrappers around reusable primitives:

- `src/components/Header.tsx`
- `src/components/Navigation.tsx`
- `src/components/BaseReport.tsx`
- `src/components/WorkLogPanel.tsx`
- `src/components/DevBanner.tsx`
- `src/components/ErrorSidebar.tsx`

Why they stay app-local:

- `Header` depends on `next/link`, `next/navigation`, auth context, user shape, and a logout API call.
- `Navigation` hardcodes report routes, user-group filtering, and route matching.
- `BaseReport` mixes rendering with report IDs, payload models, date filter logic, table config, formatting helpers, and export behavior.
- `WorkLogPanel` fetches report data directly through app services and `useSeid`.
- `DevBanner` is a development-only app utility, not reusable UI.
- `ErrorSidebar` may become reusable later, but today it is tightly shaped around `ErrorItem` and domain workflow.

## App Files That Need To Change During Extraction

These files are not part of the UI package, but they must be updated as consumers:

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/reports/layout.tsx`
- `src/app/reports/*/page.tsx`
- `src/app/daily-summary/page.tsx`
- `src/app/qrInventory/page.tsx`
- `src/app/dln-search/page.tsx`
- `src/app/manage-profiles/page.tsx`
- `src/app/home/page.tsx`
- `src/app/workRecord/page.tsx`
- `src/types/index.ts`

## Backlog By Phase

### Phase 0: Package Foundation

Deliverables:

- Add npm workspaces to the root `package.json`.
- Create `packages/ui`.
- Add a package build pipeline.
- Add an export entrypoint.
- Add package peer dependencies for `react`, `react-dom`, and any styling/runtime dependencies that must be shared.

Tasks:

1. Update root `package.json` to support workspaces.
2. Add `packages/ui/package.json`.
3. Add `packages/ui/tsconfig.json`.
4. Add `packages/ui/src/index.ts`.
5. Choose a build tool for the package.
6. Confirm whether the package will ship source-only, compiled JS, compiled CSS, or both.

Exit criteria:

- The app can import a trivial component from `packages/ui`.

### Phase 1: Styling Contract

Deliverables:

- Shared design tokens.
- Shared component styles.
- Clear rules for app-global styles versus package-owned styles.

Tasks:

1. Move reusable CSS variables out of `src/app/globals.css`.
2. Create `packages/ui/src/styles/tokens.css`.
3. Decide whether placeholder styling, body font, and page background are opt-in or app-owned.
4. Remove package dependence on `html`, `body`, and other global selectors.
5. Document how consuming apps load package styles.

Exit criteria:

- Shared components render correctly when styles are imported outside this app.

### Phase 2: Primitive Extraction

Target files:

- `DatePicker`
- `StatusBadge`
- `LoadingSpinner`
- `ErrorAlert`
- `InfoAlert`
- `ActionDropdown`
- `ColumnSelector`
- `ComboBox`
- `FormSection`
- `NotesSection`
- `WorkLogCard`

Tasks:

1. Create package-local types for action items, note entries, status badge variants, and dropdown options.
2. Remove imports from `src/types/index.ts`.
3. Normalize prop naming so components do not expose IRS-specific vocabulary unless intentionally domain-bound.
4. Export these components from `packages/ui/src/index.ts`.
5. Replace app imports to consume them through the package.

Exit criteria:

- These components are imported from `packages/ui` inside this app.
- No primitive component in the package imports from `src/app`, `src/services`, `src/hooks`, `src/contexts`, or `next/*`.

### Phase 3: Shared Data Display Layer

Target files:

- `Pagination`
- `Breadcrumbs`
- `ErrorBoundary`
- `ProgramRoleGrid`
- `ExaminerCard`

Tasks:

1. Introduce package-local interfaces for pagination and breadcrumb items.
2. Change `Breadcrumbs` to accept link rendering or click handlers.
3. Decide whether `ErrorBoundary` logging is caller-provided.
4. Review copy strings and rename domain-specific props.
5. Add examples for each component in isolated docs.

Exit criteria:

- These components work without Next.js imports or app types.

### Phase 4: Table Abstraction

Target files:

- `TanStackInventoryTable`
- `InventoryTable`
- `QRInventoryTable`

Tasks:

1. Consolidate on one table abstraction instead of maintaining multiple overlapping tables.
2. Replace domain record imports with generic row typing.
3. Remove route assumptions from the default ID cell.
4. Expose customizable cell renderers and optional row selection as props.
5. Decide whether the package exports only a generic table shell or also domain-flavored presets.

Exit criteria:

- The shared table can render different row shapes without importing app service types.
- Navigation behavior is injected from the consuming app.

### Phase 5: App Shell Separation

Target files:

- `Header`
- `Navigation`
- `DevBanner`
- `reports/layout.tsx`

Tasks:

1. Split `Header` into:
   - a reusable visual shell
   - an app container that provides user data, menu actions, and logout behavior
2. Split `Navigation` into:
   - a generic nav list or side nav component
   - app-owned report config and route matching
3. Keep `DevBanner` app-local.
4. Update the reports layout to use the split components.

Exit criteria:

- App shell visuals are reusable.
- App-specific auth and route logic remain in the app.

### Phase 6: Reporting Layer Refactor

Target files:

- `BaseReport`
- `WorkLogPanel`
- report pages under `src/app/reports/*/page.tsx`

Tasks:

1. Extract a reusable report page shell from `BaseReport`.
2. Move report column definitions into app-owned config files.
3. Move service-center formatting and report payload handling out of the shared component.
4. Convert `WorkLogPanel` into:
   - a presentational summary panel
   - an app container that fetches and aggregates data
5. Keep report fetch services in `src/services`.

Exit criteria:

- Shared report UI depends only on props.
- All report fetching and payload construction stays in the app.

## Specific Refactors To Queue

### `DatePicker`

Required changes:

- Replace `Math.random()` IDs with `useId`.
- Decide whether the component should accept ISO dates, formatted strings, or both.
- Remove hidden assumptions that the app uses `MM/DD/YYYY`.

### `StatusBadge`

Required changes:

- Move `StatusBadgeVariant` into the package.
- Decide whether the variant model is generic or domain-labeled.

### `ActionDropdown`

Required changes:

- Move `ActionDropdownItem` into the package.
- Consider allowing controlled open state later if consumers need it.

### `ComboBox`

Required changes:

- Replace the `seid` field in `ComboBoxOption` with a generic secondary label or metadata field.

### `Pagination`

Required changes:

- Fix the pagination contract if `totalRecords` is currently being used as a page-local count instead of full-result count.
- Package a simpler API such as `page`, `pageSize`, `totalItems`, and callback handlers.

### `TanStackInventoryTable`

Required changes:

- Remove `next/link`.
- Remove `SubmissionRecord`.
- Remove hardcoded default route behavior.
- Provide default column helpers only if they are truly generic.

### `Header`

Required changes:

- Split out a presentational header bar.
- Inject user display, active section, nav items, and menu actions as props.
- Move logout API and redirect logic into an app container.

### `Navigation`

Required changes:

- Replace hardcoded report arrays with passed-in items.
- Replace auth-group filtering with caller-owned filtering.
- Replace pathname matching with passed-in active state.

### `BaseReport`

Required changes:

- Extract generic report controls.
- Move report-type column definitions into app config.
- Move service formatting and export behavior out of the visual layer.
- Decide whether the final shared component is actually a report shell or just filter and table primitives.

### `WorkLogPanel`

Required changes:

- Split into a pure summary panel and an app container.
- Keep `ReportsService` and `useSeid` out of the package.

## Types To Split Out

Package-owned types should be created for:

- badge variants
- pagination model
- action menu items
- combobox options
- breadcrumb items
- note entries
- table selection state

Keep these app-owned:

- `User`
- `UserProfile`
- `AuthContext`
- `ReportRecord`
- `ReportPayload`
- `InventoryRecord`
- `ErrorItem`

Exception:

- If a type becomes generic enough after refactoring, it can be promoted later. Do not start by exporting app-domain interfaces from the package.

## Proposed First Extraction Slice

Do this first to prove the approach:

1. Set up `packages/ui`.
2. Move tokens and package styles.
3. Extract:
   - `DatePicker`
   - `StatusBadge`
   - `LoadingSpinner`
   - `ErrorAlert`
   - `InfoAlert`
   - `Pagination`
4. Convert the app to import those from the package.
5. Verify rendering in:
   - `src/components/BaseReport.tsx`
   - `src/components/WorkLogPanel.tsx`
   - `src/app/daily-summary/page.tsx`

Why this slice:

- It avoids the hardest routing and auth entanglements.
- It validates the styling distribution model.
- It proves package consumption inside the same repo before any larger refactor.

## Definition Of Done

The extraction effort is done when:

- shared components are imported from `packages/ui`
- package components do not import app services, app contexts, app hooks, or `next/*`
- styling is documented and portable
- at least one second consumer can use the package without copying files
- app-specific behavior lives in wrappers and containers, not in shared components
