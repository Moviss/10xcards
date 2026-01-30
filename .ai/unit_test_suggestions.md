# Rekomendacje testów jednostkowych - 10xCards

## Elementy warte testowania jednostkowego

### 1. Custom Hooks (najwyższy priorytet)

#### `useGenerator.ts`
- Logika zarządzania stanami propozycji (pending/accepted/rejected)
- Persystencja w localStorage - serializacja/deserializacja
- Liczniki (acceptedCount, pendingCount, rejectedCount)
- Walidacja długości tekstu źródłowego (1000-10000 znaków)

#### `useFlashcards.ts`
- Debouncing wyszukiwania (300ms)
- Logika paginacji (obliczanie stron, boundary checks)
- Transformacja parametrów sortowania do query string

#### `useStudySession.ts`
- Maszyna stanów (idle → loading → ready → studying → completed/interrupted)
- Obliczanie podsumowania sesji (successRate, rememberedCount)
- Logika przechodzenia między kartami

#### `useAuthForm.ts`
- Walidacja Zod schemas (loginSchema, registerSchema)
- Mapowanie błędów serwera na komunikaty użytkownika

### 2. Walidacja i transformacja danych

#### `PasswordRequirements.tsx`
Czysta logika walidacji:
- Sprawdzanie długości
- Wielkie/małe litery
- Cyfry
- Znaki specjalne
- Łatwe do wyizolowania jako pure functions

#### `CharCountTextarea.tsx`
Logika licznika:
- Obliczanie procentu wypełnienia
- Stany walidacji (za mało/ok/za dużo)

#### Generator types (`types.ts`)
- Transformacja `FlashcardProposalDTO` → `ProposalViewModel`
- Filtrowanie propozycji po statusie

### 3. Utility functions

#### `auth.client.ts`
- `getUserEmailFromToken()` - parsowanie JWT payload
- Obsługa błędnych/wygasłych tokenów

### 4. Komponenty z logiką biznesową

#### `ProposalCard.tsx`
- Logika wyświetlania przycisków zależnie od statusu
- Formatowanie tekstu (truncation)

#### `StudyProgress.tsx`
- Obliczanie procentu postępu
- Formatowanie statystyk

---

## Uzasadnienie wyboru

| Element | Uzasadnienie |
|---------|--------------|
| **Hooks** | Zawierają większość logiki biznesowej, są wielokrotnie używane, błędy mają duży wpływ |
| **Walidacja** | Czyste funkcje, łatwe do testowania, krytyczne dla UX i bezpieczeństwa |
| **Transformacje danych** | Deterministyczne, bez side effects, łatwe do izolowania |
| **Maszyny stanów** | Wiele edge cases, trudne do ręcznego testowania wszystkich przejść |

---

## Elementy NIE wymagające unit testów

| Element | Powód |
|---------|-------|
| **Komponenty UI** (`button.tsx`, `dialog.tsx`) | To shadcn/ui - już przetestowane przez twórców biblioteki |
| **Proste komponenty prezentacyjne** (`EmptyState`, `LoadingState`) | Brak logiki biznesowej, tylko renderowanie |
| **Strony Astro** | Lepiej nadają się do testów e2e |
| **Integracje API** | Lepiej testować jako integration tests z mockami |
