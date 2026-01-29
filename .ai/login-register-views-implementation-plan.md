# Plan implementacji widoków Logowania i Rejestracji

## 1. Przegląd

Widoki logowania i rejestracji stanowią punkt wejścia do aplikacji 10xCards dla użytkowników. Ich głównym celem jest umożliwienie bezpiecznego uwierzytelnienia istniejących użytkowników oraz rejestracji nowych kont. Oba widoki są ze sobą powiązane poprzez linki nawigacyjne i dzielą wspólną strukturę wizualną.

Widoki te realizują historyjkę użytkownika US-001, która wymaga:
- Utworzenia konta za pomocą unikalnego adresu e-mail
- Logowania do istniejącego konta
- Wyświetlania czytelnych komunikatów o błędach
- Zachowywania sesji przy odświeżeniu strony

## 2. Routing widoku

| Widok | Ścieżka | Typ strony | Przekierowanie po sukcesie |
|-------|---------|------------|---------------------------|
| Logowanie | `/login` | SSG (statyczna) | `/generator` |
| Rejestracja | `/register` | SSG (statyczna) | `/generator` |

Obie strony powinny przekierowywać zalogowanych użytkowników do `/generator` przed renderowaniem formularza.

## 3. Struktura komponentów

```
src/
├── pages/
│   ├── login.astro              # Strona logowania
│   └── register.astro           # Strona rejestracji
├── components/
│   └── auth/
│       ├── LoginForm.tsx        # Formularz logowania (React, client:load)
│       ├── RegisterForm.tsx     # Formularz rejestracji (React, client:load)
│       └── AuthFormWrapper.tsx  # Wspólny wrapper dla formularzy (opcjonalnie)
└── lib/
    └── hooks/
        └── useAuthForm.ts       # Hook do obsługi formularzy auth
```

### Hierarchia komponentów

```
login.astro
└── LoginForm (client:load)
    ├── Input (email)
    ├── Input (password)
    ├── Button (submit)
    └── Link (do /register)

register.astro
└── RegisterForm (client:load)
    ├── Input (email)
    ├── Input (password)
    ├── PasswordRequirements
    ├── Button (submit)
    └── Link (do /login)
```

## 4. Szczegóły komponentów

### 4.1. LoginForm

**Opis komponentu:**
Interaktywny formularz logowania obsługujący walidację pól, wysyłanie żądania do API oraz obsługę błędów. Komponent renderowany po stronie klienta (`client:load`).

**Główne elementy:**
- `<form>` z obsługą `onSubmit`
- `<Input>` dla pola email z etykietą i komunikatem błędu
- `<Input type="password">` dla pola hasła z etykietą i komunikatem błędu
- `<Button type="submit">` z obsługą stanu ładowania
- `<a>` lub `<Link>` do strony rejestracji

**Obsługiwane interakcje:**
- `onChange` na polach input - aktualizacja stanu formularza
- `onSubmit` na formularzu - walidacja i wysłanie żądania POST `/api/auth/login`
- `onBlur` na polach - walidacja pojedynczego pola (opcjonalnie)

**Obsługiwana walidacja:**
- Email: wymagany, poprawny format email (regex lub walidacja Zod)
- Hasło: wymagane, niepuste

**Typy:**
- `LoginFormData` - stan formularza (email, password)
- `LoginFormErrors` - błędy walidacji (email?, password?, general?)
- `LoginCommand` - komenda wysyłana do API (z `src/types.ts`)
- `AuthLoginResponseDTO` - odpowiedź API (z `src/types.ts`)

**Propsy:**
```typescript
interface LoginFormProps {
  redirectUrl?: string; // domyślnie "/generator"
}
```

### 4.2. RegisterForm

**Opis komponentu:**
Interaktywny formularz rejestracji z walidacją siły hasła, obsługą błędów walidacji po stronie klienta i serwera, oraz wyświetlaniem wymagań hasła.

**Główne elementy:**
- `<form>` z obsługą `onSubmit`
- `<Input>` dla pola email z etykietą i komunikatem błędu
- `<Input type="password">` dla pola hasła z etykietą i komunikatem błędu
- `<PasswordRequirements>` - komponent wyświetlający wymagania hasła
- `<Button type="submit">` z obsługą stanu ładowania
- `<a>` lub `<Link>` do strony logowania

