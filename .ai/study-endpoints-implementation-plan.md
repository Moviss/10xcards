# API Endpoint Implementation Plan: Study Session Endpoints

## Spis treści
1. [GET /api/study/session](#1-get-apistudysession)
2. [POST /api/study/review](#2-post-apistudyreview)
3. [Wspólne komponenty](#3-wspólne-komponenty)
4. [Kolejność implementacji](#4-kolejność-implementacji)

---

# 1. GET /api/study/session

## 1.1. Przegląd punktu końcowego

Endpoint zwraca fiszki przygotowane do sesji nauki. Implementuje logikę algorytmu powtórek, która pobiera:
- Wszystkie fiszki wymagające powtórki (gdzie `next_review_date <= CURRENT_DATE`)
- Maksymalnie 20 nowych fiszek (gdzie `last_reviewed_at IS NULL`)

Karty są zwracane w kolejności: najpierw powtórki, następnie nowe karty.

## 1.2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/study/session`
- **Parametry**:
  - **Wymagane**: Brak
  - **Opcjonalne**: Brak
- **Headers**:
  - `Authorization: Bearer <access_token>` (wymagany)
- **Request Body**: Brak

## 1.3. Wykorzystywane typy

Typy już zdefiniowane w `src/types.ts`:

```typescript
// DTO dla pojedynczej fiszki w sesji nauki
interface StudyCardDTO {
  id: string;
  front: string;
  back: string;
  is_new: boolean;
}

// Statystyki sesji nauki
interface StudySessionStatisticsDTO {
  total_cards: number;
  new_cards: number;
  review_cards: number;
}

// Pełna odpowiedź endpointu
interface StudySessionResponseDTO {
  cards: StudyCardDTO[];
  statistics: StudySessionStatisticsDTO;
}
```

## 1.4. Szczegóły odpowiedzi

### Sukces (200 OK)
```json
{
  "cards": [
    {
      "id": "uuid",
      "front": "What is spaced repetition?",
      "back": "A learning technique...",
      "is_new": false
    }
  ],
  "statistics": {
    "total_cards": 25,
    "new_cards": 10,
    "review_cards": 15
  }
}
```

### Błędy
| Kod | Opis | Przykład odpowiedzi |
|-----|------|---------------------|
| 401 | Brak autoryzacji | `{"error": "Unauthorized"}` |
| 500 | Błąd serwera | `{"error": "Błąd serwera"}` |

## 1.5. Przepływ danych

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌────────────┐
│   Klient    │────>│   Endpoint   │────>│  StudyService   │────>│  Supabase  │
│             │     │   (Astro)    │     │                 │     │  (DB)      │
└─────────────┘     └──────────────┘     └─────────────────┘     └────────────┘
      │                    │                      │                     │
      │  GET /session      │                      │                     │
      │  + Bearer token    │                      │                     │
      │───────────────────>│                      │                     │
      │                    │  authenticateRequest │                     │
      │                    │─────────────────────>│                     │
      │                    │                      │  getUser(token)     │
      │                    │                      │────────────────────>│
      │                    │                      │<────────────────────│
      │                    │<─────────────────────│                     │
      │                    │                      │                     │
      │                    │  getStudySession()   │                     │
      │                    │─────────────────────>│                     │
      │                    │                      │  SELECT review cards│
      │                    │                      │────────────────────>│
      │                    │                      │<────────────────────│
      │                    │                      │  SELECT new cards   │
      │                    │                      │  (LIMIT 20)         │
      │                    │                      │────────────────────>│
      │                    │                      │<────────────────────│
      │                    │<─────────────────────│                     │
      │                    │                      │                     │
      │  200 OK + JSON     │                      │                     │
      │<───────────────────│                      │                     │
```

### Logika pobierania kart:

1. **Powtórki**: `SELECT * FROM flashcards WHERE user_id = $1 AND last_reviewed_at IS NOT NULL AND next_review_date <= CURRENT_DATE`
2. **Nowe karty**: `SELECT * FROM flashcards WHERE user_id = $1 AND last_reviewed_at IS NULL LIMIT 20`
3. **Sortowanie**: powtórki pierwsze, następnie nowe karty
4. **Statystyki**: obliczone na podstawie pobranych danych

## 1.6. Względy bezpieczeństwa

1. **Autoryzacja**:
   - Wymagany prawidłowy Bearer token
   - Użycie `authenticateRequest()` z `auth.helper.ts`
   - Automatyczne filtrowanie po `user_id` w zapytaniach

2. **Row Level Security (RLS)**:
   - Supabase RLS zapewnia, że użytkownik widzi tylko swoje fiszki
   - Dodatkowa walidacja `user_id` w service jako defense-in-depth

3. **Brak wrażliwych danych**:
   - Endpoint nie zwraca `ease_factor`, `interval`, `repetitions`
   - Tylko niezbędne pola: `id`, `front`, `back`, `is_new`

## 1.7. Obsługa błędów

| Scenariusz | Kod | Obsługa |
|------------|-----|---------|
| Brak tokenu | 401 | `authenticateRequest()` zwraca `AuthError` |
| Nieprawidłowy token | 401 | `authenticateRequest()` zwraca `AuthError` |
| Token wygasł | 401 | `authenticateRequest()` zwraca `AuthError` |
| Błąd bazy danych | 500 | `StudyServiceError` z `statusCode: 500` |
| Nieoczekiwany błąd | 500 | Catch-all z logowaniem `console.error` |

## 1.8. Wydajność

1. **Optymalizacja zapytań**:
   - Dwa osobne zapytania (powtórki + nowe) zamiast UNION dla lepszej kontroli limitu
   - Indeks na `(user_id, last_reviewed_at, next_review_date)` zalecany

2. **Limity**:
   - Nowe karty: LIMIT 20 (hardcoded zgodnie ze specyfikacją)
   - Powtórki: bez limitu (użytkownik musi przejść wszystkie zaległe)

3. **Rozmiar odpowiedzi**:
   - Minimalna liczba pól w `StudyCardDTO`
   - Brak paginacji (wszystkie karty w jednej odpowiedzi)

## 1.9. Etapy wdrożenia

1. **Utworzenie schematu walidacji** (opcjonalne - endpoint nie przyjmuje parametrów)
   - Plik: `src/lib/schemas/study.schema.ts`
   - Przygotowanie na przyszłe rozszerzenia

2. **Utworzenie klasy błędów**
   - Plik: `src/lib/services/study.service.ts`
   - Klasa: `StudyServiceError extends Error`
   - Właściwość: `statusCode: number`

3. **Implementacja `StudyService.getStudySession()`**
   - Zapytanie 1: powtórki (`next_review_date <= CURRENT_DATE` AND `last_reviewed_at IS NOT NULL`)
   - Zapytanie 2: nowe karty (`last_reviewed_at IS NULL`, LIMIT 20)
   - Mapowanie na `StudyCardDTO[]` z ustawieniem `is_new`
   - Obliczenie `StudySessionStatisticsDTO`
   - Zwrot `StudySessionResponseDTO`

4. **Utworzenie factory function**
   - `createStudyService(supabase: SupabaseClient<Database>): StudyService`

5. **Implementacja endpointu**
   - Plik: `src/pages/api/study/session.ts`
   - Export: `export const GET: APIRoute`
   - Export: `export const prerender = false`
   - Autoryzacja via `authenticateRequest()`
   - Wywołanie `studyService.getStudySession()`
   - Obsługa błędów z `StudyServiceError`

---

# 2. POST /api/study/review

## 2.1. Przegląd punktu końcowego

Endpoint zapisuje odpowiedź użytkownika na fiszkę i aktualizuje parametry algorytmu SM-2 (SuperMemo 2). Na podstawie parametru `remembered` oblicza nowe wartości: `interval`, `ease_factor`, `repetitions`, `next_review_date`.

## 2.2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/study/review`
- **Parametry**:
  - **Wymagane**: Brak (parametry w body)
  - **Opcjonalne**: Brak
- **Headers**:
  - `Authorization: Bearer <access_token>` (wymagany)
  - `Content-Type: application/json` (wymagany)
- **Request Body**:
```json
{
  "flashcard_id": "uuid",
  "remembered": true
}
```

## 2.3. Wykorzystywane typy

Typy już zdefiniowane w `src/types.ts`:

```typescript
// Command model dla request body
interface SubmitReviewCommand {
  flashcard_id: string;
  remembered: boolean;
}

// DTO dla odpowiedzi
interface StudyReviewResponseDTO {
  flashcard_id: string;
  interval: number;
  ease_factor: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string;
}
```

**Nowy typ wewnętrzny (do dodania w service):**

```typescript
// Parametry SM-2 przed i po aktualizacji
interface SM2Parameters {
  interval: number;
  ease_factor: number;
  repetitions: number;
}
```

## 2.4. Szczegóły odpowiedzi

### Sukces (200 OK)
```json
{
  "flashcard_id": "uuid",
  "interval": 6,
  "ease_factor": 2.6,
  "repetitions": 4,
  "next_review_date": "2024-01-21",
  "last_reviewed_at": "2024-01-15T14:30:00Z"
}
```

### Błędy
| Kod | Opis | Przykład odpowiedzi |
|-----|------|---------------------|
| 400 | Nieprawidłowe dane wejściowe | `{"error": "flashcard_id jest wymagane"}` |
| 401 | Brak autoryzacji | `{"error": "Unauthorized"}` |
| 404 | Fiszka nie znaleziona | `{"error": "Fiszka nie została znaleziona"}` |
| 500 | Błąd serwera | `{"error": "Błąd serwera"}` |

## 2.5. Przepływ danych

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌────────────┐
│   Klient    │────>│   Endpoint   │────>│  StudyService   │────>│  Supabase  │
│             │     │   (Astro)    │     │                 │     │  (DB)      │
└─────────────┘     └──────────────┘     └─────────────────┘     └────────────┘
      │                    │                      │                     │
      │  POST /review      │                      │                     │
      │  + Bearer token    │                      │                     │
      │  + JSON body       │                      │                     │
      │───────────────────>│                      │                     │
      │                    │  authenticateRequest │                     │
      │                    │─────────────────────>│                     │
      │                    │<─────────────────────│                     │
      │                    │                      │                     │
      │                    │  Zod validation      │                     │
      │                    │─────────────────────>│                     │
      │                    │<─────────────────────│                     │
      │                    │                      │                     │
      │                    │  submitReview()      │                     │
      │                    │─────────────────────>│                     │
      │                    │                      │  SELECT flashcard   │
      │                    │                      │────────────────────>│
      │                    │                      │<────────────────────│
      │                    │                      │                     │
      │                    │                      │  Calculate SM-2     │
      │                    │                      │  (in-memory)        │
      │                    │                      │                     │
      │                    │                      │  UPDATE flashcard   │
      │                    │                      │────────────────────>│
      │                    │                      │<────────────────────│
      │                    │<─────────────────────│                     │
      │                    │                      │                     │
      │  200 OK + JSON     │                      │                     │
      │<───────────────────│                      │                     │
```

### Algorytm SM-2 (szczegóły):

```typescript
function calculateSM2(current: SM2Parameters, remembered: boolean): SM2Parameters {
  if (remembered) {
    // Użytkownik zapamiętał
    let newInterval: number;
    if (current.repetitions === 0) {
      newInterval = 1;
    } else if (current.repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(current.interval * current.ease_factor);
    }
    
    return {
      interval: newInterval,
      ease_factor: Math.max(2.5, current.ease_factor + 0.1),
      repetitions: current.repetitions + 1,
    };
  } else {
    // Użytkownik nie zapamiętał
    return {
      interval: 1,
      ease_factor: Math.max(1.3, current.ease_factor - 0.2),
      repetitions: 0,
    };
  }
}
```

**Obliczenie `next_review_date`:**
```typescript
next_review_date = CURRENT_DATE + interval (dni)
```

## 2.6. Względy bezpieczeństwa

1. **Autoryzacja**:
   - Wymagany prawidłowy Bearer token
   - Weryfikacja, że fiszka należy do użytkownika (`user_id` match)

2. **Walidacja danych wejściowych**:
   - `flashcard_id`: wymagany, format UUID
   - `remembered`: wymagany, boolean

3. **Ochrona przed manipulacją**:
   - Parametry SM-2 obliczane server-side
   - Klient nie może bezpośrednio modyfikować `interval`, `ease_factor`, `repetitions`

4. **Row Level Security (RLS)**:
   - RLS zapewnia dostęp tylko do własnych fiszek
   - Dodatkowa walidacja w service jako defense-in-depth

## 2.7. Obsługa błędów

| Scenariusz | Kod | Obsługa |
|------------|-----|---------|
| Brak tokenu | 401 | `authenticateRequest()` zwraca `AuthError` |
| Nieprawidłowy token | 401 | `authenticateRequest()` zwraca `AuthError` |
| Brak `flashcard_id` | 400 | Zod validation error |
| Nieprawidłowy format UUID | 400 | Zod validation error |
| Brak `remembered` | 400 | Zod validation error |
| `remembered` nie jest boolean | 400 | Zod validation error |
| Fiszka nie istnieje | 404 | `StudyServiceError` z `statusCode: 404` |
| Fiszka należy do innego użytkownika | 404 | `StudyServiceError` z `statusCode: 404` |
| Błąd bazy danych | 500 | `StudyServiceError` z `statusCode: 500` |
| Nieoczekiwany błąd | 500 | Catch-all z logowaniem `console.error` |

## 2.8. Wydajność

1. **Operacje atomowe**:
   - SELECT + UPDATE w jednej transakcji (Supabase single query)
   - Możliwość użycia `.update().select().single()` dla atomowości

2. **Indeksy**:
   - Primary key na `id` wystarczający dla lookup
   - Indeks na `user_id` dla RLS

3. **Obliczenia**:
   - Algorytm SM-2 wykonywany in-memory (brak obciążenia DB)
   - Proste operacje matematyczne (O(1))

## 2.9. Etapy wdrożenia

1. **Utworzenie schematu walidacji Zod**
   - Plik: `src/lib/schemas/study.schema.ts`
   - Schema: `submitReviewSchema`
   - Walidacja: `flashcard_id` (UUID), `remembered` (boolean)

2. **Implementacja algorytmu SM-2**
   - Plik: `src/lib/services/study.service.ts`
   - Funkcja prywatna: `calculateSM2Parameters()`
   - Pure function bez side effects

3. **Implementacja `StudyService.submitReview()`**
   - Pobierz fiszkę po `flashcard_id` i `user_id`
   - Walidacja istnienia (404 jeśli brak)
   - Oblicz nowe parametry SM-2
   - Oblicz `next_review_date`
   - UPDATE z `.select().single()` dla zwrócenia zaktualizowanych danych
   - Mapowanie na `StudyReviewResponseDTO`

4. **Implementacja endpointu**
   - Plik: `src/pages/api/study/review.ts`
   - Export: `export const POST: APIRoute`
   - Export: `export const prerender = false`
   - Autoryzacja via `authenticateRequest()`
   - Walidacja body via Zod
   - Wywołanie `studyService.submitReview()`
   - Obsługa błędów z `StudyServiceError`

---

# 3. Wspólne komponenty

## 3.1. Nowy plik: `src/lib/schemas/study.schema.ts`

```typescript
import { z } from "zod";

/**
 * Schema walidacji dla POST /api/study/review
 */
export const submitReviewSchema = z.object({
  flashcard_id: z
    .string({
      required_error: "flashcard_id jest wymagane",
      invalid_type_error: "flashcard_id musi być tekstem",
    })
    .uuid({
      message: "flashcard_id musi być prawidłowym UUID",
    }),
  remembered: z.boolean({
    required_error: "remembered jest wymagane",
    invalid_type_error: "remembered musi być wartością boolean",
  }),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
```

## 3.2. Nowy plik: `src/lib/services/study.service.ts`

```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type { Database } from "../db/database.types";
import type {
  StudySessionResponseDTO,
  StudyCardDTO,
  StudyReviewResponseDTO,
  SubmitReviewCommand,
} from "../../types";

export class StudyServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "StudyServiceError";
  }
}

interface SM2Parameters {
  interval: number;
  ease_factor: number;
  repetitions: number;
}

export class StudyService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getStudySession(userId: string): Promise<StudySessionResponseDTO> {
    // Implementation
  }

  async submitReview(
    userId: string,
    command: SubmitReviewCommand
  ): Promise<StudyReviewResponseDTO> {
    // Implementation
  }

  private calculateSM2Parameters(
    current: SM2Parameters,
    remembered: boolean
  ): SM2Parameters {
    // Implementation
  }
}

export function createStudyService(
  supabase: SupabaseClient<Database>
): StudyService {
  return new StudyService(supabase);
}
```

## 3.3. Struktura plików API

```
src/pages/api/study/
├── session.ts    # GET /api/study/session
└── review.ts     # POST /api/study/review
```

---

# 4. Kolejność implementacji

1. **Faza 1: Infrastruktura**
   - [ ] Utworzenie `src/lib/schemas/study.schema.ts`
   - [ ] Utworzenie `src/lib/services/study.service.ts` (szkielet klasy)

2. **Faza 2: GET /api/study/session**
   - [ ] Implementacja `StudyService.getStudySession()`
   - [ ] Utworzenie `src/pages/api/study/session.ts`
   - [ ] Testy manualne

3. **Faza 3: POST /api/study/review**
   - [ ] Implementacja `calculateSM2Parameters()`
   - [ ] Implementacja `StudyService.submitReview()`
   - [ ] Utworzenie `src/pages/api/study/review.ts`
   - [ ] Testy manualne

4. **Faza 4: Weryfikacja**
   - [ ] Przegląd kodu
   - [ ] Testy end-to-end
   - [ ] Dokumentacja API (opcjonalnie)

---

## Podsumowanie

| Endpoint | Metoda | Główne funkcjonalności |
|----------|--------|------------------------|
| `/api/study/session` | GET | Pobieranie fiszek do sesji nauki z podziałem na nowe i do powtórki |
| `/api/study/review` | POST | Zapisywanie odpowiedzi i aktualizacja parametrów SM-2 |

**Kluczowe elementy implementacji:**
- Wykorzystanie istniejących typów z `src/types.ts`
- Nowy service `StudyService` z logiką biznesową
- Nowy schema Zod dla walidacji review
- Zgodność z istniejącymi wzorcami (auth helper, error handling, factory pattern)
