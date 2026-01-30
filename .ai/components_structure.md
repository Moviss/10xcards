# Struktura komponentów i zależności - 10xCards

## Ogólny diagram architektury

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ASTRO PAGES                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐  ┌────────────┐  ┌──────────┐     │
│  │ index    │  │ login    │  │ register    │  │ generator  │  │flashcards│     │
│  │ .astro   │  │ .astro   │  │ .astro      │  │ .astro     │  │ .astro   │     │
│  └────┬─────┘  └────┬─────┘  └──────┬──────┘  └─────┬──────┘  └────┬─────┘     │
│       │             │               │               │              │           │
│       │             │               │               │              │           │
│  ┌────▼─────┐  ┌────▼─────┐  ┌──────▼──────┐       │              │           │
│  │Landing   │  │Login     │  │Register     │       │              │  ┌──────┐ │
│  │Page.astro│  │Form.tsx  │  │Form.tsx     │       │              │  │study │ │
│  └──────────┘  └──────────┘  └─────────────┘       │              │  │.astro│ │
│                                                     │              │  └──┬───┘ │
└─────────────────────────────────────────────────────┼──────────────┼─────┼─────┘
                                                      │              │     │
┌─────────────────────────────────────────────────────┼──────────────┼─────┼─────┐
│                        LAYOUTS                      │              │     │     │
├─────────────────────────────────────────────────────┼──────────────┼─────┼─────┤
│                                                     │              │     │     │
│  ┌──────────────────┐    ┌───────────────────────────────────────────────────┐ │
│  │  Layout.astro    │    │           AuthenticatedLayout.astro               │ │
│  │  (bazowy HTML)   │    │  ┌────────────────┐  ┌─────────────────────────┐  │ │
│  └──────────────────┘    │  │ Navigation.tsx │  │ GlobalToaster.tsx       │  │ │
│                          │  └───────┬────────┘  └─────────────────────────┘  │ │
│                          └──────────┼────────────────────────────────────────┘ │
└─────────────────────────────────────┼──────────────────────────────────────────┘
                                      │
                                      ▼
```

## Hierarchia komponentów nawigacji

```
Navigation.tsx
├── useNavigation (hook)
├── getUserEmailFromToken (auth.client)
│
├──► TopNav.tsx (desktop: hidden md:flex)
│    ├── NavLinks.tsx
│    │   └── [/generator, /flashcards, /study]
│    │
│    └── AccountDropdown.tsx
│        ├── DropdownMenu (Radix)
│        ├── userEmail display
│        ├── Logout action
│        └── Delete account action
│
├──► MobileNav.tsx (mobile: md:hidden)
│    ├── Sheet (Radix)
│    ├── MobileNavHeader.tsx
│    ├── NavLinks.tsx
│    └── Separator
│
└──► DeleteAccountDialog.tsx
     └── AlertDialog (Radix)
```

## Hierarchia komponentów autoryzacji

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AUTH COMPONENTS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   LoginForm.tsx                    RegisterForm.tsx                 │
│   ├── useAuthForm(loginSchema)     ├── useAuthForm(registerSchema)  │
│   ├── Input (ui)                   ├── Input (ui)                   │
│   ├── Label (ui)                   ├── Label (ui)                   │
│   ├── Button (ui)                  ├── Button (ui)                  │
│   └── Link to /register            └── PasswordRequirements.tsx     │
│                                        ├── length check             │
│                                        ├── uppercase check          │
│                                        ├── lowercase check          │
│                                        ├── number check             │
│                                        └── special char check       │
└─────────────────────────────────────────────────────────────────────┘
```

## Hierarchia komponentów generatora

