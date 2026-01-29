# API Endpoint Implementation Plan: Authentication Endpoints

## Przegląd

Ten dokument zawiera szczegółowy plan wdrożenia punktów końcowych REST API dla autentykacji użytkowników w aplikacji 10xcards. Plan obejmuje 4 endpointy: rejestrację, logowanie, wylogowanie i usunięcie konta.

---

## Endpoint 1: POST /api/auth/register

### 1.1. Przegląd punktu końcowego

Rejestracja nowego konta użytkownika przy użyciu adresu email i hasła. Endpoint wykorzystuje Supabase Auth do utworzenia konta i automatycznego wygenerowania sesji.

### 1.2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/auth/register`
- **Nagłówki**: `Content-Type: application/json`
- **Parametry**:
  - Wymagane:
    - `email` (string) - adres email użytkownika
    - `password` (string) - hasło użytkownika (min. 8 znaków)
  - Opcjonalne: brak
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 1.3. Wykorzystywane typy

**Command Model (Request):**
```typescript
// src/types.ts - już zdefiniowany
interface RegisterCommand {
  email: string;
  password: string;
}
```

**Response DTO:**
```typescript
// src/types.ts - już zdefiniowany
interface AuthRegisterResponseDTO {
  user: UserDTO & { created_at: string };
  session: SessionDTO;
}

interface UserDTO {
  id: string;
  email: string;
  created_at?: string;
}

interface SessionDTO {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
```

**Zod Schema (do utworzenia):**
```typescript
// src/lib/schemas/auth.schema.ts
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
});
```

### 1.4. Szczegóły odpowiedzi

**Sukces (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1705312200
  }
}
```

**Błędy:**
- `400 Bad Request` - nieprawidłowy format danych
- `409 Conflict` - email już zarejestrowany

### 1.5. Przepływ danych

```
1. Klient wysyła POST /api/auth/register z email i password
2. Walidacja danych wejściowych przez Zod schema
3. Wywołanie supabase.auth.signUp({ email, password })
4. Supabase Auth:
   - Waliduje email i hasło
   - Tworzy rekord w auth.users
   - Generuje access_token i refresh_token
5. Mapowanie odpowiedzi Supabase na AuthRegisterResponseDTO
6. Zwrócenie odpowiedzi 201 Created
```

### 1.6. Względy bezpieczeństwa

1. **Walidacja email** - sprawdzenie poprawności formatu przez Zod i Supabase
2. **Siła hasła** - minimalna długość 8 znaków (Supabase domyślnie wymaga)
3. **Zapobieganie email enumeration** - Supabase zwraca generyczne błędy
4. **Rate limiting** - rozważyć w przyszłości (poza MVP)
5. **Sanityzacja danych** - Supabase automatycznie escapuje dane

### 1.7. Obsługa błędów

| Scenariusz | Kod statusu | Odpowiedź |
|------------|-------------|-----------|
| Brak wymaganych pól | 400 | `{ "error": "Invalid request body" }` |
| Nieprawidłowy format email | 400 | `{ "error": "Invalid email format" }` |
| Hasło za krótkie | 400 | `{ "error": "Password must be at least 8 characters" }` |
| Email już zarejestrowany | 409 | `{ "error": "User already registered" }` |
| Błąd serwera Supabase | 500 | `{ "error": "Registration failed" }` |

### 1.8. Rozważania dotyczące wydajności

- Endpoint jest lekki - pojedyncze wywołanie do Supabase Auth
- Brak potrzeby optymalizacji na tym etapie
- Supabase Auth obsługuje skalowanie po swojej stronie

### 1.9. Etapy wdrożenia

1. Utworzyć plik `src/lib/schemas/auth.schema.ts` z schematem `registerSchema`
2. Utworzyć plik `src/lib/services/auth.service.ts` z klasą `AuthService`
3. Zaimplementować metodę `register(email, password)` w AuthService
4. Utworzyć plik `src/pages/api/auth/register.ts`
5. Zaimplementować handler POST z walidacją i wywołaniem serwisu
6. Dodać mapowanie odpowiedzi Supabase na DTO
7. Przetestować endpoint z poprawnymi i niepoprawnymi danymi

---

## Endpoint 2: POST /api/auth/login

### 2.1. Przegląd punktu końcowego

Logowanie istniejącego użytkownika przy użyciu adresu email i hasła. Endpoint zwraca dane użytkownika wraz z tokenami sesji.

### 2.2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/auth/login`
- **Nagłówki**: `Content-Type: application/json`
- **Parametry**:
  - Wymagane:
    - `email` (string) - adres email użytkownika
    - `password` (string) - hasło użytkownika
  - Opcjonalne: brak
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 2.3. Wykorzystywane typy

