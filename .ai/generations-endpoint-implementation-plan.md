# API Endpoint Implementation Plan: POST /api/generations

## 1. Przegląd punktu końcowego

Endpoint `POST /api/generations` służy do generowania propozycji fiszek edukacyjnych na podstawie dostarczonego tekstu źródłowego. Wykorzystuje usługę Openrouter.ai do komunikacji z modelami AI, które analizują tekst i tworzą pytania oraz odpowiedzi w formacie fiszek.

**Główne funkcje:**
- Przyjmowanie tekstu źródłowego od użytkownika
- Tworzenie wpisu logu generowania przed wywołaniem AI
- Komunikacja z API Openrouter.ai
- Parsowanie i walidacja odpowiedzi AI
- Aktualizacja licznika wygenerowanych fiszek
- Zwrot propozycji fiszek do klienta

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/generations`
- **Headers**:
  - `Authorization: Bearer <access_token>` (wymagany)
  - `Content-Type: application/json`

### Parametry

**Wymagane:**
| Parametr | Typ | Ograniczenia | Opis |
|----------|-----|--------------|------|
| `source_text` | string | 1000-10000 znaków | Tekst źródłowy do analizy przez AI |

**Opcjonalne:** Brak

### Request Body

```json
{
  "source_text": "Długi tekst źródłowy zawierający materiał edukacyjny do przetworzenia na fiszki..."
}
```

### Schemat walidacji (Zod)

```typescript
import { z } from "zod";

export const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Tekst źródłowy musi zawierać co najmniej 1000 znaków")
    .max(10000, "Tekst źródłowy nie może przekraczać 10000 znaków")
});
```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// Propozycja fiszki wygenerowana przez AI
interface FlashcardProposalDTO {
  front: string;  // Pytanie
  back: string;   // Odpowiedź
}

// Odpowiedź z endpointu generowania
interface GenerationResponseDTO {
  generation_log_id: string;        // UUID logu generowania
  proposals: FlashcardProposalDTO[]; // Lista propozycji fiszek
  model_used: string;               // Nazwa użytego modelu AI
  generated_count: number;          // Liczba wygenerowanych propozycji
}
```

### Command Models

```typescript
// Komenda generowania fiszek
interface GenerateFlashcardsCommand {
  source_text: string;
}
```

### Typy wewnętrzne (do utworzenia)

```typescript
// Odpowiedź z API Openrouter
interface OpenrouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  model: string;
}

// Sparsowana odpowiedź AI z fiszkami
interface ParsedFlashcardsResponse {
  flashcards: FlashcardProposalDTO[];
}
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "generation_log_id": "550e8400-e29b-41d4-a716-446655440000",
  "proposals": [
    {
      "front": "Jakie są główne cechy programowania obiektowego?",
      "back": "Główne cechy to: enkapsulacja, dziedziczenie, polimorfizm i abstrakcja."
    },
    {
      "front": "Co to jest enkapsulacja?",
      "back": "Enkapsulacja to mechanizm ukrywania wewnętrznej implementacji obiektu i udostępniania tylko niezbędnego interfejsu."
    }
  ],
  "model_used": "gpt-4o-mini",
  "generated_count": 2
}
```

### Kody statusu

| Kod | Opis | Kiedy |
|-----|------|-------|
| 200 | OK | Pomyślne wygenerowanie propozycji |
| 400 | Bad Request | Nieprawidłowe dane wejściowe (tekst za krótki/długi, brak tekstu) |
| 401 | Unauthorized | Brak lub nieprawidłowy token autoryzacji |
| 502 | Bad Gateway | Serwis AI (Openrouter) niedostępny |
| 503 | Service Unavailable | Przekroczony limit zapytań do AI |
| 500 | Internal Server Error | Nieoczekiwany błąd serwera |

## 5. Przepływ danych

```
┌─────────────────┐
│  Klient (POST)  │
└────────┬────────┘
         │ source_text
         ▼
┌─────────────────────────────────────────────────────────┐
│                   API Endpoint                          │
│  src/pages/api/generations.ts                          │
├─────────────────────────────────────────────────────────┤
│  1. Weryfikacja autoryzacji (Bearer token)             │
│  2. Walidacja request body (Zod)                       │
│  3. Wywołanie GenerationService                        │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              GenerationService                          │
│  src/lib/services/generation.service.ts                │
├─────────────────────────────────────────────────────────┤
│  1. Utworzenie wpisu generation_logs (Supabase)        │
│  2. Wywołanie OpenrouterService                        │
│  3. Parsowanie odpowiedzi AI                           │
│  4. Aktualizacja generated_count w logu                │
│  5. Zwrot GenerationResponseDTO                        │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              OpenrouterService                          │
│  src/lib/services/openrouter.service.ts                │
├─────────────────────────────────────────────────────────┤
│  1. Przygotowanie promptu systemowego                  │
│  2. Wywołanie API Openrouter.ai                        │
│  3. Obsługa błędów API                                 │
│  4. Zwrot surowej odpowiedzi                           │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Openrouter.ai  │     │    Supabase     │
│   (External)    │     │  generation_logs│
└─────────────────┘     └─────────────────┘
```