```
GeneratorContainer.tsx
│
├── useGenerator (hook)
│   ├── localStorage persistence
│   ├── proposals state management
│   └── API: POST /api/generations
│
├──► SourceTextForm.tsx
│    ├── CharCountTextarea.tsx
│    │   ├── Textarea (ui)
│    │   ├── char counter (min: 1000, max: 10000)
│    │   └── progress bar
│    │
│    └── Button "Generuj fiszki"
│
├──► GenerationLoader.tsx (when isGenerating)
│    ├── 0-2s: Spinner
│    ├── 2-5s: Skeleton placeholders
│    └── 5s+: Long wait message
│
├──► StagingArea.tsx (when proposals exist)
│    │
│    ├── BulkActions.tsx
│    │   ├── "Akceptuj wszystkie"
│    │   └── "Odrzuć wszystkie"
│    │
│    ├── ProposalCard.tsx[] (grid)
│    │   ├── front/back display
│    │   ├── status badge (pending/accepted/rejected)
│    │   ├── edited indicator
│    │   ├── Accept button
│    │   ├── Reject button
│    │   └── Edit button
│    │
│    └── Button "Zapisz zaakceptowane (n)"
│
└──► ProposalEditModal.tsx
     ├── Dialog (ui)
     ├── front Textarea
     ├── back Textarea
     └── Save/Cancel buttons
```

## Hierarchia komponentów fiszek

```
FlashcardsContainer.tsx
│
├── useFlashcards (hook)
│   ├── search (debounced 300ms)
│   ├── sort (created_at, updated_at, next_review_date)
│   ├── pagination
│   └── CRUD operations
│
├──► FlashcardsHeader.tsx
│    ├── Title: "Moje Fiszki"
│    └── Button "Dodaj fiszkę" (Plus icon)
│
├──► FlashcardsToolbar.tsx
│    ├── SearchInput.tsx
│    │   ├── Input with debounce
│    │   └── Clear button
│    │
│    └── SortSelect.tsx
│        ├── Select (Radix)
│        └── sort field + order
│
├──► FlashcardsContent.tsx
│    │
│    ├── LoadingState.tsx (if loading)
│    │   └── Skeleton[]
│    │
│    ├── EmptyState.tsx (if empty)
│    │   ├── hasSearchQuery → "Brak wyników"
│    │   └── !hasSearchQuery → "Dodaj pierwszą fiszkę"
│    │
│    ├── FlashcardsTable.tsx (desktop: hidden md:table)
│    │   └── FlashcardTableRow.tsx[]
│    │       ├── front (truncated)
│    │       ├── back (truncated)
│    │       └── source badge
│    │
│    └── FlashcardCardList.tsx (mobile: md:hidden)
│        └── FlashcardCard.tsx[]
│            ├── front preview
│            ├── back preview
│            └── AI badge (if ai_generated)
│
├──► Pagination.tsx
│    ├── Previous button
│    ├── Page info
│    └── Next button
│
├──► FlashcardAddModal.tsx
│    ├── Dialog (ui)
│    ├── front Textarea
│    ├── back Textarea
│    └── validation + save
│
└──► FlashcardEditModal.tsx
     ├── Dialog (ui)
     ├── front/back edit
     ├── Info section:
     │   ├── source (AI/manual)
     │   ├── created_at
     │   ├── repetitions
     │   ├── interval
     │   ├── ease_factor
     │   └── next_review_date
     │
     ├── Reset progress button
     │   └── ConfirmDialog.tsx
     │
     └── Delete button
         └── ConfirmDialog.tsx
```

## Hierarchia komponentów nauki