**Obsługiwane interakcje:**
- `onChange` na polach input - aktualizacja stanu formularza i walidacja w czasie rzeczywistym
- `onSubmit` na formularzu - walidacja i wysłanie żądania POST `/api/auth/register`
- `onFocus` / `onBlur` na polu hasła - pokazanie/ukrycie wymagań hasła

**Obsługiwana walidacja:**
- Email: wymagany, poprawny format email
- Hasło: wymagane, minimum 8 znaków

**Typy:**
- `RegisterFormData` - stan formularza (email, password)
- `RegisterFormErrors` - błędy walidacji (email?, password?, general?)
- `RegisterCommand` - komenda wysyłana do API (z `src/types.ts`)
- `AuthRegisterResponseDTO` - odpowiedź API (z `src/types.ts`)

**Propsy:**
```typescript
interface RegisterFormProps {
  redirectUrl?: string; // domyślnie "/generator"
}
```

### 4.3. PasswordRequirements (komponent pomocniczy)

**Opis komponentu:**
Komponent wyświetlający listę wymagań hasła z wizualnym wskaźnikiem spełnienia każdego wymagania.

**Główne elementy:**
- Lista (`<ul>`) z wymaganiami
- Każde wymaganie (`<li>`) z ikoną ✓ lub ✗ i tekstem

**Propsy:**
```typescript
interface PasswordRequirementsProps {
  password: string;
  show: boolean;
}
```

### 4.4. Strona login.astro

**Opis:**
Strona Astro renderująca layout z formularzem logowania.

**Główne elementy:**
- Layout bazowy (head, body)
- Nagłówek strony
- `<LoginForm client:load />`
- Stopka (opcjonalnie)

### 4.5. Strona register.astro

**Opis:**
Strona Astro renderująca layout z formularzem rejestracji.

**Główne elementy:**
- Layout bazowy (head, body)
- Nagłówek strony
- `<RegisterForm client:load />`
- Stopka (opcjonalnie)

## 5. Typy

### 5.1. Typy z API (już zdefiniowane w `src/types.ts`)

```typescript
// Komenda logowania
interface LoginCommand {
  email: string;
  password: string;
}

// Komenda rejestracji
interface RegisterCommand {
  email: string;
  password: string;
}

// Odpowiedź logowania
interface AuthLoginResponseDTO {
  user: {
    id: string;
    email: string;
  };
  session: SessionDTO;
}

// Odpowiedź rejestracji
interface AuthRegisterResponseDTO {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  session: SessionDTO;
}

// Dane sesji
interface SessionDTO {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
```

### 5.2. Nowe typy ViewModel dla formularzy

```typescript
// Stan formularza logowania
interface LoginFormState {
  email: string;
  password: string;
}

// Błędy walidacji formularza logowania
interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string; // błąd ogólny z API (np. nieprawidłowe dane)
}

// Stan formularza rejestracji
interface RegisterFormState {
  email: string;
  password: string;
}

// Błędy walidacji formularza rejestracji
interface RegisterFormErrors {
  email?: string;
  password?: string;
  general?: string; // błąd ogólny z API (np. email zajęty)
}

// Wspólny interfejs stanu formularza auth
interface AuthFormUIState {
  isSubmitting: boolean;
  showPassword: boolean; // opcjonalnie, dla toggle widoczności hasła
  showPasswordRequirements: boolean; // tylko dla rejestracji
}

// Odpowiedź błędu z API
interface ApiErrorResponse {
  error: string;
}
```

## 6. Zarządzanie stanem

### 6.1. Stan lokalny komponentu (useState)

Każdy formularz zarządza swoim stanem lokalnie przy użyciu `useState`:

```typescript
// W LoginForm.tsx
const [formData, setFormData] = useState<LoginFormState>({ email: "", password: "" });
const [errors, setErrors] = useState<LoginFormErrors>({});
const [isSubmitting, setIsSubmitting] = useState(false);

// W RegisterForm.tsx
const [formData, setFormData] = useState<RegisterFormState>({ email: "", password: "" });
const [errors, setErrors] = useState<RegisterFormErrors>({});
const [isSubmitting, setIsSubmitting] = useState(false);
const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
```

