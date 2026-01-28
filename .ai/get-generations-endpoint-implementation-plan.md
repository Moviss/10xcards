# API Endpoint Implementation Plan: GET /api/generations

## 1. Przegląd punktu końcowego

Endpoint `GET /api/generations` służy do pobierania paginowanej listy historii generowania fiszek AI dla zalogowanego użytkownika. Jest przeznaczony do celów analitycznych i umożliwia śledzenie statystyk związanych z generowaniem fiszek (liczba wygenerowanych, zaakceptowanych, odrzuconych propozycji).

Endpoint zwraca dane z tabeli `generation_logs`, filtrowane automatycznie przez Row Level Security (RLS) Supabase do rekordów należących do zalogowanego użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/generations`
- **Nagłówki:**
  - `Authorization: Bearer <access_token>` (wymagany)

### Parametry Query String

| Parametr | Typ | Wymagany | Domyślna wartość | Opis |
|----------|-----|----------|------------------|------|
| `page` | integer | Nie | 1 | Numer strony (>= 1) |
| `limit` | integer | Nie | 20 | Liczba elementów na stronę (1-100) |

### Request Body

Brak - endpoint GET nie przyjmuje body.

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// DTO dla pojedynczego logu generowania
export type GenerationLogDTO = Pick<
  GenerationLogRow,
  | "id"
  | "source_text_length"
  | "generated_count"
  | "accepted_unedited_count"
  | "accepted_edited_count"
  | "rejected_count"
  | "model_used"
  | "created_at"
>;

// Odpowiedź z paginacją
export interface GenerationLogsListResponseDTO {
  data: GenerationLogDTO[];
  pagination: PaginationDTO;
}

// Metadane paginacji
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Parametry paginacji
export interface PaginationParams {
  page?: number;
  limit?: number;
}
```

### Nowy schemat Zod do walidacji (do utworzenia)

```typescript
// src/lib/schemas/generation.schema.ts
export const getGenerationLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetGenerationLogsQuery = z.infer<typeof getGenerationLogsQuerySchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": [
    {
      "id": "uuid",
      "source_text_length": 5000,
      "generated_count": 10,
      "accepted_unedited_count": 7,
      "accepted_edited_count": 2,
      "rejected_count": 1,
      "model_used": "gpt-4o-mini",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 Bad Request | Nieprawidłowe parametry paginacji | `{"error": "Parametr page musi być liczbą całkowitą >= 1"}` |
| 401 Unauthorized | Brak lub nieprawidłowy token | `{"error": "Unauthorized"}` |
| 500 Internal Server Error | Błąd serwera | `{"error": "Wystąpił nieoczekiwany błąd"}` |

## 5. Przepływ danych

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌──────────────┐
│   Klient    │────▶│  API Endpoint    │────▶│ GenerationService │────▶│   Supabase   │
│             │     │  generations.ts  │     │                   │     │  (RLS)       │
└─────────────┘     └──────────────────┘     └───────────────────┘     └──────────────┘
       │                    │                         │                       │
       │ GET /api/generations                         │                       │
       │ ?page=1&limit=20                             │                       │
       │ Authorization: Bearer <token>                │                       │
       │                    │                         │                       │
       │                    │ 1. Weryfikacja tokenu   │                       │
       │                    │────────────────────────▶│                       │
       │                    │                         │ getUser(token)        │
       │                    │                         │──────────────────────▶│
       │                    │                         │◀──────────────────────│
       │                    │◀────────────────────────│                       │
       │                    │                         │                       │
       │                    │ 2. Walidacja Zod        │                       │
       │                    │                         │                       │
       │                    │ 3. Pobierz logi         │                       │
       │                    │────────────────────────▶│                       │
       │                    │                         │ getGenerationLogs()   │
       │                    │                         │──────────────────────▶│
       │                    │                         │  SELECT + COUNT       │
       │                    │                         │  (RLS filteruje)      │
       │                    │                         │◀──────────────────────│
       │                    │◀────────────────────────│                       │
       │                    │                         │                       │
       │◀───────────────────│ 4. Zwróć odpowiedź      │                       │
       │   200 OK + JSON    │                         │                       │
```

### Szczegółowy przepływ:

1. **Autoryzacja**: Weryfikacja nagłówka `Authorization: Bearer <token>`
2. **Walidacja użytkownika**: Pobranie danych użytkownika z Supabase Auth
3. **Tworzenie klienta z RLS**: Utworzenie klienta Supabase z tokenem użytkownika
4. **Walidacja parametrów**: Walidacja `page` i `limit` przez Zod schema
5. **Wywołanie serwisu**: `GenerationService.getGenerationLogs(page, limit)`
6. **Zapytanie do bazy**: Pobranie logów z paginacją (RLS automatycznie filtruje po `user_id`)
7. **Obliczenie paginacji**: Pobranie całkowitej liczby rekordów dla metadanych
8. **Mapowanie odpowiedzi**: Konwersja danych do `GenerationLogsListResponseDTO`

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- Endpoint wymaga nagłówka `Authorization: Bearer <access_token>`
- Token weryfikowany przez `supabase.auth.getUser(token)`
- Brak tokenu lub nieprawidłowy token zwraca 401 Unauthorized

### Autoryzacja (izolacja danych)
- Row Level Security (RLS) w tabeli `generation_logs` zapewnia, że użytkownik widzi tylko swoje logi
- Polityka: `auth.uid() = user_id`
- Klient Supabase tworzony z tokenem użytkownika dla prawidłowego działania RLS

