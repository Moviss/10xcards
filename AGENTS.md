# AGENTS.md

Repository-wide instructions for coding agents working on `10xCards`.

## 1. Scope and Priority

- Scope: applies to the entire repository.
- Priority order:
  1. Direct user request
  2. System/developer/runtime instructions
  3. This `AGENTS.md`
- When rules conflict, follow the higher-priority source and keep behavior consistent with existing code.

## 2. Project Context

`10xCards` is an AI-powered flashcard application with spaced repetition (SM-2). Users can generate flashcards from text via AI or create them manually, then study with a binary rating flow (`Remember` / `Don't remember`).

## 3. Tech Stack

- Astro 5
- TypeScript 5
- React 19
- Tailwind 4
- Shadcn/ui
- Supabase (Auth + Postgres + RLS)
- OpenRouter (AI generation)

## 4. Common Commands

```bash
# Development
npm run dev
npm run build
npm run preview

# Unit tests (Vitest)
npm run test
npm run test:ui
npm run test:coverage
npx vitest path/to/file.test.ts

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e:ui
npm run dev:e2e
npx playwright test e2e/happy-path.spec.ts

# Code quality
npm run lint
npm run lint:fix
npm run format
```

## 5. Architecture and Directory Conventions

Core flow:
1. API Route (`src/pages/api/...`) for HTTP, auth checks, validation, response mapping.
2. Service (`src/lib/services/...`) for business logic and DB access.
3. Hook/UI layer (`src/lib/hooks/...`, `src/components/...`) for client state and interactions.

Primary directories:
- `src/pages/api` API endpoints.
- `src/lib/services` business logic.
- `src/lib/hooks` reusable app hooks.
- `src/lib/schemas` Zod schemas.
- `src/components` Astro + React components.
- `src/components/ui` Shadcn/ui components.
- `src/db` Supabase client/types.
- `src/middleware/index.ts` Astro middleware.
- `src/types.ts` shared DTO/domain types.
- `supabase/migrations` DB migrations.

If you introduce a meaningful structural change, update this section.

## 6. API and Backend Rules

- API handlers must use uppercase exported methods (`GET`, `POST`, `PUT`, `DELETE`, ...).
- Every API route must include `export const prerender = false`.
- Validate request input with Zod schemas from `src/lib/schemas`.
- Return explicit JSON responses with proper status codes.
- In Astro API routes, use Supabase from `context.locals.supabase` (do not create a new client there).
- Keep business logic in services; keep routes thin.
- Use the local `SupabaseClient` typing from `src/db/supabase.client.ts` in app code.
- Read env via `import.meta.env`.
- Use Astro middleware for shared request/response behavior when needed.
- Use `Astro.cookies` for server-side cookie operations.

## 7. Frontend and React Rules

- Use `.astro` for static layout/content; use React only for interactivity.
- Use functional components with hooks; no class components.
- Never use Next.js directives (`"use client"` etc.).
- Prefer extracting reusable logic to `src/lib/hooks`.
- Use memoization intentionally (`React.memo`, `useMemo`, `useCallback`) only when it improves real render cost.
- Follow accessibility fundamentals:
  - semantic HTML first,
  - ARIA only when native semantics are insufficient,
  - proper labeling (`aria-label`, `aria-labelledby`, `aria-describedby`) where needed.
- Use `data-testid` when introducing selectors that must be stable for E2E tests.

Styling:
- Use Tailwind utilities and project theme tokens.
- Prefer consistent patterns with existing UI before introducing new styling approaches.
- Prefer existing Shadcn components from `src/components/ui`.
- If adding a new Shadcn component, use `npx shadcn@latest add <component>`.
- Keep responsive behavior explicit (`sm`, `md`, `lg`, etc.) and support dark mode patterns already used in the codebase.

## 8. DTOs, Types, and Data Contracts

- Keep shared types and DTOs in `src/types.ts`.
- Derive DTOs from DB row types where possible (`Pick`/mapped types).
- Keep command/input types separate from response DTOs.
- Avoid leaking raw database rows directly to the client when a DTO is expected.

## 9. Testing Rules

General:
- Follow Arrange-Act-Assert.
- Add or update tests for behavior changes.

Unit (Vitest + Testing Library):
- Use `vi.fn`, `vi.spyOn`, and targeted mocks.
- Prefer readable tests with clear `describe`/`it` structure.
- Use `jsdom` environment for DOM-heavy component tests.

E2E (Playwright):
- Keep Page Object Model in `e2e/page-objects`.
- Use resilient selectors (`getByTestId`) when test IDs exist.
- Use contexts/hooks for isolation and setup/teardown.
- Prefer explicit assertions and keep tests deterministic.

## 10. Database and Migration Rules (Supabase)

- Create migrations in `supabase/migrations`.
- Migration filename format: `YYYYMMDDHHmmss_short_description.sql` (UTC).
- SQL should be production-ready, clear, and well-commented.
- Use lowercase SQL.
- For new tables, always enable RLS.
- Create granular policies by operation and role:
  - separate policies for `select`/`insert`/`update`/`delete`,
  - separate policies for `anon` and `authenticated`.
- Add extra cautionary comments for destructive statements (`drop`, `truncate`, risky `alter`).

Supabase setup prerequisites (when touching initialization):
- `@supabase/supabase-js` installed.
- `supabase/config.toml` exists.
- `src/db/database.types.ts` exists and is up to date.

## 11. Clean Code and Error Handling

- Handle invalid input and edge cases early (guard clauses, early returns).
- Avoid deep nesting and unnecessary `else`.
- Keep happy path readable.
- Provide actionable error messages and log context where useful.
- Preserve existing naming and coding style unless there is a strong reason to refactor.

## 12. GitHub Actions (when touched)

- Verify project scripts from `package.json`, Node version from `.nvmrc`, and required envs from `.env.example`.
- Use `npm ci` in CI jobs.
- Prefer job-level `env`/`secrets` over broad global env settings.
- Reuse common workflow logic via composite actions when practical.
- Confirm default branch naming (`main` vs `master`) before hardcoding refs.

## 13. Test Plan Requests

If the user asks for a test plan:
- Write it in Polish.
- Tailor it to this repository, stack, and risk areas.
- Include at least: goals, scope, test types, scenarios, environment, tools, schedule, acceptance criteria, roles, bug-reporting procedure.

## 14. Agent Workflow

For implementation tasks:
1. Inspect existing code paths first (avoid parallel/duplicate implementations).
2. Apply minimal, targeted changes that match current architecture.
3. Prefer updating existing files over introducing new abstractions unless justified.
4. Run relevant checks for impacted areas (`lint`, unit tests, e2e subset when applicable).
5. If checks cannot run, state that explicitly with the reason.
