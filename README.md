# 10xCards

An AI-powered flashcard generation web application that automates the creation of educational flashcards using artificial intelligence, making spaced repetition learning accessible and efficient.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

10xCards is an MVP (Minimum Viable Product) web application designed to solve the main barrier to using spaced repetition learning methods - the time-consuming process of manually creating flashcards.

The application uses GPT-4o-mini to generate question-answer pairs from user-provided text, then manages the learning process using the proven SM-2 algorithm with a simplified binary rating system (Remember / Don't Remember).

### Key Features

- **AI Flashcard Generation**: Paste text (1,000-10,000 characters) and let AI generate flashcard proposals
- **Staging Area**: Review, edit, accept, or reject AI-generated flashcards before saving
- **Manual Flashcard Creation**: Create custom flashcards with Front/Back format
- **Spaced Repetition Learning**: SM-2 algorithm-based study sessions with optimal review scheduling
- **Flashcard Management**: Full CRUD operations with search and pagination
- **User Authentication**: Email/password authentication with private data access (RLS)
- **Progress Tracking**: Reset learning progress for individual flashcards or entire database

## Tech Stack

### Frontend
- **Astro 5** - Fast, efficient pages with minimal JavaScript
- **React 19** - Interactive components where needed
- **TypeScript 5** - Static typing and IDE support
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn/ui** - Accessible React component library

### Backend
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Supabase Auth** - Built-in user authentication

### AI Integration
- **Openrouter.ai** - Access to multiple AI models (OpenAI, Anthropic, Google) with API cost management

### Testing
- **Vitest** - Unit and integration testing framework
- **React Testing Library** - React component testing
- **MSW (Mock Service Worker)** - API mocking for tests
- **Playwright** - End-to-end testing
- **axe-core** - Accessibility testing

### CI/CD & Hosting
- **GitHub Actions** - CI/CD pipelines
- **DigitalOcean** - Docker-based application hosting

## Getting Started Locally

### Prerequisites

- Node.js 22.14.0 (see `.nvmrc`)
- npm or yarn
- Supabase account (for database and authentication)
- OpenRouter API key (for AI generation)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-4o-mini  # optional, defaults to gpt-4o-mini
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/10xcards.git
   cd 10xcards
   ```

2. Use the correct Node.js version:
   ```bash
   nvm use
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables (see above)

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint checks |
| `npm run lint:fix` | Run ESLint and fix issues |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests in watch mode |
| `npm run test:ui` | Run unit tests with Vitest UI |
| `npm run test:coverage` | Run unit tests with coverage report |
| `npm run test:e2e` | Run E2E tests with Playwright |
| `npm run test:e2e:ui` | Run E2E tests with Playwright UI |

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication forms
│   ├── flashcards/     # Flashcard management components
│   ├── generator/      # AI generation components
│   ├── navigation/     # Navigation components
│   ├── study/          # Study session components
│   └── ui/             # Shadcn/ui components
├── db/                 # Supabase client and database types
├── layouts/            # Astro layouts
├── lib/                # Services, hooks, and utilities
│   ├── hooks/          # Custom React hooks
│   ├── schemas/        # Zod validation schemas
│   └── services/       # Business logic services
├── pages/              # Astro pages and API routes
│   └── api/            # REST API endpoints
├── styles/             # Global CSS styles
└── types.ts            # Shared TypeScript types (DTOs)
```

## Project Scope

### Included in MVP

- User registration and authentication (email/password)
- AI-powered flashcard generation from text input
- Staging area for reviewing AI proposals
- Manual flashcard creation
- Full flashcard management (CRUD)
- SM-2 spaced repetition algorithm
- Binary rating system (Remember / Don't Remember)
- Session limit of 20 new flashcards per study session
- Learning progress reset functionality
- Generation analytics logging
- Responsive design optimized for mobile learning

### Not Included in MVP

- File format support (PDF, DOCX, images)
- Advanced algorithms (SuperMemo 17+, Anki FSRS)
- Tags, folders, or categorization system
- Deck sharing between users
- Native mobile applications
- Rich text formatting (bold, lists, math formulas)
- Duplicate detection
- Offline mode

## Project Status

**Current Version**: 0.0.1

This project is currently in closed beta (invite-only access).

### Success Metrics

- **AI Acceptance Rate**: Target 75% of AI-generated flashcards accepted without edits
- **AI Adoption Rate**: Target 75% of all flashcards generated by AI

## License

This project is proprietary software. All rights reserved.
