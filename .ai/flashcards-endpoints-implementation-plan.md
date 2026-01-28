# API Endpoint Implementation Plan: Flashcards Endpoints

## Spis treści

1. [GET /api/flashcards](#1-get-apiflashcards)
2. [GET /api/flashcards/:id](#2-get-apiflashcardsid)
3. [POST /api/flashcards](#3-post-apiflashcards)
4. [POST /api/flashcards/batch](#4-post-apiflashcardsbatch)
5. [PUT /api/flashcards/:id](#5-put-apiflashcardsid)
6. [DELETE /api/flashcards/:id](#6-delete-apiflashcardsid)
7. [POST /api/flashcards/:id/reset-progress](#7-post-apiflashcardsidresetprogress)
8. [Wspólne komponenty](#8-wspólne-komponenty)
9. [Struktura plików](#9-struktura-plików)

---

## 1. GET /api/flashcards

### 1.1 Przegląd punktu końcowego

Endpoint zwraca paginowaną listę fiszek należących do uwierzytelnionego użytkownika. Wspiera wyszukiwanie tekstowe, sortowanie i filtrowanie.

### 1.2 Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/flashcards`
- **Headers**: `Authorization: Bearer <access_token>`

#### Parametry Query

| Parametr | Typ | Wymagany | Domyślnie | Ograniczenia |
|----------|-----|----------|-----------|--------------|
| `page` | integer | Nie | 1 | >= 1 |
| `limit` | integer | Nie | 20 | 1-100 |
| `search` | string | Nie | - | Wyszukiwanie w front/back |
| `sort` | string | Nie | `created_at` | `created_at`, `updated_at`, `next_review_date` |
| `order` | string | Nie | `desc` | `asc`, `desc` |

### 1.3 Wykorzystywane typy

```typescript
// Z src/types.ts - już zdefiniowane
import type {
  FlashcardListItemDTO,
  FlashcardsListResponseDTO,
  FlashcardsQueryParams,
  PaginationDTO
} from "../../types";
```

### 1.4 Szczegóły odpowiedzi

**Sukces (200 OK)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "front": "What is spaced repetition?",
      "back": "A learning technique...",
      "is_ai_generated": true,
      "interval": 4,
      "ease_factor": 2.5,
      "repetitions": 3,
      "next_review_date": "2024-01-20",
      "last_reviewed_at": "2024-01-16T14:30:00Z",
      "created_at": "2024-01-10T09:00:00Z",
      "updated_at": "2024-01-16T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### 1.5 Przepływ danych

```
Request → Auth Middleware → Query Validation → FlashcardService.getFlashcards()
                                                      ↓
                                            Supabase Query Builder
                                                      ↓
                                            - Filtrowanie po user_id (RLS)
                                            - Opcjonalne wyszukiwanie (ILIKE)
                                            - Sortowanie
                                            - Paginacja (range)
                                            - Zliczanie total
                                                      ↓
                                            FlashcardsListResponseDTO
```

**Zapytanie Supabase**:
```typescript
// Bazowe zapytanie z filtrowaniem
let query = supabase
  .from('flashcards')
  .select('id, front, back, is_ai_generated, interval, ease_factor, repetitions, next_review_date, last_reviewed_at, created_at, updated_at', { count: 'exact' });

// Wyszukiwanie (jeśli podano)
if (search) {
  query = query.or(`front.ilike.%${search}%,back.ilike.%${search}%`);
}

// Sortowanie i paginacja
query = query
  .order(sort, { ascending: order === 'asc' })
  .range(offset, offset + limit - 1);
```

### 1.6 Względy bezpieczeństwa

- **Autoryzacja**: Token Bearer wymagany, weryfikacja przez Supabase Auth
- **Izolacja danych**: RLS w Supabase automatycznie filtruje po `user_id`
- **Walidacja parametrów**: Zod schema dla wszystkich query params
- **SQL Injection**: Parametryzowane zapytania przez Supabase SDK

### 1.7 Obsługa błędów

| Scenariusz | Kod HTTP | Odpowiedź |
|------------|----------|-----------|
| Brak tokenu | 401 | `{ "error": "Unauthorized" }` |
| Nieprawidłowy token | 401 | `{ "error": "Unauthorized" }` |
| Nieprawidłowy `page` (< 1) | 400 | `{ "error": "Parametr page musi być >= 1" }` |
| Nieprawidłowy `limit` (> 100) | 400 | `{ "error": "Parametr limit nie może przekraczać 100" }` |
| Nieprawidłowy `sort` | 400 | `{ "error": "Parametr sort musi być jednym z: created_at, updated_at, next_review_date" }` |
| Nieprawidłowy `order` | 400 | `{ "error": "Parametr order musi być jednym z: asc, desc" }` |
| Błąd bazy danych | 500 | `{ "error": "Błąd serwera" }` |

### 1.8 Rozważania dotyczące wydajności

- **Indeksy**: Upewnić się, że istnieją indeksy na `user_id`, `created_at`, `updated_at`, `next_review_date`
- **Indeks GIN dla wyszukiwania**: Rozważyć pg_trgm dla wyszukiwania ILIKE
- **Limit wyników**: Maksymalnie 100 rekordów na stronę

### 1.9 Kroki implementacji

1. Utworzyć schemat walidacji Zod w `src/lib/schemas/flashcard.schema.ts`
2. Dodać metodę `getFlashcards()` w `FlashcardService`
3. Utworzyć endpoint w `src/pages/api/flashcards/index.ts`
4. Zaimplementować obsługę wyszukiwania z ILIKE
5. Dodać testy jednostkowe i integracyjne

---

## 2. GET /api/flashcards/:id

### 2.1 Przegląd punktu końcowego

Endpoint zwraca szczegóły pojedynczej fiszki na podstawie jej ID. Zwraca wszystkie pola, w tym oryginalne treści i referencję do logu generowania.

### 2.2 Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/flashcards/[id]`
- **Headers**: `Authorization: Bearer <access_token>`

#### Parametry URL

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | UUID | Tak | Identyfikator fiszki |

### 2.3 Wykorzystywane typy

```typescript
// Z src/types.ts - już zdefiniowane
import type { FlashcardDetailDTO } from "../../types";
```

### 2.4 Szczegóły odpowiedzi

**Sukces (200 OK)**:
```json
{
  "id": "uuid",
  "front": "What is spaced repetition?",
  "back": "A learning technique...",
  "original_front": "What is spaced repetition?",
  "original_back": "A learning technique...",
  "is_ai_generated": true,
  "generation_log_id": "uuid",
  "interval": 4,
  "ease_factor": 2.5,
  "repetitions": 3,
  "next_review_date": "2024-01-20",
  "last_reviewed_at": "2024-01-16T14:30:00Z",
  "created_at": "2024-01-10T09:00:00Z",
  "updated_at": "2024-01-16T14:30:00Z"
}
```

### 2.5 Przepływ danych

```
Request → Auth Middleware → UUID Validation → FlashcardService.getFlashcardById()
                                                      ↓
                                            Supabase: SELECT * WHERE id = :id
                                                      ↓
                                            RLS automatycznie sprawdza user_id
                                                      ↓
                                            FlashcardDetailDTO | 404
```

### 2.6 Względy bezpieczeństwa

- **Autoryzacja**: Token Bearer wymagany
- **Własność zasobu**: RLS w Supabase zapewnia, że użytkownik widzi tylko swoje fiszki
- **Walidacja UUID**: Sprawdzenie formatu UUID przed zapytaniem do bazy

### 2.7 Obsługa błędów

| Scenariusz | Kod HTTP | Odpowiedź |
|------------|----------|-----------|
| Brak tokenu | 401 | `{ "error": "Unauthorized" }` |
| Nieprawidłowy format UUID | 400 | `{ "error": "Nieprawidłowy format identyfikatora" }` |
| Fiszka nie istnieje | 404 | `{ "error": "Flashcard not found" }` |
| Fiszka należy do innego użytkownika | 404 | `{ "error": "Flashcard not found" }` |
| Błąd bazy danych | 500 | `{ "error": "Błąd serwera" }` |

### 2.8 Rozważania dotyczące wydajności

- **Pojedyncze zapytanie**: Tylko jeden rekord, brak problemów z wydajnością
- **Indeks PK**: Zapytanie po `id` (PRIMARY KEY) jest zoptymalizowane

### 2.9 Kroki implementacji

1. Dodać schemat walidacji UUID w `src/lib/schemas/flashcard.schema.ts`
2. Dodać metodę `getFlashcardById()` w `FlashcardService`
3. Utworzyć endpoint w `src/pages/api/flashcards/[id]/index.ts`
4. Obsłużyć przypadek 404 gdy fiszka nie istnieje lub nie należy do użytkownika

---

## 3. POST /api/flashcards

### 3.1 Przegląd punktu końcowego

Endpoint tworzy nową fiszkę manualnie (nie generowaną przez AI). Ustawia `is_ai_generated = false` i domyślne wartości algorytmu SM-2.

### 3.2 Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards`
- **Headers**: 
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

#### Request Body

```json
{
  "front": "What is the capital of France?",
  "back": "Paris"
}
```

| Pole | Typ | Wymagany | Ograniczenia |
|------|-----|----------|--------------|
| `front` | string | Tak | Niepuste po trimie |
| `back` | string | Tak | Niepuste po trimie |

### 3.3 Wykorzystywane typy

```typescript
// Z src/types.ts - już zdefiniowane
import type {
  CreateFlashcardCommand,
  FlashcardCreateResponseDTO
} from "../../types";
```

### 3.4 Szczegóły odpowiedzi

**Sukces (201 Created)**:
```json
{
  "id": "uuid",
  "front": "What is the capital of France?",
  "back": "Paris",
  "is_ai_generated": false,
  "interval": 0,
  "ease_factor": 2.5,
  "repetitions": 0,
  "next_review_date": "2024-01-15",
  "last_reviewed_at": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 3.5 Przepływ danych

```
Request → Auth Middleware → Body Validation → FlashcardService.createFlashcard()
                                                      ↓
                                            Supabase INSERT:
                                            - user_id (z tokenu)
                                            - front, back (z body)
                                            - is_ai_generated = false
                                            - domyślne SM-2: interval=0, ease_factor=2.5, repetitions=0
                                            - next_review_date = CURRENT_DATE
                                                      ↓
                                            RETURNING → FlashcardCreateResponseDTO
```

### 3.6 Względy bezpieczeństwa

- **Autoryzacja**: Token Bearer wymagany, `user_id` pobierany z tokenu (nie z body)
- **Walidacja**: Zod schema sprawdza niepuste `front` i `back` po trimie
- **XSS**: Dane przechowywane as-is, escape'owanie przy wyświetlaniu (frontend)

### 3.7 Obsługa błędów

| Scenariusz | Kod HTTP | Odpowiedź |
|------------|----------|-----------|
| Brak tokenu | 401 | `{ "error": "Unauthorized" }` |
| Nieprawidłowy JSON | 400 | `{ "error": "Nieprawidłowy format JSON" }` |
| Brak pola `front` | 400 | `{ "error": "Pole front jest wymagane" }` |
| Brak pola `back` | 400 | `{ "error": "Pole back jest wymagane" }` |
| Puste `front` (po trimie) | 400 | `{ "error": "Pole front nie może być puste" }` |
| Puste `back` (po trimie) | 400 | `{ "error": "Pole back nie może być puste" }` |
| Błąd bazy danych | 500 | `{ "error": "Błąd serwera" }` |

### 3.8 Rozważania dotyczące wydajności

- **Pojedynczy INSERT**: Operacja atomowa, szybka
- **RETURNING**: Eliminuje potrzebę dodatkowego SELECT

### 3.9 Kroki implementacji

1. Utworzyć schemat walidacji `createFlashcardSchema` w `src/lib/schemas/flashcard.schema.ts`
2. Dodać metodę `createFlashcard()` w `FlashcardService`
3. Dodać handler POST w `src/pages/api/flashcards/index.ts`
4. Ustawić domyślne wartości SM-2 przy insercie

---

## 4. POST /api/flashcards/batch

### 4.1 Przegląd punktu końcowego

Endpoint tworzy wiele fiszek jednocześnie z wyników generowania AI. Aktualizuje statystyki w `generation_logs` (accepted_unedited_count, accepted_edited_count, rejected_count).

### 4.2 Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards/batch`
- **Headers**: 
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

#### Request Body

```json
{
  "generation_log_id": "uuid",
  "flashcards": [
    {
      "front": "What is SM-2?",
      "back": "A spaced repetition algorithm...",
      "original_front": "What is SM-2?",
      "original_back": "A spaced repetition algorithm...",
      "is_edited": false
    },
    {
      "front": "What is the forgetting curve?",
      "back": "A hypothesis that describes...",
      "original_front": "What is the forgeting curve?",
      "original_back": "A hypothesis describing...",
      "is_edited": true
    }
  ],
  "rejected_count": 2
}
```

| Pole | Typ | Wymagany | Ograniczenia |
|------|-----|----------|--------------|
| `generation_log_id` | UUID | Tak | Musi istnieć i należeć do użytkownika |
| `flashcards` | array | Tak | Tablica obiektów BatchFlashcardItem |
| `flashcards[].front` | string | Tak | Niepuste po trimie |
| `flashcards[].back` | string | Tak | Niepuste po trimie |
| `flashcards[].original_front` | string | Tak | Oryginalna treść AI |
| `flashcards[].original_back` | string | Tak | Oryginalna treść AI |
| `flashcards[].is_edited` | boolean | Tak | Czy użytkownik edytował |
| `rejected_count` | integer | Tak | Liczba odrzuconych propozycji >= 0 |

### 4.3 Wykorzystywane typy

```typescript
// Z src/types.ts - już zdefiniowane
import type {
  CreateFlashcardsBatchCommand,
  BatchFlashcardItem,
  FlashcardsBatchResponseDTO,
  FlashcardBatchItemDTO
} from "../../types";
```

### 4.4 Szczegóły odpowiedzi

**Sukces (201 Created)**:
```json
{
  "created_count": 2,
  "flashcards": [
    {
      "id": "uuid",
      "front": "What is SM-2?",
      "back": "A spaced repetition algorithm...",
      "is_ai_generated": true,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid",
      "front": "What is the forgetting curve?",
      "back": "A hypothesis that describes...",
      "is_ai_generated": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 4.5 Przepływ danych

```
Request → Auth Middleware → Body Validation → FlashcardService.createFlashcardsBatch()
                                                      ↓
                                            1. Weryfikacja generation_log_id
                                               (SELECT WHERE id = :id AND user_id = :user_id)
                                                      ↓
                                            2. INSERT flashcards (bulk):
                                               - user_id (z tokenu)
                                               - generation_log_id
                                               - is_ai_generated = true
                                               - front, back, original_front, original_back
                                                      ↓
                                            3. UPDATE generation_logs:
                                               - accepted_unedited_count
                                               - accepted_edited_count  
                                               - rejected_count
                                                      ↓
                                            FlashcardsBatchResponseDTO
```

### 4.6 Względy bezpieczeństwa

- **Autoryzacja**: Token Bearer, `user_id` z tokenu
- **Własność generation_log**: Weryfikacja że `generation_log_id` należy do użytkownika
- **Walidacja masowa**: Każda fiszka walidowana osobno
- **Transakcyjność**: Operacje powinny być atomowe (wszystko albo nic)

### 4.7 Obsługa błędów

| Scenariusz | Kod HTTP | Odpowiedź |
|------------|----------|-----------|
| Brak tokenu | 401 | `{ "error": "Unauthorized" }` |
| Nieprawidłowy JSON | 400 | `{ "error": "Nieprawidłowy format JSON" }` |
| Brak `generation_log_id` | 400 | `{ "error": "Pole generation_log_id jest wymagane" }` |
| Nieprawidłowy format UUID | 400 | `{ "error": "Nieprawidłowy format generation_log_id" }` |
| Generation log nie istnieje | 404 | `{ "error": "Generation log not found" }` |
| Generation log należy do innego użytkownika | 404 | `{ "error": "Generation log not found" }` |
| Pusta tablica `flashcards` | 400 | `{ "error": "Tablica flashcards nie może być pusta" }` |
| Puste `front` w którejś fiszce | 400 | `{ "error": "Pole front nie może być puste (fiszka #N)" }` |
| `rejected_count` < 0 | 400 | `{ "error": "Pole rejected_count musi być >= 0" }` |
| Błąd bazy danych | 500 | `{ "error": "Błąd serwera" }` |

### 4.8 Rozważania dotyczące wydajności

- **Bulk INSERT**: Wstawienie wielu rekordów w jednym zapytaniu
- **Transakcja**: Użycie transakcji dla atomowości
- **Limit fiszek**: Rozważyć maksymalną liczbę fiszek w batch (np. 100)

### 4.9 Kroki implementacji

1. Utworzyć schemat walidacji `createFlashcardsBatchSchema` w `src/lib/schemas/flashcard.schema.ts`
2. Dodać metodę `createFlashcardsBatch()` w `FlashcardService`
3. Utworzyć endpoint w `src/pages/api/flashcards/batch.ts`
4. Zaimplementować weryfikację właściciela generation_log
5. Zaimplementować bulk insert z transakcją
6. Zaktualizować generation_log po insercie fiszek

---

## 5. PUT /api/flashcards/:id

### 5.1 Przegląd punktu końcowego

Endpoint aktualizuje treść istniejącej fiszki. Można zaktualizować `front`, `back` lub oba pola. Automatycznie aktualizuje `updated_at`.

### 5.2 Szczegóły żądania

- **Metoda HTTP**: PUT
- **Struktura URL**: `/api/flashcards/[id]`
- **Headers**: 
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

#### Request Body

```json
{
  "front": "Updated question?",
  "back": "Updated answer"
}
```

| Pole | Typ | Wymagany | Ograniczenia |
|------|-----|----------|--------------|
| `front` | string | Nie | Jeśli podane, niepuste po trimie |
| `back` | string | Nie | Jeśli podane, niepuste po trimie |

**Uwaga**: Przynajmniej jedno z pól (`front` lub `back`) musi być podane.

### 5.3 Wykorzystywane typy

```typescript
// Z src/types.ts - już zdefiniowane
import type {
  UpdateFlashcardCommand,
  FlashcardUpdateResponseDTO
} from "../../types";
```

### 5.4 Szczegóły odpowiedzi

**Sukces (200 OK)**:
```json
{
  "id": "uuid",
  "front": "Updated question?",
  "back": "Updated answer",
  "is_ai_generated": true,
  "updated_at": "2024-01-15T11:00:00Z"
}
```

### 5.5 Przepływ danych

```
Request → Auth Middleware → UUID + Body Validation → FlashcardService.updateFlashcard()
                                                            ↓
                                                  Supabase UPDATE:
                                                  - WHERE id = :id (RLS sprawdza user_id)
                                                  - SET front?, back?, updated_at = now()
                                                            ↓
                                                  RETURNING → FlashcardUpdateResponseDTO | null
```

### 5.6 Względy bezpieczeństwa

- **Autoryzacja**: Token Bearer wymagany
- **Własność zasobu**: RLS w Supabase zapewnia, że użytkownik może edytować tylko swoje fiszki
- **Walidacja**: Niepuste pola po trimie

### 5.7 Obsługa błędów

| Scenariusz | Kod HTTP | Odpowiedź |
|------------|----------|-----------|
| Brak tokenu | 401 | `{ "error": "Unauthorized" }` |
| Nieprawidłowy format UUID | 400 | `{ "error": "Nieprawidłowy format identyfikatora" }` |
| Nieprawidłowy JSON | 400 | `{ "error": "Nieprawidłowy format JSON" }` |
| Brak front i back | 400 | `{ "error": "Przynajmniej jedno pole (front lub back) musi być podane" }` |
| Puste `front` (po trimie) | 400 | `{ "error": "Pole front nie może być puste" }` |
| Puste `back` (po trimie) | 400 | `{ "error": "Pole back nie może być puste" }` |
| Fiszka nie istnieje | 404 | `{ "error": "Flashcard not found" }` |
| Błąd bazy danych | 500 | `{ "error": "Błąd serwera" }` |

### 5.8 Rozważania dotyczące wydajności

- **Pojedynczy UPDATE**: Atomowa operacja
- **Selektywny UPDATE**: Aktualizacja tylko podanych pól

### 5.9 Kroki implementacji

1. Utworzyć schemat walidacji `updateFlashcardSchema` w `src/lib/schemas/flashcard.schema.ts`
2. Dodać metodę `updateFlashcard()` w `FlashcardService`
3. Dodać handler PUT w `src/pages/api/flashcards/[id]/index.ts`
4. Zaimplementować walidację "przynajmniej jedno pole wymagane"

---

## 6. DELETE /api/flashcards/:id

### 6.1 Przegląd punktu końcowego

Endpoint trwale usuwa fiszkę. Operacja nieodwracalna.

### 6.2 Szczegóły żądania

- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/flashcards/[id]`
- **Headers**: `Authorization: Bearer <access_token>`

#### Parametry URL

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | UUID | Tak | Identyfikator fiszki do usunięcia |

### 6.3 Wykorzystywane typy

```typescript
// Z src/types.ts - już zdefiniowane
import type { MessageResponseDTO } from "../../types";
```

### 6.4 Szczegóły odpowiedzi

**Sukces (200 OK)**:
```json
{
  "message": "Flashcard successfully deleted"
}
```

### 6.5 Przepływ danych

```
Request → Auth Middleware → UUID Validation → FlashcardService.deleteFlashcard()
                                                      ↓
                                            Supabase DELETE:
                                            - WHERE id = :id (RLS sprawdza user_id)
                                                      ↓
                                            Affected rows > 0 ? Success : 404
```

### 6.6 Względy bezpieczeństwa

- **Autoryzacja**: Token Bearer wymagany
- **Własność zasobu**: RLS zapewnia, że użytkownik może usunąć tylko swoje fiszki
- **Walidacja UUID**: Sprawdzenie formatu przed zapytaniem

### 6.7 Obsługa błędów

| Scenariusz | Kod HTTP | Odpowiedź |
|------------|----------|-----------|
| Brak tokenu | 401 | `{ "error": "Unauthorized" }` |
| Nieprawidłowy format UUID | 400 | `{ "error": "Nieprawidłowy format identyfikatora" }` |
| Fiszka nie istnieje | 404 | `{ "error": "Flashcard not found" }` |
| Błąd bazy danych | 500 | `{ "error": "Błąd serwera" }` |

### 6.8 Rozważania dotyczące wydajności

- **Pojedynczy DELETE**: Szybka operacja atomowa
- **Cascade**: Brak zależności kaskadowych dla flashcards

### 6.9 Kroki implementacji

1. Wykorzystać istniejący schemat walidacji UUID
2. Dodać metodę `deleteFlashcard()` w `FlashcardService`
3. Dodać handler DELETE w `src/pages/api/flashcards/[id]/index.ts`

---

## 7. POST /api/flashcards/:id/reset-progress

### 7.1 Przegląd punktu końcowego

Endpoint resetuje parametry algorytmu SM-2 dla fiszki do wartości początkowych, umożliwiając rozpoczęcie nauki od nowa.

### 7.2 Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards/[id]/reset-progress`
- **Headers**: `Authorization: Bearer <access_token>`

#### Parametry URL

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | UUID | Tak | Identyfikator fiszki |

### 7.3 Wykorzystywane typy

```typescript
// Z src/types.ts - już zdefiniowane
import type { FlashcardResetProgressResponseDTO } from "../../types";
```

### 7.4 Szczegóły odpowiedzi

**Sukces (200 OK)**:
```json
{
  "id": "uuid",
  "interval": 0,
  "ease_factor": 2.5,
  "repetitions": 0,
  "next_review_date": "2024-01-15",
  "last_reviewed_at": null,
  "message": "Learning progress reset successfully"
}
```

### 7.5 Przepływ danych

```
Request → Auth Middleware → UUID Validation → FlashcardService.resetProgress()
                                                      ↓
                                            Supabase UPDATE:
                                            - WHERE id = :id (RLS sprawdza user_id)
                                            - SET:
                                                interval = 0
                                                ease_factor = 2.5
                                                repetitions = 0
                                                next_review_date = CURRENT_DATE
                                                last_reviewed_at = NULL
                                                updated_at = now()
                                                      ↓
                                            RETURNING → FlashcardResetProgressResponseDTO
```

### 7.6 Względy bezpieczeństwa

- **Autoryzacja**: Token Bearer wymagany
- **Własność zasobu**: RLS zapewnia, że użytkownik może resetować tylko swoje fiszki
- **Walidacja UUID**: Sprawdzenie formatu przed operacją

### 7.7 Obsługa błędów

| Scenariusz | Kod HTTP | Odpowiedź |
|------------|----------|-----------|
| Brak tokenu | 401 | `{ "error": "Unauthorized" }` |
| Nieprawidłowy format UUID | 400 | `{ "error": "Nieprawidłowy format identyfikatora" }` |
| Fiszka nie istnieje | 404 | `{ "error": "Flashcard not found" }` |
| Błąd bazy danych | 500 | `{ "error": "Błąd serwera" }` |

### 7.8 Rozważania dotyczące wydajności

- **Pojedynczy UPDATE**: Atomowa operacja, szybka

### 7.9 Kroki implementacji

1. Wykorzystać istniejący schemat walidacji UUID
2. Dodać metodę `resetProgress()` w `FlashcardService`
3. Utworzyć endpoint w `src/pages/api/flashcards/[id]/reset-progress.ts`

---

## 8. Wspólne komponenty

### 8.1 Schemat walidacji Zod

**Plik:** `src/lib/schemas/flashcard.schema.ts`

```typescript
import { z } from "zod";

// Walidacja UUID
export const uuidSchema = z
  .string()
  .uuid("Nieprawidłowy format identyfikatora");

// Query params dla GET /api/flashcards
export const flashcardsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, "Parametr page musi być >= 1")
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Parametr limit musi być >= 1")
    .max(100, "Parametr limit nie może przekraczać 100")
    .default(20),
  search: z.string().optional(),
  sort: z
    .enum(["created_at", "updated_at", "next_review_date"], {
      errorMap: () => ({
        message: "Parametr sort musi być jednym z: created_at, updated_at, next_review_date"
      })
    })
    .default("created_at"),
  order: z
    .enum(["asc", "desc"], {
      errorMap: () => ({
        message: "Parametr order musi być jednym z: asc, desc"
      })
    })
    .default("desc")
});

// POST /api/flashcards
export const createFlashcardSchema = z.object({
  front: z
    .string({ required_error: "Pole front jest wymagane" })
    .transform(val => val.trim())
    .refine(val => val.length > 0, "Pole front nie może być puste"),
  back: z
    .string({ required_error: "Pole back jest wymagane" })
    .transform(val => val.trim())
    .refine(val => val.length > 0, "Pole back nie może być puste")
});

// PUT /api/flashcards/:id
export const updateFlashcardSchema = z
  .object({
    front: z
      .string()
      .transform(val => val.trim())
      .refine(val => val.length > 0, "Pole front nie może być puste")
      .optional(),
    back: z
      .string()
      .transform(val => val.trim())
      .refine(val => val.length > 0, "Pole back nie może być puste")
      .optional()
  })
  .refine(data => data.front !== undefined || data.back !== undefined, {
    message: "Przynajmniej jedno pole (front lub back) musi być podane"
  });

// Pojedyncza fiszka w batch
const batchFlashcardItemSchema = z.object({
  front: z
    .string()
    .transform(val => val.trim())
    .refine(val => val.length > 0, "Pole front nie może być puste"),
  back: z
    .string()
    .transform(val => val.trim())
    .refine(val => val.length > 0, "Pole back nie może być puste"),
  original_front: z.string(),
  original_back: z.string(),
  is_edited: z.boolean()
});

// POST /api/flashcards/batch
export const createFlashcardsBatchSchema = z.object({
  generation_log_id: z
    .string({ required_error: "Pole generation_log_id jest wymagane" })
    .uuid("Nieprawidłowy format generation_log_id"),
  flashcards: z
    .array(batchFlashcardItemSchema)
    .min(1, "Tablica flashcards nie może być pusta"),
  rejected_count: z
    .number({ required_error: "Pole rejected_count jest wymagane" })
    .int()
    .min(0, "Pole rejected_count musi być >= 0")
});

export type FlashcardsQueryInput = z.infer<typeof flashcardsQuerySchema>;
export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
export type CreateFlashcardsBatchInput = z.infer<typeof createFlashcardsBatchSchema>;
```

### 8.2 Serwis flashcard

**Plik:** `src/lib/services/flashcard.service.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  FlashcardsListResponseDTO,
  FlashcardDetailDTO,
  FlashcardCreateResponseDTO,
  FlashcardsBatchResponseDTO,
  FlashcardUpdateResponseDTO,
  FlashcardResetProgressResponseDTO,
  FlashcardsQueryParams,
  CreateFlashcardCommand,
  CreateFlashcardsBatchCommand,
  UpdateFlashcardCommand
} from "../../types";

export class FlashcardServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "FlashcardServiceError";
  }
}

export class FlashcardService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async getFlashcards(params: FlashcardsQueryParams): Promise<FlashcardsListResponseDTO> {
    // Implementacja...
  }

  async getFlashcardById(id: string): Promise<FlashcardDetailDTO | null> {
    // Implementacja...
  }

  async createFlashcard(userId: string, command: CreateFlashcardCommand): Promise<FlashcardCreateResponseDTO> {
    // Implementacja...
  }

  async createFlashcardsBatch(
    userId: string,
    command: CreateFlashcardsBatchCommand
  ): Promise<FlashcardsBatchResponseDTO> {
    // Implementacja...
  }

  async updateFlashcard(id: string, command: UpdateFlashcardCommand): Promise<FlashcardUpdateResponseDTO | null> {
    // Implementacja...
  }

  async deleteFlashcard(id: string): Promise<boolean> {
    // Implementacja...
  }

  async resetProgress(id: string): Promise<FlashcardResetProgressResponseDTO | null> {
    // Implementacja...
  }
}

export function createFlashcardService(supabase: SupabaseClient<Database>): FlashcardService {
  return new FlashcardService(supabase);
}
```

### 8.3 Wspólna obsługa błędów w endpointach

Wzorzec obsługi błędów (do zastosowania w każdym endpoincie):

```typescript
import type { APIRoute } from "astro";
import { authenticateRequest, isAuthError } from "../../lib/helpers/auth.helper";
import { FlashcardServiceError } from "../../lib/services/flashcard.service";

export const handler: APIRoute = async ({ request, locals }) => {
  // 1. Autoryzacja
  const authResult = await authenticateRequest(request, locals.supabase);
  if (isAuthError(authResult)) {
    return authResult.response;
  }

  // 2. Walidacja (Zod)
  // ...

  try {
    // 3. Logika biznesowa
    // ...
  } catch (error) {
    if (error instanceof FlashcardServiceError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
```

---

## 9. Struktura plików

```
src/
├── pages/
│   └── api/
│       └── flashcards/
│           ├── index.ts              # GET (lista) + POST (create)
│           ├── batch.ts              # POST (batch create)
│           └── [id]/
│               ├── index.ts          # GET (single) + PUT + DELETE
│               └── reset-progress.ts # POST (reset SM-2)
├── lib/
│   ├── services/
│   │   └── flashcard.service.ts      # NOWY - logika biznesowa
│   ├── schemas/
│   │   └── flashcard.schema.ts       # NOWY - schematy Zod
│   └── helpers/
│       └── auth.helper.ts            # Istniejący - autoryzacja
├── db/
│   ├── database.types.ts             # Istniejący - typy Supabase
│   └── supabase.client.ts            # Istniejący - klient Supabase
└── types.ts                          # Istniejący - DTOs i Command Models
```

### Kolejność implementacji

1. **Krok 1**: Utworzyć `src/lib/schemas/flashcard.schema.ts` ze wszystkimi schematami walidacji
2. **Krok 2**: Utworzyć `src/lib/services/flashcard.service.ts` z klasą FlashcardService
3. **Krok 3**: Utworzyć `src/pages/api/flashcards/index.ts` (GET + POST)
4. **Krok 4**: Utworzyć `src/pages/api/flashcards/[id]/index.ts` (GET + PUT + DELETE)
5. **Krok 5**: Utworzyć `src/pages/api/flashcards/batch.ts` (POST batch)
6. **Krok 6**: Utworzyć `src/pages/api/flashcards/[id]/reset-progress.ts` (POST reset)
7. **Krok 7**: Testy jednostkowe dla FlashcardService
8. **Krok 8**: Testy integracyjne dla endpointów API