**Command Model (Request):**
```typescript
// src/types.ts - już zdefiniowany
interface LoginCommand {
  email: string;
  password: string;
}
```

**Response DTO:**
```typescript
// src/types.ts - już zdefiniowany
interface AuthLoginResponseDTO {
  user: Omit<UserDTO, "created_at">;
  session: SessionDTO;
}
```

**Zod Schema (do utworzenia):**
```typescript
// src/lib/schemas/auth.schema.ts
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});
```

### 2.4. Szczegóły odpowiedzi

**Sukces (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1705312200
  }
}
```

**Błędy:**
- `400 Bad Request` - brakujące wymagane pola
- `401 Unauthorized` - nieprawidłowe dane logowania

### 2.5. Przepływ danych

```
1. Klient wysyła POST /api/auth/login z email i password
2. Walidacja danych wejściowych przez Zod schema
3. Wywołanie supabase.auth.signInWithPassword({ email, password })
4. Supabase Auth:
   - Weryfikuje dane logowania
   - Generuje nowe tokeny sesji
5. Mapowanie odpowiedzi Supabase na AuthLoginResponseDTO
6. Zwrócenie odpowiedzi 200 OK
```

### 2.6. Względy bezpieczeństwa

1. **Timing attacks** - Supabase Auth używa stałego czasu porównywania
2. **Brute force protection** - rozważyć rate limiting (poza MVP)
3. **Credential stuffing** - monitoring nieudanych prób logowania
4. **Secure session** - tokeny JWT z krótkim czasem życia
5. **Nie ujawniać** czy email istnieje - generyczny komunikat błędu

### 2.7. Obsługa błędów

| Scenariusz | Kod statusu | Odpowiedź |
|------------|-------------|-----------|
| Brak wymaganych pól | 400 | `{ "error": "Invalid request body" }` |
| Nieprawidłowy format email | 400 | `{ "error": "Invalid email format" }` |
| Puste hasło | 400 | `{ "error": "Password is required" }` |
| Nieprawidłowe dane logowania | 401 | `{ "error": "Invalid login credentials" }` |
| Błąd serwera Supabase | 500 | `{ "error": "Login failed" }` |

### 2.8. Rozważania dotyczące wydajności

- Pojedyncze wywołanie do Supabase Auth
- Brak dodatkowych zapytań do bazy danych
- Supabase obsługuje hashing i weryfikację hasła

### 2.9. Etapy wdrożenia

1. Dodać schemat `loginSchema` do `src/lib/schemas/auth.schema.ts`
2. Zaimplementować metodę `login(email, password)` w AuthService
3. Utworzyć plik `src/pages/api/auth/login.ts`
4. Zaimplementować handler POST z walidacją i wywołaniem serwisu
5. Dodać mapowanie odpowiedzi Supabase na DTO
6. Przetestować endpoint z poprawnymi i niepoprawnymi danymi

---

## Endpoint 3: POST /api/auth/logout

### 3.1. Przegląd punktu końcowego

Wylogowanie aktualnie zalogowanego użytkownika poprzez unieważnienie bieżącej sesji. Wymaga ważnego tokenu dostępu w nagłówku Authorization.

### 3.2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/auth/logout`
- **Nagłówki**:
  - `Authorization: Bearer <access_token>` (wymagany)
- **Parametry**: brak
- **Request Body**: brak

### 3.3. Wykorzystywane typy

**Response DTO:**
```typescript
// src/types.ts - już zdefiniowany
interface MessageResponseDTO {
  message: string;
}
```

### 3.4. Szczegóły odpowiedzi