```
StudyContainer.tsx
│
├── useStudySession (hook)
│   ├── session state machine
│   ├── keyboard shortcuts
│   │   ├── Space: reveal
│   │   ├── Enter: remembered
│   │   ├── Backspace: forgotten
│   │   └── Escape: interrupt
│   │
│   └── API: /api/study/session, /api/study/review
│
├──► EmptyState.tsx (if no cards to study)
│    ├── hasAnyFlashcards → "Wszystko powtórzone!"
│    └── !hasAnyFlashcards → "Dodaj fiszki"
│
├──► StudyStartScreen.tsx (status: ready)
│    ├── Statistics display
│    │   ├── due cards
│    │   └── new cards
│    │
│    └── Button "Rozpocznij sesję"
│
├──► StudyFlashcard.tsx (status: studying)
│    │
│    ├── Card front (always visible)
│    │   ├── question text
│    │   └── "New" badge (if is_new)
│    │
│    ├── Card back (if revealed)
│    │   └── answer text with fade-in
│    │
│    └── AnswerButtons.tsx (if revealed)
│        ├── Button "Nie pamiętam" (X, destructive)
│        └── Button "Pamiętam" (Check, success)
│
├──► StudyProgress.tsx
│    ├── Progress bar
│    ├── current / total
│    ├── remembered count (green)
│    └── forgotten count (red)
│
├──► InterruptButton.tsx
│    └── Button "Przerwij"
│
└──► StudySummary.tsx (status: completed/interrupted)
     ├── total reviewed
     ├── new cards reviewed
     ├── review cards reviewed
     ├── remembered count
     ├── forgotten count
     ├── success rate %
     │
     └── Button "Zakończ" → /flashcards
```

## Komponenty UI (shadcn/ui + Radix)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UI COMPONENTS (src/components/ui)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  button.tsx │  │  input.tsx  │  │ textarea.tsx│  │  label.tsx │ │
│  │  (CVA)      │  │  (Radix)    │  │  (Radix)    │  │  (Radix)   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ dialog.tsx  │  │alert-dialog │  │ dropdown-   │  │ select.tsx │ │
│  │  (Radix)    │  │  .tsx       │  │ menu.tsx    │  │  (Radix)   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ sheet.tsx   │  │ progress.tsx│  │skeleton.tsx │  │ sonner.tsx │ │
│  │ (sidebar)   │  │  (Radix)    │  │ (loader)    │  │  (toast)   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                     │
│  ┌─────────────┐                                                    │
│  │separator.tsx│                                                    │
│  │  (Radix)    │                                                    │
│  └─────────────┘                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Hooki i przepływ danych

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOM HOOKS                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  useAuthForm.ts                                                     │
│  ├── Generic auth hook                                              │
│  ├── Zod validation                                                 │
│  ├── API: POST /api/auth/login, /api/auth/register                  │
│  └── JWT token storage (sessionStorage)                             │
│                                                                     │
│  useNavigation.ts                                                   │
│  ├── Logout/delete account state                                    │
│  ├── Mobile menu state                                              │
│  ├── API: POST /api/auth/logout, DELETE /api/auth/account           │
│  └── Token clearing + redirect                                      │
│                                                                     │
│  useGenerator.ts                                                    │
│  ├── Source text + proposals state                                  │
│  ├── localStorage persistence                                       │
│  ├── Timer for generation elapsed time                              │
│  ├── API: POST /api/generations                                     │
│  └── API: POST /api/flashcards/batch                                │
│                                                                     │
│  useFlashcards.ts                                                   │
│  ├── Flashcards list + pagination                                   │
│  ├── Search (debounced) + sort                                      │
│  ├── CRUD modal states                                              │
│  ├── API: GET/POST /api/flashcards                                  │
│  ├── API: PUT/DELETE /api/flashcards/{id}                           │
│  └── API: POST /api/flashcards/{id}/reset-progress                  │
│                                                                     │
│  useStudySession.ts                                                 │
│  ├── Session state machine                                          │
│  ├── Progress tracking                                              │
│  ├── Local answer records                                           │
│  ├── API: GET /api/study/session                                    │
│  └── API: POST /api/study/review                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Przepływ danych - Generator