### Interakcje z bazą danych

1. **INSERT do `generation_logs`** (przed wywołaniem AI):
   ```sql
   INSERT INTO generation_logs (user_id, source_text_length, model_used, generated_count)
   VALUES ($1, $2, $3, 0)
   RETURNING id;
   ```

2. **UPDATE `generation_logs`** (po otrzymaniu odpowiedzi AI):
   ```sql
   UPDATE generation_logs
   SET generated_count = $1
   WHERE id = $2;
   ```

## 6. Względy bezpieczeństwa

### Autoryzacja

1. **Weryfikacja tokenu Bearer** - sprawdzenie obecności i ważności tokenu w nagłówku Authorization
2. **Pobieranie użytkownika z sesji** - użycie Supabase Auth do weryfikacji sesji
3. **Powiązanie logu z użytkownikiem** - `user_id` w `generation_logs` zapewnia izolację danych

### Walidacja danych wejściowych

1. **Walidacja Zod** - schematy walidacji dla request body
2. **Sanityzacja tekstu** - podstawowe czyszczenie danych wejściowych
3. **Limity długości** - 1000-10000 znaków dla `source_text`

### Ochrona przed atakami

1. **Prompt Injection** - instrukcje systemowe dla AI powinny być odporne na manipulację przez tekst użytkownika
2. **Rate Limiting** - rozważenie implementacji limitów zapytań na użytkownika (opcjonalnie, poza zakresem MVP)
3. **Bezpieczne przechowywanie kluczy API** - klucz Openrouter w zmiennych środowiskowych

### Zmienne środowiskowe

```
OPENROUTER_API_KEY=sk-...
OPENROUTER_MODEL=gpt-4o-mini
```

## 7. Obsługa błędów

### Mapowanie błędów na odpowiedzi HTTP

| Typ błędu | Kod HTTP | Treść odpowiedzi |
|-----------|----------|------------------|
| Brak/nieprawidłowy token | 401 | `{ "error": "Unauthorized" }` |
| Walidacja Zod (tekst za krótki) | 400 | `{ "error": "Tekst źródłowy musi zawierać co najmniej 1000 znaków" }` |
| Walidacja Zod (tekst za długi) | 400 | `{ "error": "Tekst źródłowy nie może przekraczać 10000 znaków" }` |
| Brak source_text | 400 | `{ "error": "Pole source_text jest wymagane" }` |
| Openrouter niedostępny | 502 | `{ "error": "Serwis AI jest tymczasowo niedostępny" }` |
| Rate limit Openrouter | 503 | `{ "error": "Przekroczono limit zapytań do serwisu AI" }` |
| Błąd parsowania odpowiedzi AI | 500 | `{ "error": "Błąd przetwarzania odpowiedzi AI" }` |
| Błąd bazy danych | 500 | `{ "error": "Błąd serwera" }` |
| Nieoczekiwany błąd | 500 | `{ "error": "Wystąpił nieoczekiwany błąd" }` |

### Strategia obsługi błędów

1. **Early returns** - szybkie wyjście z funkcji przy błędach
2. **Try-catch** - obsługa wyjątków z serwisów zewnętrznych
3. **Custom error types** - dedykowane typy błędów dla różnych scenariuszy
4. **Logowanie** - rejestrowanie błędów z kontekstem do debugowania

### Przykładowe typy błędów

```typescript
class OpenrouterError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRateLimit: boolean = false
  ) {
    super(message);
    this.name = "OpenrouterError";
  }
}

class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Czas odpowiedzi Openrouter.ai** - wywołania API mogą trwać kilka sekund
2. **Rozmiar tekstu źródłowego** - większe teksty = dłuższy czas przetwarzania
3. **Parsowanie odpowiedzi AI** - złożoność parsowania JSON z odpowiedzi

### Strategie optymalizacji

1. **Timeout dla wywołań Openrouter** - ustawienie maksymalnego czasu oczekiwania (np. 60 sekund)
2. **Streaming (opcjonalnie)** - rozważenie streamingu odpowiedzi dla lepszego UX
3. **Caching modelu** - przechowywanie nazwy modelu w konfiguracji
4. **Asynchroniczne logowanie** - operacje na bazie danych nie blokujące głównego przepływu

### Limity i timeouty

```typescript
const OPENROUTER_TIMEOUT_MS = 60000; // 60 sekund
const MAX_SOURCE_TEXT_LENGTH = 10000;
const MIN_SOURCE_TEXT_LENGTH = 1000;
```

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji Zod

**Plik:** `src/lib/schemas/generation.schema.ts`

```typescript
import { z } from "zod";