**Sukces (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

**Błędy:**
- `401 Unauthorized` - brak ważnej sesji

### 3.5. Przepływ danych

```
1. Klient wysyła POST /api/auth/logout z Bearer token
2. Ekstrakcja tokenu z nagłówka Authorization
3. Walidacja tokenu przez supabase.auth.getUser(token)
4. Wywołanie supabase.auth.signOut()
5. Zwrócenie odpowiedzi 200 OK z komunikatem sukcesu
```

### 3.6. Względy bezpieczeństwa

1. **Token validation** - weryfikacja ważności tokenu przed wylogowaniem
2. **Session invalidation** - Supabase unieważnia sesję po stronie serwera
3. **Brak cache** - odpowiedź nie powinna być cachowana

### 3.7. Obsługa błędów

| Scenariusz | Kod statusu | Odpowiedź |
|------------|-------------|-----------|
| Brak nagłówka Authorization | 401 | `{ "error": "Authorization header is required" }` |
| Nieprawidłowy format tokenu | 401 | `{ "error": "Invalid authorization header format" }` |
| Wygasły/nieprawidłowy token | 401 | `{ "error": "Invalid or expired token" }` |
| Błąd serwera Supabase | 500 | `{ "error": "Logout failed" }` |

### 3.8. Rozważania dotyczące wydajności

- Lekka operacja - pojedyncze wywołanie do Supabase Auth
- Brak zapytań do bazy danych aplikacji

### 3.9. Etapy wdrożenia

1. Zaimplementować metodę `logout()` w AuthService
2. Utworzyć plik `src/pages/api/auth/logout.ts`
3. Zaimplementować handler POST z walidacją tokenu
4. Wykorzystać istniejący helper `authenticateRequest` do walidacji
5. Wywołać Supabase signOut i zwrócić odpowiedź
6. Przetestować endpoint z ważnym i nieważnym tokenem

---

## Endpoint 4: DELETE /api/auth/account

### 4.1. Przegląd punktu końcowego

Trwałe usunięcie konta użytkownika wraz ze wszystkimi powiązanymi danymi. Endpoint wymaga ważnego tokenu dostępu i wykorzystuje CASCADE DELETE zdefiniowane w bazie danych.

### 4.2. Szczegóły żądania

- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/auth/account`
- **Nagłówki**:
  - `Authorization: Bearer <access_token>` (wymagany)
- **Parametry**: brak
- **Request Body**: brak

### 4.3. Wykorzystywane typy

**Response DTO:**
```typescript
// src/types.ts - już zdefiniowany
interface MessageResponseDTO {
  message: string;
}
```

### 4.4. Szczegóły odpowiedzi

**Sukces (200 OK):**
```json
{
  "message": "Account successfully deleted"
}
```

**Błędy:**
- `401 Unauthorized` - brak autentykacji

### 4.5. Przepływ danych

```
1. Klient wysyła DELETE /api/auth/account z Bearer token
2. Ekstrakcja i walidacja tokenu przez authenticateRequest helper
3. Pobranie user.id z zalogowanego użytkownika
4. Wywołanie supabase.auth.admin.deleteUser(userId)
   - Wymaga Service Role Key (nie zwykłego klucza anon)
5. CASCADE DELETE automatycznie usuwa:
   - Wszystkie fiszki użytkownika (flashcards)
   - Wszystkie logi generacji (generation_logs)
6. Zwrócenie odpowiedzi 200 OK z komunikatem sukcesu
```

### 4.6. Względy bezpieczeństwa

1. **Wymagana autentykacja** - tylko zalogowany użytkownik może usunąć swoje konto
2. **Brak możliwości usunięcia cudzego konta** - walidacja przez token
3. **Service Role Key** - wymagany do usunięcia użytkownika z auth.users
4. **Cascade delete** - RLS i foreign keys zapewniają spójność
5. **Nieodwracalność** - operacja jest trwała, brak soft delete

### 4.7. Obsługa błędów

| Scenariusz | Kod statusu | Odpowiedź |
|------------|-------------|-----------|
| Brak nagłówka Authorization | 401 | `{ "error": "Authorization header is required" }` |
| Nieprawidłowy token | 401 | `{ "error": "Invalid or expired token" }` |
| Użytkownik nie znaleziony | 404 | `{ "error": "User not found" }` |
| Błąd usuwania | 500 | `{ "error": "Failed to delete account" }` |

### 4.8. Rozważania dotyczące wydajności

- Operacja może zająć więcej czasu przy dużej liczbie fiszek
- CASCADE DELETE jest optymalizowane przez PostgreSQL
- Rozważyć timeout dla bardzo dużych kont

### 4.9. Etapy wdrożenia

1. Utworzyć klienta Supabase z Service Role Key dla operacji admin
2. Zaimplementować metodę `deleteAccount(userId)` w AuthService
3. Utworzyć plik `src/pages/api/auth/account.ts`
4. Zaimplementować handler DELETE z walidacją tokenu
5. Wywołać metodę deleteUser przez Supabase Admin API
6. Przetestować endpoint i weryfikować CASCADE DELETE

---

## Wspólne elementy implementacji

### Struktura plików do utworzenia

```
src/
├── lib/
│   ├── schemas/
│   │   └── auth.schema.ts          # Schematy walidacji Zod
│   └── services/
│       └── auth.service.ts         # Serwis autentykacji
├── pages/
│   └── api/
│       └── auth/
│           ├── register.ts         # POST /api/auth/register
│           ├── login.ts            # POST /api/auth/login
│           ├── logout.ts           # POST /api/auth/logout
│           └── account.ts          # DELETE /api/auth/account
```

### Schemat walidacji (auth.schema.ts)

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

### Serwis autentykacji (auth.service.ts)

```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type {
  AuthRegisterResponseDTO,
  AuthLoginResponseDTO,
  MessageResponseDTO,
} from "../../types";

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export function createAuthService(supabase: SupabaseClient) {
  return {
    async register(email: string, password: string): Promise<AuthRegisterResponseDTO>,
    async login(email: string, password: string): Promise<AuthLoginResponseDTO>,
    async logout(): Promise<MessageResponseDTO>,
  };
}

// Osobna funkcja dla operacji admin (wymaga Service Role Key)
export async function deleteUserAccount(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<MessageResponseDTO>;
```

### Wzorzec obsługi błędów w endpointach

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request body
    const body = await request.json();
    
    // 2. Validate with Zod schema
    const parseResult = schema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: parseResult.error.errors[0].message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // 3. Call service
    const result = await service.method(parseResult.data);
    
    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200, // lub 201 dla register
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.statusCode, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### Konfiguracja Supabase Admin Client

Dla operacji `deleteUser` wymagany jest klient z Service Role Key:

```typescript
// src/db/supabase.admin.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function getSupabaseAdminClient() {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase admin credentials");
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

---

## Kolejność implementacji

1. **Faza 1: Przygotowanie infrastruktury**
   - Utworzyć `src/lib/schemas/auth.schema.ts`
   - Utworzyć `src/lib/services/auth.service.ts` (struktura)
   - Utworzyć `src/db/supabase.admin.ts` (dla deleteUser)

2. **Faza 2: Implementacja endpointów publicznych**
   - POST /api/auth/register
   - POST /api/auth/login

3. **Faza 3: Implementacja endpointów chronionych**
   - POST /api/auth/logout
   - DELETE /api/auth/account

4. **Faza 4: Testowanie**
   - Testy manualne wszystkich ścieżek sukcesu
   - Testy wszystkich scenariuszy błędów
   - Weryfikacja CASCADE DELETE

---

## Podsumowanie

Plan wdrożenia obejmuje 4 endpointy autentykacji zgodne ze specyfikacją API. Implementacja wykorzystuje:
- Supabase Auth do zarządzania użytkownikami
- Zod do walidacji danych wejściowych
- Wzorzec serwisu dla logiki biznesowej
- Istniejące typy DTO z `src/types.ts`
- Zgodność z zasadami implementacji (early returns, guard clauses, error handling)

Kluczowe aspekty bezpieczeństwa są adresowane przez Supabase Auth, a dodatkowe zabezpieczenia (rate limiting) mogą być dodane w przyszłości.