### 6.2. Custom hook `useAuthForm` (opcjonalnie)

Dla uniknięcia duplikacji logiki można stworzyć customowy hook:

```typescript
// src/lib/hooks/useAuthForm.ts
interface UseAuthFormOptions<T> {
  initialState: T;
  validationSchema: ZodSchema<T>;
  submitUrl: string;
  onSuccess: (response: unknown) => void;
}

function useAuthForm<T extends Record<string, unknown>>({
  initialState,
  validationSchema,
  submitUrl,
  onSuccess,
}: UseAuthFormOptions<T>) {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T | "general", string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof T, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Czyść błąd dla tego pola
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Walidacja
    const result = validationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Wysłanie żądania
    setIsSubmitting(true);
    try {
      const response = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setErrors({ general: errorData.error });
        return;
      }

      const data = await response.json();
      onSuccess(data);
    } catch {
      setErrors({ general: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { formData, errors, isSubmitting, handleChange, handleSubmit };
}
```

## 7. Integracja API

### 7.1. Endpoint logowania

**URL:** `POST /api/auth/login`

**Żądanie (LoginCommand):**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Odpowiedź sukcesu (200 OK - AuthLoginResponseDTO):**
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

**Odpowiedzi błędów:**
- `400 Bad Request`: `{ "error": "Invalid email format" }` lub `{ "error": "Password is required" }`
- `401 Unauthorized`: `{ "error": "Invalid login credentials" }`

### 7.2. Endpoint rejestracji

**URL:** `POST /api/auth/register`

**Żądanie (RegisterCommand):**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Odpowiedź sukcesu (201 Created - AuthRegisterResponseDTO):**
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

**Odpowiedzi błędów:**
- `400 Bad Request`: `{ "error": "Invalid email format" }` lub `{ "error": "Password must be at least 8 characters" }`
- `409 Conflict`: `{ "error": "User already registered" }`

### 7.3. Logika po otrzymaniu odpowiedzi

Po pomyślnym logowaniu lub rejestracji:
1. Sesja jest automatycznie ustawiana przez Supabase (cookies)
2. Przekierowanie użytkownika do `/generator` przy użyciu `window.location.href`

## 8. Interakcje użytkownika

### 8.1. Formularz logowania

| Interakcja | Element | Rezultat |
|------------|---------|----------|
| Wpisanie tekstu w pole email | Input email | Aktualizacja stanu `formData.email`, wyczyszczenie błędu email |
| Wpisanie tekstu w pole hasła | Input password | Aktualizacja stanu `formData.password`, wyczyszczenie błędu hasła |
| Kliknięcie "Zaloguj się" | Button submit | Walidacja → żądanie API → przekierowanie lub wyświetlenie błędu |
| Naciśnięcie Enter w formularzu | Form | Jak kliknięcie "Zaloguj się" |
| Kliknięcie linku rejestracji | Link | Nawigacja do `/register` |

### 8.2. Formularz rejestracji

| Interakcja | Element | Rezultat |
|------------|---------|----------|
| Wpisanie tekstu w pole email | Input email | Aktualizacja stanu, walidacja formatu w czasie rzeczywistym |
| Focus na polu hasła | Input password | Pokazanie komponentu `PasswordRequirements` |
| Wpisanie tekstu w pole hasła | Input password | Aktualizacja stanu, aktualizacja wskaźników wymagań hasła |
| Blur z pola hasła | Input password | Ukrycie `PasswordRequirements` (opcjonalnie) |
| Kliknięcie "Zarejestruj się" | Button submit | Walidacja → żądanie API → przekierowanie lub wyświetlenie błędu |
| Naciśnięcie Enter w formularzu | Form | Jak kliknięcie "Zarejestruj się" |
| Kliknięcie linku logowania | Link | Nawigacja do `/login` |

## 9. Warunki i walidacja

### 9.1. Walidacja po stronie klienta

