# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

10xCards is an AI-powered flashcard application using spaced repetition (SM-2 algorithm) for learning. Users can generate flashcards from text via AI or create them manually, then study with a binary rating system (Remember/Don't Remember).

## Commands

```bash
# Development
npm run dev              # Start dev server at localhost:3000
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm run test             # Unit tests (watch mode)
npm run test:ui          # Unit tests with Vitest UI
npm run test:coverage    # Unit tests with coverage
npm run test:e2e         # E2E tests with Playwright
npm run test:e2e:ui      # E2E tests with Playwright UI
npm run dev:e2e          # Dev server in test mode for E2E

# Run single unit test file
npx vitest src/lib/hooks/useAuthForm.test.ts

# Run single E2E test
npx playwright test e2e/happy-path.spec.ts

# Code quality
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier
```

## Architecture

### Tech Stack
- **Astro 5** - Static pages with React islands for interactivity
- **React 19** - Interactive components with hooks
- **Supabase** - PostgreSQL database with Row-Level Security (RLS) and Auth
- **OpenRouter** - AI model access for flashcard generation

### Key Directories
```
src/
├── pages/api/           # REST API endpoints (Astro server endpoints)
├── lib/services/        # Business logic layer
├── lib/hooks/           # React hooks (state + API calls)
├── lib/schemas/         # Zod validation schemas
├── components/          # React components (.tsx) and Astro components (.astro)
├── db/                  # Supabase client and database types
└── types.ts             # Shared DTOs for frontend/backend
```

### Request Flow
1. **API Route** (`src/pages/api/`) - HTTP handling, auth check, input validation with Zod
2. **Service** (`src/lib/services/`) - Business logic, database operations
3. **React Hook** (`src/lib/hooks/`) - Frontend state management, calls API endpoints

### Services
- `auth.service.ts` - Registration, login, logout, account deletion
- `flashcard.service.ts` - CRUD operations for flashcards
- `study.service.ts` - SM-2 algorithm, study sessions, reviews
- `generation.service.ts` - AI flashcard generation orchestration
- `openrouter.service.ts` - OpenRouter API integration

### Database Access
- Use `context.locals.supabase` in Astro API routes (injected via middleware)
- Use `SupabaseClient` type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`
- Database types are generated in `src/db/database.types.ts`

### DTOs and Types
- All shared types live in `src/types.ts`
- DTOs are derived from database row types using TypeScript `Pick`
- Command types (request bodies) are separate from response DTOs

## Conventions

### API Endpoints
- Use uppercase HTTP methods: `GET`, `POST`, `PUT`, `DELETE`
- Add `export const prerender = false` for all API routes
- Validate input with Zod schemas from `src/lib/schemas/`
- Return JSON responses with appropriate status codes

### React Components
- Use functional components with hooks
- Extract logic into custom hooks in `src/lib/hooks/`
- No Next.js directives (`"use client"` etc.) - this is Astro + React

### Testing
- Unit tests: Vitest + React Testing Library, follow Arrange-Act-Assert
- E2E tests: Playwright with Page Object Model in `e2e/page-objects/`
- Use `data-testid` attributes for E2E selectors

### Database Migrations
- Location: `supabase/migrations/`
- Naming: `YYYYMMDDHHmmss_short_description.sql`
- Always enable RLS on new tables
- Write granular RLS policies (one per operation per role)