export const generateFlashcardsSchema = z.object({
  source_text: z
    .string({ required_error: "Pole source_text jest wymagane" })
    .min(1000, "Tekst źródłowy musi zawierać co najmniej 1000 znaków")
    .max(10000, "Tekst źródłowy nie może przekraczać 10000 znaków")
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
```

### Krok 2: Utworzenie serwisu Openrouter

**Plik:** `src/lib/services/openrouter.service.ts`

Odpowiedzialności:
- Komunikacja z API Openrouter.ai
- Konstruowanie promptu systemowego
- Obsługa błędów API (timeout, rate limit, niedostępność)
- Parsowanie i walidacja odpowiedzi

Kluczowe metody:
```typescript
interface OpenrouterService {
  generateFlashcards(sourceText: string): Promise<FlashcardProposalDTO[]>;
}
```

### Krok 3: Utworzenie serwisu generowania

**Plik:** `src/lib/services/generation.service.ts`

Odpowiedzialności:
- Koordynacja całego procesu generowania
- Tworzenie i aktualizacja wpisów `generation_logs`
- Wywołanie `OpenrouterService`
- Konstrukcja `GenerationResponseDTO`

Kluczowe metody:
```typescript
interface GenerationService {
  generateFlashcards(
    userId: string,
    command: GenerateFlashcardsCommand,
    supabase: SupabaseClient
  ): Promise<GenerationResponseDTO>;
}
```

### Krok 4: Utworzenie endpointu API

**Plik:** `src/pages/api/generations.ts`

Struktura:
```typescript
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Weryfikacja autoryzacji
  // 2. Parsowanie i walidacja body
  // 3. Wywołanie GenerationService
  // 4. Zwrot odpowiedzi
};
```

### Krok 5: Aktualizacja middleware (jeśli potrzebne)

**Plik:** `src/middleware/index.ts`

Rozszerzenie middleware o:
- Weryfikację sesji Supabase dla tras API
- Dodanie informacji o użytkowniku do `context.locals`

### Krok 6: Dodanie zmiennych środowiskowych

**Plik:** `.env` (lub `.env.local`)

```
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

**Plik:** `src/env.d.ts` (rozszerzenie typów)

```typescript
interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_MODEL: string;
  readonly OPENROUTER_BASE_URL: string;
}
```

### Krok 7: Testy

1. **Testy jednostkowe:**
   - Walidacja schematu Zod
   - Parsowanie odpowiedzi AI
   - Obsługa błędów

2. **Testy integracyjne:**
   - Pełny przepływ endpoint
   - Integracja z Supabase
   - Mock Openrouter API

3. **Przypadki testowe:**
   - Tekst o minimalnej długości (1000 znaków)
   - Tekst o maksymalnej długości (10000 znaków)
   - Tekst za krótki (< 1000 znaków) → 400
   - Tekst za długi (> 10000 znaków) → 400
   - Brak autoryzacji → 401
   - Timeout Openrouter → 502
   - Rate limit Openrouter → 503

### Struktura plików po wdrożeniu

```
src/
├── pages/
│   └── api/
│       └── generations.ts          # Endpoint API
├── lib/
│   ├── services/
│   │   ├── generation.service.ts   # Logika generowania
│   │   └── openrouter.service.ts   # Komunikacja z AI
│   └── schemas/
│       └── generation.schema.ts    # Schematy walidacji Zod
├── middleware/
│   └── index.ts                    # Middleware (rozszerzony)
└── types.ts                        # Typy (już istnieje)
```

## 10. Prompt systemowy dla AI

Sugerowany prompt do generowania fiszek:

```
Jesteś ekspertem w tworzeniu materiałów edukacyjnych. Twoim zadaniem jest analiza dostarczonego tekstu i utworzenie zestawu fiszek edukacyjnych.

Zasady:
1. Każda fiszka składa się z pytania (front) i odpowiedzi (back)
2. Pytania powinny być konkretne i testować zrozumienie materiału
3. Odpowiedzi powinny być zwięzłe, ale kompletne
4. Unikaj pytań typu tak/nie
5. Twórz pytania na różnych poziomach trudności
6. Odpowiedź w formacie JSON

Format odpowiedzi:
{
  "flashcards": [
    { "front": "pytanie 1", "back": "odpowiedź 1" },
    { "front": "pytanie 2", "back": "odpowiedź 2" }
  ]
}

Tekst do analizy:
{source_text}
```