```
                    ┌──────────────────┐
                    │   User Input     │
                    │ (source text)    │
                    └────────┬─────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                     SourceTextForm.tsx                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  CharCountTextarea.tsx                                       │  │
│  │  ├── validate: 1000 <= length <= 10000                       │  │
│  │  └── progress bar visualization                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────────────┘
                              │ onSubmit
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   useGenerator.ts                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  POST /api/generations                                        │  │
│  │  ├── request: { source_text }                                 │  │
│  │  └── response: { generation_log_id, flashcard_proposals[] }   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  localStorage.setItem("generator_state", {                    │  │
│  │    sourceText,                                                │  │
│  │    generationLogId,                                           │  │
│  │    proposals: [ { id, front, back, status, isEdited } ]       │  │
│  │  })                                                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      StagingArea.tsx                                │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ ProposalCard    │  │ ProposalCard    │  │ ProposalCard    │     │
│  │ status: pending │  │ status: accepted│  │ status: rejected│     │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │     │
│  │ │ Accept  │ E │ │  │ │   Undo      │ │  │ │   Undo      │ │     │
│  │ │ Reject  │ d │ │  │ └─────────────┘ │  │ └─────────────┘ │     │
│  │ └─────────────┘ │  └─────────────────┘  └─────────────────┘     │
│  └─────────────────┘                                                │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Button: "Zapisz zaakceptowane (n)"                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ onSave
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  POST /api/flashcards/batch                                         │
│  ├── request: { generation_log_id, flashcards[] }                   │
│  └── response: { created_count }                                    │
│                              │                                      │
│                              ▼                                      │
│  localStorage.removeItem("generator_state")                         │
│  toast.success("Zapisano n fiszek!")                                │
└─────────────────────────────────────────────────────────────────────┘
```

## Przepływ danych - Sesja nauki

```
                    ┌──────────────────┐
                    │   /study page    │
                    └────────┬─────────┘
                             │ mount
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   useStudySession.ts                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  GET /api/study/session                                       │  │
│  │  └── response: { statistics, flashcards[] }                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌────────────┐  ┌────────────┐  ┌────────────────┐
     │status:empty│  │status:ready│  │status:studying │
     │EmptyState  │  │StartScreen │  │StudyFlashcard  │
     └────────────┘  └─────┬──────┘  └───────┬────────┘
                           │                 │
                           │ startSession    │ keyboard/click
                           ▼                 ▼
              ┌─────────────────────────────────────────┐
              │         STUDY LOOP                      │
              │                                         │
              │  ┌───────────────────────────────────┐  │
              │  │ currentCard = flashcards[index]   │  │
              │  └───────────────────────────────────┘  │
              │                  │                      │
              │                  ▼                      │
              │  ┌───────────────────────────────────┐  │
              │  │ Space → revealCard()              │  │
              │  └───────────────────────────────────┘  │
              │                  │                      │
              │                  ▼                      │
              │  ┌───────────────────────────────────┐  │
              │  │ Enter → submitAnswer(true)        │  │
              │  │ Backspace → submitAnswer(false)   │  │
              │  └───────────────────────────────────┘  │
              │                  │                      │
              │                  ▼                      │
              │  ┌───────────────────────────────────┐  │
              │  │ POST /api/study/review            │  │
              │  │ (fire-and-forget)                 │  │
              │  └───────────────────────────────────┘  │
              │                  │                      │
              │                  ▼                      │
              │  ┌───────────────────────────────────┐  │
              │  │ index < total ? next : complete   │  │
              │  └───────────────────────────────────┘  │
              │                                         │
              └─────────────────┬───────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────────┐
              │          StudySummary.tsx               │
              │  ├── totalReviewed                      │
              │  ├── newCardsReviewed                   │
              │  ├── reviewCardsReviewed                │
              │  ├── rememberedCount                    │
              │  ├── forgottenCount                     │
              │  └── successRate %                      │
              │                                         │
              │  Button: "Zakończ" → /flashcards        │
              └─────────────────────────────────────────┘
```