**Pole email (oba formularze):**
- Warunek: niepuste, poprawny format email
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` lub walidacja Zod `z.string().email()`
- Komunikat błędu: "Nieprawidłowy format adresu email"
- Wpływ na UI: czerwona ramka input, tekst błędu pod polem

**Pole hasło (logowanie):**
- Warunek: niepuste
- Komunikat błędu: "Hasło jest wymagane"
- Wpływ na UI: czerwona ramka input, tekst błędu pod polem

**Pole hasło (rejestracja):**
- Warunek: niepuste, minimum 8 znaków
- Komunikat błędu: "Hasło musi mieć co najmniej 8 znaków"
- Wpływ na UI: czerwona ramka input, tekst błędu pod polem, aktualizacja `PasswordRequirements`

**Przycisk submit:**
- Warunek: `isSubmitting === false`
- Wpływ na UI: `disabled` podczas wysyłania, wyświetlanie spinnera/tekstu "Logowanie..."

### 9.2. Walidacja po stronie serwera (z API)

Walidacja odbywa się w endpoint API z użyciem schematów Zod (`loginSchema`, `registerSchema`).

**Błędy walidacji (400):**
- Mapowanie na pole `errors.email` lub `errors.password` w zależności od treści błędu
- Wyświetlenie inline przy odpowiednim polu

**Błędy biznesowe:**
- 401 (logowanie): Mapowanie na `errors.general` - "Nieprawidłowy email lub hasło"
- 409 (rejestracja): Mapowanie na `errors.email` - "Ten adres email jest już zarejestrowany"

## 10. Obsługa błędów

### 10.1. Scenariusze błędów i ich obsługa

| Scenariusz | Kod HTTP | Obsługa w UI |
|------------|----------|--------------|
| Nieprawidłowy format email | 400 | Inline error pod polem email |
| Hasło za krótkie (rejestracja) | 400 | Inline error pod polem hasła |
| Hasło puste (logowanie) | 400 | Inline error pod polem hasła |
| Nieprawidłowe dane logowania | 401 | Ogólny komunikat błędu nad formularzem |
| Email już zarejestrowany | 409 | Inline error pod polem email |
| Błąd sieci | - | Ogólny komunikat błędu: "Nie można połączyć z serwerem" |
| Błąd serwera | 500 | Ogólny komunikat błędu: "Wystąpił błąd. Spróbuj ponownie później" |
| Timeout żądania | - | Ogólny komunikat błędu z przyciskiem "Spróbuj ponownie" |

### 10.2. Implementacja wyświetlania błędów

```tsx
// Błąd ogólny (nad formularzem)
{errors.general && (
  <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
    {errors.general}
  </div>
)}

// Błąd pola (pod inputem)
<Input
  type="email"
  value={formData.email}
  onChange={(e) => handleChange("email", e.target.value)}
  className={errors.email ? "border-destructive" : ""}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