### Walidacja danych wejściowych
- Parametry `page` i `limit` walidowane przez schemat Zod
- `limit` ograniczony do maksymalnie 100 rekordów
- Zapobiega nadmiernemu obciążeniu bazy danych

### Ochrona przed atakami
- SQL Injection: Supabase SDK używa parametryzowanych zapytań
- Integer overflow: Zod wymusza typ integer z określonymi granicami

## 7. Obsługa błędów

### Hierarchia błędów

| Priorytet | Scenariusz | Kod HTTP | Komunikat |
|-----------|------------|----------|-----------|
| 1 | Brak nagłówka Authorization | 401 | `Unauthorized` |
| 2 | Nieprawidłowy format tokenu | 401 | `Unauthorized` |
| 3 | Token wygasły lub nieprawidłowy | 401 | `Unauthorized` |
| 4 | Nieprawidłowy parametr `page` | 400 | Komunikat z Zod |
| 5 | Nieprawidłowy parametr `limit` | 400 | Komunikat z Zod |
| 6 | Błąd bazy danych | 500 | `Wystąpił nieoczekiwany błąd` |
| 7 | Nieoczekiwany błąd | 500 | `Wystąpił nieoczekiwany błąd` |

### Logowanie błędów
- Błędy 500 logowane do konsoli z pełnym stack trace
- Błędy 400/401 nie wymagają logowania (błędy klienta)

## 8. Rozważania dotyczące wydajności

### Optymalizacje
- Indeks `idx_generation_logs_user_id` na kolumnie `user_id` dla szybkiego filtrowania
- Indeks `idx_generation_logs_created_at` dla sortowania po dacie
- Limit parametru `limit` do 100 zapobiega pobieraniu zbyt dużej ilości danych

### Paginacja
- Offset-based pagination (prostsze w implementacji dla MVP)
- Dla dużych zbiorów danych rozważyć cursor-based pagination w przyszłości

### Zapytania do bazy
- Dwa zapytania: jedno dla danych, jedno dla count
- Alternatywnie: użycie `{ count: 'exact' }` w opcjach Supabase dla jednego zapytania

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie schematu walidacji Zod

Plik: `src/lib/schemas/generation.schema.ts`

Dodać schemat walidacji dla parametrów query:
```typescript
export const getGenerationLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Parametr page musi być >= 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Parametr limit musi być >= 1")
    .max(100, "Parametr limit nie może przekraczać 100")
    .default(20),
});

export type GetGenerationLogsQuery = z.infer<typeof getGenerationLogsQuerySchema>;
```

### Krok 2: Rozszerzenie GenerationService

Plik: `src/lib/services/generation.service.ts`

Dodać metodę `getGenerationLogs`:
```typescript
async getGenerationLogs(
  page: number,
  limit: number
): Promise<GenerationLogsListResponseDTO> {
  const offset = (page - 1) * limit;

  // Pobierz dane z paginacją
  const { data, error, count } = await this.supabase
    .from("generation_logs")
    .select(
      "id, source_text_length, generated_count, accepted_unedited_count, accepted_edited_count, rejected_count, model_used, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new GenerationServiceError("Błąd serwera", 500);
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: data ?? [],
    pagination: {
      page,
      limit,
      total,
      total_pages: totalPages,
    },
  };
}
```

### Krok 3: Dodanie handlera GET do endpointu

Plik: `src/pages/api/generations.ts`

Dodać export `GET` obok istniejącego `POST`:
```typescript
export const GET: APIRoute = async ({ request, url, locals }) => {
  // 1. Weryfikacja autoryzacji
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.substring(7);

  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Utworzenie klienta Supabase z tokenem użytkownika (dla RLS)
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_KEY;
  const supabaseWithAuth = createClient<Database>(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // 3. Walidacja parametrów query
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const validationResult = getGenerationLogsQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    return new Response(JSON.stringify({ error: firstError.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { page, limit } = validationResult.data;

  // 4. Wywołanie serwisu
  try {
    const generationService = createGenerationService(supabaseWithAuth);
    const result = await generationService.getGenerationLogs(page, limit);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof GenerationServiceError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Unexpected error in GET /api/generations:", error);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Krok 4: Testy manualne

1. Test bez autoryzacji:
   ```bash
   curl -X GET "http://localhost:3000/api/generations"
   # Oczekiwane: 401 Unauthorized
   ```

2. Test z prawidłową autoryzacją:
   ```bash
   curl -X GET "http://localhost:3000/api/generations" \
     -H "Authorization: Bearer <valid_token>"
   # Oczekiwane: 200 OK z listą logów
   ```

3. Test paginacji:
   ```bash
   curl -X GET "http://localhost:3000/api/generations?page=2&limit=10" \
     -H "Authorization: Bearer <valid_token>"
   # Oczekiwane: 200 OK z drugą stroną wyników
   ```

4. Test nieprawidłowych parametrów:
   ```bash
   curl -X GET "http://localhost:3000/api/generations?page=-1&limit=200" \
     -H "Authorization: Bearer <valid_token>"
   # Oczekiwane: 400 Bad Request z komunikatem walidacji
   ```

### Krok 5: Refaktoryzacja (opcjonalna)

Rozważyć wyodrębnienie wspólnej logiki autoryzacji do helper function, ponieważ jest identyczna w `POST` i `GET`. Można utworzyć:

```typescript
// src/lib/helpers/auth.helper.ts
export async function authenticateRequest(
  request: Request,
  supabase: SupabaseClient<Database>
): Promise<{ user: User; token: string } | Response> {
  // ... logika autoryzacji
}
```

To ograniczy duplikację kodu i ułatwi przyszłe modyfikacje.