## Struktura katalogów

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── PasswordRequirements.tsx
│   │   └── types.ts
│   │
│   ├── flashcards/
│   │   ├── FlashcardsContainer.tsx      (main)
│   │   ├── FlashcardsHeader.tsx
│   │   ├── FlashcardsToolbar.tsx
│   │   ├── FlashcardsContent.tsx
│   │   ├── FlashcardsTable.tsx
│   │   ├── FlashcardTableRow.tsx
│   │   ├── FlashcardCardList.tsx
│   │   ├── FlashcardCard.tsx
│   │   ├── SearchInput.tsx
│   │   ├── SortSelect.tsx
│   │   ├── Pagination.tsx
│   │   ├── FlashcardAddModal.tsx
│   │   ├── FlashcardEditModal.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── LoadingState.tsx
│   │   ├── EmptyState.tsx
│   │   └── types.ts
│   │
│   ├── generator/
│   │   ├── GeneratorContainer.tsx       (main)
│   │   ├── SourceTextForm.tsx
│   │   ├── CharCountTextarea.tsx
│   │   ├── StagingArea.tsx
│   │   ├── ProposalCard.tsx
│   │   ├── ProposalEditModal.tsx
│   │   ├── BulkActions.tsx
│   │   ├── GenerationLoader.tsx
│   │   └── types.ts
│   │
│   ├── landing/
│   │   ├── LandingPage.astro
│   │   ├── HeroSection.astro
│   │   ├── FeaturesSection.astro
│   │   ├── FeatureCard.astro
│   │   └── CTAButtons.tsx
│   │
│   ├── navigation/
│   │   ├── Navigation.tsx               (main)
│   │   ├── TopNav.tsx
│   │   ├── MobileNav.tsx
│   │   ├── MobileNavHeader.tsx
│   │   ├── NavLinks.tsx
│   │   ├── AccountDropdown.tsx
│   │   └── DeleteAccountDialog.tsx
│   │
│   ├── study/
│   │   ├── StudyContainer.tsx           (main)
│   │   ├── StudyStartScreen.tsx
│   │   ├── StudyFlashcard.tsx
│   │   ├── StudyProgress.tsx
│   │   ├── AnswerButtons.tsx
│   │   ├── StudySummary.tsx
│   │   ├── InterruptButton.tsx
│   │   ├── EmptyState.tsx
│   │   └── types.ts
│   │
│   ├── ui/                              (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── label.tsx
│   │   ├── dialog.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── progress.tsx
│   │   ├── skeleton.tsx
│   │   ├── separator.tsx
│   │   └── sonner.tsx
│   │
│   ├── GlobalToaster.tsx
│   └── Welcome.astro
│
├── layouts/
│   ├── Layout.astro                     (base HTML)
│   └── AuthenticatedLayout.astro        (with Navigation)
│
├── lib/
│   ├── hooks/
│   │   ├── useAuthForm.ts
│   │   ├── useNavigation.ts
│   │   ├── useGenerator.ts
│   │   ├── useFlashcards.ts
│   │   └── useStudySession.ts
│   │
│   └── auth.client.ts                   (JWT utils)
│
└── pages/
    ├── index.astro
    ├── login.astro
    ├── register.astro
    ├── generator.astro
    ├── flashcards.astro
    ├── study.astro
    └── api/
        ├── auth/
        ├── flashcards/
        ├── generations/
        └── study/
```

## Zewnętrzne zależności

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL DEPENDENCIES                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FRAMEWORK                                                          │
│  ├── astro                    (SSG/SSR framework)                   │
│  └── @astrojs/react           (React integration)                   │
│                                                                     │
│  UI LIBRARY                                                         │
│  ├── @radix-ui/*              (accessible primitives)               │
│  │   ├── dialog               (modals)                              │
│  │   ├── alert-dialog         (confirmations)                       │
│  │   ├── dropdown-menu        (dropdowns)                           │
│  │   ├── select               (selects)                             │
│  │   ├── progress             (progress bars)                       │
│  │   ├── separator            (dividers)                            │
│  │   └── label                (form labels)                         │
│  │                                                                  │
│  └── class-variance-authority (CVA for button variants)             │
│                                                                     │
│  STYLING                                                            │
│  └── tailwindcss              (utility-first CSS)                   │
│                                                                     │
│  ICONS                                                              │
│  └── lucide-react             (icon library)                        │
│                                                                     │
│  NOTIFICATIONS                                                      │
│  └── sonner                   (toast notifications)                 │
│                                                                     │
│  VALIDATION                                                         │
│  └── zod                      (schema validation)                   │
│                                                                     │
│  BACKEND                                                            │
│  └── @supabase/supabase-js    (database + auth)                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```