/>
{errors.email && (
  <p id="email-error" className="mt-1 text-sm text-destructive">
    {errors.email}
  </p>
)}
```

### 10.3. Zachowanie fokusa przy błędach

Po otrzymaniu błędu walidacji lub błędu API:
1. Fokus powinien zostać przeniesiony na pierwsze pole z błędem
2. Dla błędu ogólnego fokus na komunikacie błędu (z `tabIndex={-1}`)
3. Screen reader powinien ogłosić błąd (aria-live lub alert role)

## 11. Kroki implementacji

### Krok 1: Utworzenie komponentów UI (Shadcn/ui)

1.1. Dodanie komponentu `Input` z Shadcn/ui:
```bash
npx shadcn@latest add input
```

1.2. Dodanie komponentu `Label` z Shadcn/ui:
```bash
npx shadcn@latest add label
```

1.3. Weryfikacja, że komponent `Button` jest już dodany (sprawdzenie `src/components/ui/button.tsx`)

### Krok 2: Utworzenie struktury folderów

2.1. Utworzenie folderu `src/components/auth/`

2.2. Utworzenie folderu `src/lib/hooks/` (jeśli nie istnieje)

### Krok 3: Implementacja typów formularzy

3.1. Utworzenie pliku `src/components/auth/types.ts` z typami:
- `LoginFormState`
- `LoginFormErrors`
- `RegisterFormState`
- `RegisterFormErrors`
- `AuthFormUIState`

### Krok 4: Implementacja walidacji po stronie klienta

4.1. Utworzenie pliku `src/lib/schemas/auth-client.schema.ts` z schematami Zod dla walidacji klienta:
- `loginClientSchema` - walidacja formularza logowania
- `registerClientSchema` - walidacja formularza rejestracji

### Krok 5: Implementacja custom hooka (opcjonalnie)

5.1. Utworzenie pliku `src/lib/hooks/useAuthForm.ts`

5.2. Implementacja logiki:
- Zarządzanie stanem formularza
- Walidacja z użyciem Zod
- Wysyłanie żądania do API
- Obsługa błędów
- Przekierowanie po sukcesie

### Krok 6: Implementacja komponentu LoginForm

6.1. Utworzenie pliku `src/components/auth/LoginForm.tsx`

6.2. Implementacja:
- Struktura HTML formularza
- Podłączenie stanu (useState lub useAuthForm)
- Obsługa zdarzeń (onChange, onSubmit)
- Wyświetlanie błędów inline
- Stan ładowania przycisku
- Link do rejestracji

6.3. Stylowanie z użyciem Tailwind CSS:
- Responsywność (mobile-first)
- Dostępność (etykiety, aria-attributes)
- Focus states

### Krok 7: Implementacja komponentu RegisterForm

7.1. Utworzenie pliku `src/components/auth/RegisterForm.tsx`

7.2. Implementacja analogiczna do LoginForm z dodatkiem:
- Komponent `PasswordRequirements`
- Walidacja siły hasła w czasie rzeczywistym
- Obsługa błędu 409 (email zajęty)

7.3. Utworzenie komponentu `PasswordRequirements`:
- Lista wymagań hasła
- Wizualne wskaźniki spełnienia (ikony ✓/✗)
- Animacja pokazywania/ukrywania

### Krok 8: Implementacja stron Astro

8.1. Utworzenie pliku `src/pages/login.astro`:
- Import Layout bazowego
- Meta tags (title, description)
- Komponent `<LoginForm client:load />`
- Odpowiednie style i struktura

8.2. Utworzenie pliku `src/pages/register.astro`:
- Import Layout bazowego
- Meta tags (title, description)
- Komponent `<RegisterForm client:load />`
- Odpowiednie style i struktura

### Krok 9: Dostępność (a11y)

9.1. Weryfikacja i dodanie:
- `aria-labelledby` dla pól formularza
- `aria-invalid` dla pól z błędami
- `aria-describedby` dla komunikatów błędów
- `role="alert"` dla błędów ogólnych
- Focus management po błędach
- Skip link (jeśli potrzebny)

### Krok 10: Testy manualne

10.1. Testy funkcjonalne:
- Logowanie z poprawnymi danymi → przekierowanie do `/generator`
- Logowanie z błędnymi danymi → komunikat błędu
- Rejestracja nowego użytkownika → przekierowanie do `/generator`
- Rejestracja z istniejącym emailem → komunikat błędu
- Walidacja pól w czasie rzeczywistym

10.2. Testy dostępności:
- Nawigacja klawiaturą (Tab, Shift+Tab, Enter)
- Screen reader (ogłaszanie etykiet i błędów)
- Kontrast kolorów

10.3. Testy responsywności:
- Widok mobilny (< 768px)
- Widok desktop (≥ 768px)

### Krok 11: Przekierowanie zalogowanych użytkowników

11.1. Dodanie logiki w stronach Astro sprawdzającej sesję użytkownika:
- Jeśli użytkownik jest zalogowany → przekierowanie do `/generator`
- Jeśli nie → renderowanie formularza

```astro
---
// W login.astro i register.astro
const { locals } = Astro;
const { data: { session } } = await locals.supabase.auth.getSession();

if (session) {
  return Astro.redirect("/generator");
}
---
```

### Krok 12: Finalizacja i code review

12.1. Przegląd kodu pod kątem:
- Zgodności z konwencjami projektu
- Poprawności typów TypeScript
- Obsługi wszystkich przypadków brzegowych
- Czytelności i maintainability

12.2. Usunięcie nieużywanego kodu i console.log

12.3. Dokumentacja komponentów (JSDoc comments)
