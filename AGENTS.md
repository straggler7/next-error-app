# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js 15 App Router project. Application routes, layouts, and API handlers live in `src/app/`. Reusable UI belongs in `src/components/`, shared business logic in `src/services/`, and cross-cutting helpers in `src/hooks/`, `src/lib/`, `src/utils/`, and `src/contexts/`. Static reference data and mock payloads live in `src/data/`. Public assets such as icons and images are stored in `public/`. Treat `dist/` and `.next/` as generated output, not source.

## Build, Test, and Development Commands
- `npm run dev`: start local development on port `4003` with Turbopack.
- `npm run dev:no-auth`: run locally with `BYPASS_AUTH=true`.
- `npm run build`: create a production build.
- `npm run start`: serve the production build on port `3000` unless `PORT` is set.
- `npm run lint`: run ESLint across the codebase.
- `npm run docker:dev`: start the Docker development profile with hot reload.
- `npm run docker:prod`: build and run the production Docker stack.

## Coding Style & Naming Conventions
Use TypeScript and keep imports rooted at `@/*` where practical. The repo is in strict mode and uses ESLint from `eslint.config.mjs`; run lint before opening a PR. Follow existing source style: 2-space indentation, double quotes, and semicolons. Name React components in PascalCase (`ErrorSidebar.tsx`), hooks with a `use` prefix (`useApi.ts`), and utilities/services in camelCase file names. Keep route folders aligned to URL segments and report identifiers, for example `src/app/reports/1342/page.tsx`.

## Testing Guidelines
There is no dedicated automated test runner configured yet. For now, treat `npm run lint` and `npm run build` as the minimum validation steps. Also manually verify the routes you touched, especially report pages, auth flows, and API handlers. If you add tests later, prefer `*.test.ts` or `*.test.tsx` alongside the feature or under a clearly named top-level test directory.

## Commit & Pull Request Guidelines
Recent history uses short conventional commits such as `fix: clean up` and `fix(reports): dates cannot be in future validation`. Keep commits focused and use the same pattern when possible. PRs should include a brief summary, affected routes or screens, linked issue if one exists, and screenshots for UI changes. Call out any updates to Docker, CI, or environment files so reviewers can validate deployment impact.
