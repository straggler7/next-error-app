# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js 15 App Router project. Application routes live in `src/app/`, shared UI in `src/components/`, reusable hooks in `src/hooks/`, and utility/auth helpers in `src/lib/` and `src/utils/`. Mock payloads and static data used by screens and services are stored in `src/data/`. API-facing logic is grouped under `src/services/`. Static assets belong in `public/`. Treat `dist/` as generated output; do not hand-edit it.

## Build, Test, and Development Commands
- `npm run dev`: starts the app with Turbopack on port `4003`.
- `npm run dev:no-auth`: runs locally with `BYPASS_AUTH=true`.
- `npm run build`: creates a production build.
- `npm run start`: serves the production build on port `3000`.
- `npm run lint`: runs ESLint across the repo.
- `npm run docker:dev` / `npm run docker:prod`: run the app through Docker Compose for development or production-style testing.

## Coding Style & Naming Conventions
Use TypeScript and React function components. The codebase currently uses 2-space indentation, semicolons, and single quotes in most source files; match that style in touched files. Name components in `PascalCase`, hooks in `camelCase` with a `use` prefix, and route folders with lowercase names matching URLs, for example `src/app/dln-search/page.tsx`. Keep business logic in `src/services/` or `src/utils/` instead of large page components.

## Testing Guidelines
There is no committed test runner or test suite yet. At minimum, run `npm run lint` and exercise the affected route locally before opening a PR. When adding tests, keep them close to the feature or in a dedicated `tests/` folder, and use names like `Header.test.tsx` or `reportsService.test.ts`.

## Commit & Pull Request Guidelines
Recent commits follow a concise Conventional Commit style such as `fix(work-record): ...` and `fix(devBanner): ...`. Prefer `type(scope): short description`, with imperative wording. PRs should include a short summary, impacted routes or services, linked issue or ticket, and screenshots for UI changes. Call out any auth, mock-data, or Docker setup needed for reviewers.

## Configuration Notes
Development commonly runs on port `4003`, while production `next start` uses `3000`. Authentication can be bypassed locally with `BYPASS_AUTH=true`, but do not enable that in shared or production environments.
