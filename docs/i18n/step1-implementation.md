# i18n step 1 implementation (contract-first)

Source plan: `.ai/translations-step1-detailed-plan.md`.

## Implemented artifacts

1. i18n contract constants and helper rules:
   - `src/lib/i18n/contracts.ts`
   - `src/lib/i18n/namespaces.ts`
   - `src/lib/i18n/key-conventions.ts`
   - `src/lib/i18n/glossary.ts`
   - `src/lib/i18n/error-codes.ts`
   - `src/lib/i18n/index.ts`
2. API error DTO contract extension:
   - `src/types.ts` (`ErrorResponseDTO`, `ErrorDetailsDTO`)
3. Contract tests:
   - `src/lib/i18n/contracts.test.ts`
   - `src/lib/i18n/key-conventions.test.ts`
4. Migration inventory mirror for step 2 execution:
   - `docs/i18n/step1-migration-inventory.md`

## Frozen decisions from step 1

1. Supported locales: `pl`, `en`.
2. Fallback locale: `en`.
3. Language source priority: profile > storage > navigator.
4. First-visit rule: `navigator.language` starting with `pl` resolves to `pl`, all others to `en`.
5. Namespaces: `common`, `landing`, `auth`, `generator`, `flashcards`, `study`, `errors`, `validation`.
6. Translation key format: `{module}.{view}.{element}.{type}` with optional CLDR suffix (`_one/_few/_many/_other`).
7. API error contract target: stable `error_code` + optional `details`, mapped to `errors.*` keys.
8. Locale formatting target: `pl-PL` for `pl`, `en-US` for `en`.

## Closed open items (from section G in the source plan)

1. L1 (AI prompt language): out of scope for i18n UI MVP, no change in step 1.
2. L2 (missing error DTO): resolved by adding `ErrorResponseDTO` in `src/types.ts`.
3. Q1 (study summary style): use adaptive translation policy (intent-preserving, not literal sentence mirroring).
4. Q2 (account delete confirmation token): localized token per locale:
   - `pl`: `USUŃ`
   - `en`: `DELETE`

## Risk-to-backlog mapping for step 2

1. R1 (free-text API errors): draft stable catalog added in `src/lib/i18n/error-codes.ts`.
2. R2 (manual pluralization):
   - `src/components/flashcards/Pagination.tsx`
   - `src/components/study/StudyStartScreen.tsx`
3. R3 (hardcoded locale formatting):
   - `src/components/generator/CharCountTextarea.tsx`
   - `src/components/flashcards/FlashcardEditModal.tsx`
4. R4 (tests asserting literal messages):
   - `src/lib/hooks/useAuthForm.test.ts`
   - `src/lib/hooks/useGenerator.test.ts`
   - `src/lib/hooks/useFlashcards.test.ts`
   - `src/lib/hooks/useStudySession.test.ts`

## Definition of ready for step 2

1. Namespace boundaries are explicit in `src/lib/i18n/namespaces.ts`.
2. Key format and validation helpers are available in `src/lib/i18n/key-conventions.ts`.
3. Error code catalog draft exists in `src/lib/i18n/error-codes.ts`.
4. Copy style rules and glossary exist in `src/lib/i18n/glossary.ts`.
5. Tests protect contract drift before runtime rollout.
