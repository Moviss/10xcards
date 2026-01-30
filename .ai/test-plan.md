# Plan Testów - 10xCards

## 1. Wprowadzenie i cele testowania

### 1.1 Cel dokumentu
Niniejszy dokument definiuje kompleksową strategię testowania aplikacji 10xCards - platformy do automatycznego generowania fiszek edukacyjnych z wykorzystaniem sztucznej inteligencji oraz nauki metodą powtórek rozłożonych w czasie (algorytm SM-2).

### 1.2 Cele testowania
- **Weryfikacja poprawności funkcjonalnej** wszystkich modułów aplikacji
- **Zapewnienie bezpieczeństwa** danych użytkowników i procesów autentykacji
- **Walidacja algorytmu SM-2** implementującego system powtórek
- **Sprawdzenie integracji z zewnętrznym API** (OpenRouter/AI)
- **Potwierdzenie responsywności** interfejsu na różnych urządzeniach
- **Weryfikacja dostępności** (accessibility) zgodnie z WCAG 2.1

### 1.3 Zakres projektu
Aplikacja 10xCards to MVP składające się z:
- Modułu autentykacji (rejestracja, logowanie, usuwanie konta)
- Generatora fiszek AI z obszarem staging
- Systemu zarządzania fiszkami (CRUD)
- Modułu nauki z algorytmem SM-2
- Landing page

---

## 2. Zakres testów

### 2.1 W zakresie testów

| Obszar | Komponenty | Priorytet |
|--------|------------|-----------|
| Autentykacja | Login, Register, Logout, Delete Account | Krytyczny |
| Generator AI | SourceTextForm, StagingArea, ProposalCard, BulkActions | Krytyczny |
| Fiszki | FlashcardsContainer, CRUD operations, Pagination, Search | Krytyczny |
| Nauka | StudyContainer, SM-2 algorithm, Session management | Krytyczny |
| API Endpoints | `/api/auth/*`, `/api/flashcards/*`, `/api/study/*`, `/api/generations` | Krytyczny |
| Serwisy | auth.service, flashcard.service, study.service, generation.service, openrouter.service | Krytyczny |
| Walidacja | Zod schemas (auth, flashcard, generation, study) | Wysoki |
| Hooki React | useAuthForm, useFlashcards, useGenerator, useStudySession, useNavigation | Wysoki |
| Komponenty UI | Shadcn/ui components, custom components | Średni |
| Nawigacja | TopNav, MobileNav, AccountDropdown | Średni |
| Landing Page | HeroSection, FeaturesSection, CTAButtons | Niski |

### 2.2 Poza zakresem testów
- Testy wydajności Supabase (infrastruktura zewnętrzna)
- Testy penetracyjne OpenRouter API
- Testy obciążeniowe produkcyjne
- Testowanie CI/CD pipeline (GitHub Actions)

---

## 3. Typy testów do przeprowadzenia

### 3.1 Testy jednostkowe (Unit Tests)

#### 3.1.1 Serwisy backendowe
```
Lokalizacja: src/lib/services/
Narzędzie: Vitest
Pokrycie docelowe: 90%
```

**auth.service.ts**
- `register()` - sukces, użytkownik już istnieje, błąd serwera
- `login()` - poprawne dane, niepoprawne hasło, nieistniejący użytkownik
- `logout()` - sukces, błąd sesji
- `deleteUserAccount()` - sukces, użytkownik nie istnieje

**flashcard.service.ts**
- `getFlashcards()` - paginacja, wyszukiwanie, sortowanie, puste wyniki
- `getFlashcardById()` - istniejąca fiszka, nieistniejąca fiszka
- `createFlashcard()` - poprawne dane, walidacja
- `createFlashcardsBatch()` - sukces, nieistniejący generation_log
- `updateFlashcard()` - częściowa aktualizacja, pełna aktualizacja
- `deleteFlashcard()` - sukces, nieistniejąca fiszka
- `resetProgress()` - reset wartości SM-2

**study.service.ts**
- `getStudySession()` - karty do powtórki, nowe karty, brak kart
- `submitReview()` - zapamiętano, nie zapamiętano
- `calculateSM2Parameters()` - wszystkie ścieżki algorytmu SM-2:
  - Pierwsza powtórka (repetitions=0) → interval=1
  - Druga powtórka (repetitions=1) → interval=6
  - Kolejne powtórki → interval * ease_factor
  - Nie zapamiętano → reset repetitions, zmniejszenie ease_factor

**generation.service.ts**
- `generateFlashcards()` - sukces, błąd API, timeout
- `createGenerationLog()` - tworzenie wpisu
- `updateGenerationLog()` - aktualizacja statystyk

**openrouter.service.ts**
- `generateFlashcards()` - poprawna odpowiedź, błędny JSON
- `callOpenrouterAPI()` - sukces, 429 rate limit, 5xx, timeout
- `parseResponse()` - poprawny format, brak content, nieprawidłowy JSON

#### 3.1.2 Schematy walidacji (Zod)
```
Lokalizacja: src/lib/schemas/
Narzędzie: Vitest
Pokrycie docelowe: 100%
```

**auth.schema.ts**
- `registerSchema` - poprawny email, niepoprawny email, hasło <8 znaków
- `loginSchema` - wymagane pola, format email

**flashcard.schema.ts**
- `flashcardsQuerySchema` - domyślne wartości, limity, sortowanie
- `createFlashcardSchema` - puste pola, trim, walidacja
- `updateFlashcardSchema` - częściowa aktualizacja, wymagane przynajmniej jedno pole
- `createFlashcardsBatchSchema` - UUID generation_log_id, pusta tablica

**generation.schema.ts**
- `generateFlashcardsSchema` - min 1000 znaków, max 10000 znaków
- `parsedFlashcardsResponseSchema` - struktura odpowiedzi AI

**study.schema.ts**
- `submitReviewSchema` - UUID flashcard_id, boolean remembered

#### 3.1.3 Hooki React
```
Lokalizacja: src/lib/hooks/
Narzędzie: React Testing Library + Vitest
Pokrycie docelowe: 85%
```

**useAuthForm.ts**
- Inicjalizacja stanu formularza
- Walidacja po stronie klienta
- Obsługa błędów API (409, 401, 500)
- Zapis tokena w localStorage
- Przekierowanie po sukcesie

**useFlashcards.ts**
- Pobieranie fiszek z paginacją
- Debouncing wyszukiwania (300ms)
- Otwieranie/zamykanie modali
- Operacje CRUD z optimistic updates
- Obsługa błędów i przekierowanie przy 401

**useGenerator.ts**
- Walidacja długości tekstu źródłowego
- Persystencja stanu w localStorage
- Zarządzanie propozycjami (accept, reject, edit)
- Timer elapsed time podczas generowania
- Zapis zaakceptowanych propozycji

**useStudySession.ts**
- Pobieranie sesji nauki
- Maszyna stanów (idle → loading → ready → studying → completed/interrupted)
- Obliczanie postępu i podsumowania
- Skróty klawiszowe (Space, Enter, Backspace, Escape)

**useNavigation.ts**
- Wylogowanie z czyszczeniem tokena
- Dialog usuwania konta
- Menu mobilne

#### 3.1.4 Utility functions
```
Lokalizacja: src/lib/
Narzędzie: Vitest
```

**utils.ts**
- `cn()` - łączenie klas Tailwind

**auth.client.ts**
- `getAuthToken()`, `setAuthToken()`, `clearAuthToken()`
- `getAuthHeaders()` - z tokenem i bez
- `authenticatedFetch()` - dodawanie nagłówków
- `getUserEmailFromToken()` - dekodowanie JWT

**auth.helper.ts**
- `authenticateRequest()` - brak nagłówka, niepoprawny token, sukces
- `isAuthError()` - type guard

### 3.2 Testy integracyjne (Integration Tests)

#### 3.2.1 API Endpoints
```
Lokalizacja: src/pages/api/
Narzędzie: Vitest + supertest lub fetch mock
```

**Auth API**
| Endpoint | Metoda | Scenariusze |
|----------|--------|-------------|
| `/api/auth/register` | POST | 201 sukces, 400 walidacja, 409 duplikat |
| `/api/auth/login` | POST | 200 sukces, 400 walidacja, 401 błędne dane |
| `/api/auth/logout` | POST | 200 sukces, 401 nieautoryzowany |
| `/api/auth/account` | DELETE | 200 sukces, 401 nieautoryzowany |

**Flashcards API**
| Endpoint | Metoda | Scenariusze |
|----------|--------|-------------|
| `/api/flashcards` | GET | 200 lista z paginacją, 401 |
| `/api/flashcards` | POST | 201 utworzono, 400 walidacja, 401 |
| `/api/flashcards/:id` | GET | 200 fiszka, 404 nie znaleziono, 401 |
| `/api/flashcards/:id` | PUT | 200 zaktualizowano, 404, 400, 401 |
| `/api/flashcards/:id` | DELETE | 200 usunięto, 404, 401 |
| `/api/flashcards/:id/reset-progress` | POST | 200 zresetowano, 404, 401 |
| `/api/flashcards/batch` | POST | 201 utworzono, 404 generation_log, 400, 401 |

**Study API**
| Endpoint | Metoda | Scenariusze |
|----------|--------|-------------|
| `/api/study/session` | GET | 200 sesja, 200 pusta sesja, 401 |
| `/api/study/review` | POST | 200 review, 404 fiszka, 400 walidacja, 401 |

**Generations API**
| Endpoint | Metoda | Scenariusze |
|----------|--------|-------------|
| `/api/generations` | GET | 200 lista logów, 401 |
| `/api/generations` | POST | 200 wygenerowano, 400 walidacja, 502 błąd AI, 503 rate limit, 401 |

#### 3.2.2 Integracja z Supabase
```
Narzędzie: Vitest + Supabase local (Docker)
```

- Połączenie z bazą danych
- Operacje CRUD na tabelach `flashcards` i `generation_logs`
- Row Level Security (RLS) - użytkownik widzi tylko swoje dane
- Autentykacja i zarządzanie sesją
- Transakcje przy batch operations

#### 3.2.3 Integracja komponentów React z hookami
```
Narzędzie: React Testing Library + MSW
```

- FlashcardsContainer + useFlashcards
- GeneratorContainer + useGenerator
- StudyContainer + useStudySession
- Navigation + useNavigation

### 3.3 Testy E2E (End-to-End Tests)

```
Narzędzie: Playwright
Środowisko: Staging z testową bazą danych
```

#### 3.3.1 Scenariusze krytyczne

**Flow rejestracji i logowania**
1. Użytkownik wchodzi na stronę główną
2. Klika "Zarejestruj się"
3. Wypełnia formularz (email, hasło)
4. Zostaje przekierowany do generatora
5. Wylogowuje się
6. Loguje się ponownie
7. Widzi swoje dane

**Flow generowania fiszek**
1. Zalogowany użytkownik wchodzi do generatora
2. Wkleja tekst (>1000 znaków)
3. Klika "Generuj fiszki"
4. Widzi propozycje w staging area
5. Akceptuje niektóre, odrzuca inne, edytuje jedną
6. Klika "Zapisz zaakceptowane"
7. Przechodzi do "Moje fiszki" i widzi zapisane

**Flow nauki**
1. Użytkownik z fiszkami wchodzi do "Nauka"
2. Widzi ekran startowy ze statystykami
3. Klika "Rozpocznij sesję"
4. Przegląda fiszki, ocenia (pamiętam/nie pamiętam)
5. Po zakończeniu widzi podsumowanie
6. Wraca do fiszek

**Flow zarządzania fiszkami**
1. Użytkownik przegląda listę fiszek
2. Wyszukuje po frazie
3. Sortuje wyniki
4. Edytuje fiszkę
5. Resetuje postęp fiszki
6. Usuwa fiszkę
7. Dodaje nową fiszkę ręcznie

#### 3.3.2 Scenariusze negatywne

- Próba dostępu do chronionych stron bez logowania → przekierowanie do login
- Próba rejestracji z istniejącym emailem → błąd 409
- Próba generowania z tekstem <1000 znaków → walidacja
- Wygaśnięcie sesji podczas pracy → przekierowanie do login
- Timeout API podczas generowania → komunikat błędu

### 3.4 Testy komponentów UI

```
Narzędzie: Storybook + Chromatic (visual regression)
```

#### 3.4.1 Komponenty do testowania

**Komponenty formularzy**
- LoginForm - stany: idle, submitting, error
- RegisterForm - stany: idle, submitting, error, password requirements
- SourceTextForm - stany: valid, invalid, generating

**Komponenty fiszek**
- FlashcardCard - warianty: AI generated, manual
- FlashcardTableRow - warianty: AI badge, no badge
- FlashcardAddModal - stany: open, validation error, saving
- FlashcardEditModal - stany: open, saving, deleting, resetting

**Komponenty generatora**
- ProposalCard - stany: pending, accepted, rejected, edited
- StagingArea - warianty: z propozycjami, pusta
- GenerationLoader - fazy: spinner, skeleton, long wait

**Komponenty nauki**
- StudyFlashcard - stany: front only, revealed
- StudyProgress - warianty: początek, w trakcie, koniec
- StudySummary - warianty: completed, interrupted
- AnswerButtons - stany: enabled, disabled (submitting)

**Komponenty nawigacji**
- TopNav - desktop
- MobileNav - mobile, open/closed
- AccountDropdown - open/closed
- DeleteAccountDialog - open, confirming

### 3.5 Testy dostępności (Accessibility Tests)

```
Narzędzie: axe-core + Playwright
Standard: WCAG 2.1 AA
```

#### 3.5.1 Obszary do weryfikacji

- **Nawigacja klawiaturą** - wszystkie interaktywne elementy dostępne przez Tab
- **Focus management** - widoczny focus ring, logiczna kolejność
- **ARIA labels** - przyciski, linki, formularze
- **Kontrast kolorów** - minimum 4.5:1 dla tekstu
- **Screen reader** - poprawne role, aria-live dla dynamicznych zmian
- **Skip links** - "Przejdź do treści głównej"
- **Formularze** - powiązanie label z input, komunikaty błędów

#### 3.5.2 Komponenty krytyczne dla a11y

| Komponent | Wymagania |
|-----------|-----------|
| StudyFlashcard | aria-live dla odsłonięcia odpowiedzi, role="button" |
| AnswerButtons | aria-describedby dla podpowiedzi |
| Pagination | aria-current dla aktywnej strony |
| SearchInput | aria-label, ogłaszanie wyników |
| Modal dialogs | focus trap, aria-modal, zamykanie Escape |
| Toast notifications | aria-live="polite" |

### 3.6 Testy responsywności

```
Narzędzie: Playwright + różne viewporty
```

#### 3.6.1 Breakpointy do testowania

| Breakpoint | Szerokość | Urządzenie |
|------------|-----------|------------|
| Mobile S | 320px | iPhone SE |
| Mobile M | 375px | iPhone 12 |
| Mobile L | 425px | iPhone 12 Pro Max |
| Tablet | 768px | iPad |
| Desktop | 1024px | Laptop |
| Desktop L | 1440px | Monitor |

#### 3.6.2 Elementy responsywne

- Nawigacja: TopNav (desktop) ↔ MobileNav (mobile)
- Tabela fiszek: FlashcardsTable (desktop) ↔ FlashcardCardList (mobile)
- Staging Area: grid 2 kolumny (desktop) ↔ 1 kolumna (mobile)
- Modale: pełna szerokość (mobile) ↔ max-width (desktop)

### 3.7 Testy wydajnościowe

```
Narzędzie: Lighthouse CI + Web Vitals
```

#### 3.7.1 Metryki docelowe

| Metryka | Cel | Strona |
|---------|-----|--------|
| LCP | < 2.5s | Wszystkie |
| FID | < 100ms | Wszystkie |
| CLS | < 0.1 | Wszystkie |
| TTI | < 3.5s | Generator, Flashcards |
| Bundle size | < 200KB (gzipped) | Initial load |

#### 3.7.2 Scenariusze wydajnościowe

- Ładowanie listy 1000 fiszek z paginacją
- Generowanie fiszek (oczekiwanie na AI)
- Sesja nauki z 50 fiszkami
- Wyszukiwanie z debouncing

---

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Moduł autentykacji

#### TC-AUTH-001: Rejestracja nowego użytkownika
**Warunki wstępne:** Użytkownik nie jest zalogowany
**Kroki:**
1. Przejdź do `/register`
2. Wprowadź poprawny email i hasło (min. 8 znaków)
3. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- Status 201 z API
- Token zapisany w localStorage
- Przekierowanie do `/generator`
- Nawigacja pokazuje email użytkownika

#### TC-AUTH-002: Logowanie z nieprawidłowymi danymi
**Warunki wstępne:** Użytkownik zarejestrowany
**Kroki:**
1. Przejdź do `/login`
2. Wprowadź poprawny email i nieprawidłowe hasło
3. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- Status 401 z API
- Komunikat "Nieprawidłowy email lub hasło"
- Użytkownik pozostaje na stronie logowania

#### TC-AUTH-003: Usunięcie konta
**Warunki wstępne:** Użytkownik zalogowany
**Kroki:**
1. Kliknij na dropdown konta
2. Wybierz "Usuń konto"
3. Wpisz "USUŃ" w polu potwierdzenia
4. Kliknij "Usuń konto"

**Oczekiwany rezultat:**
- Konto usunięte z bazy
- Wszystkie fiszki użytkownika usunięte (CASCADE)
- Token usunięty z localStorage
- Przekierowanie do `/`

### 4.2 Generator fiszek AI

#### TC-GEN-001: Generowanie fiszek z poprawnym tekstem
**Warunki wstępne:** Użytkownik zalogowany
**Kroki:**
1. Przejdź do `/generator`
2. Wklej tekst 1500 znaków
3. Kliknij "Generuj fiszki"

**Oczekiwany rezultat:**
- Wyświetla się loader z fazami (spinner → skeleton → long wait)
- Po otrzymaniu odpowiedzi wyświetla się staging area
- Propozycje mają status "pending"
- Stan zapisany w localStorage

#### TC-GEN-002: Walidacja długości tekstu
**Warunki wstępne:** Użytkownik zalogowany
**Kroki:**
1. Wklej tekst 500 znaków
2. Spróbuj kliknąć "Generuj fiszki"

**Oczekiwany rezultat:**
- Przycisk nieaktywny
- Pasek postępu pokazuje <50%
- Komunikat "Potrzebujesz jeszcze X znaków"

#### TC-GEN-003: Zarządzanie propozycjami w staging area
**Warunki wstępne:** Wygenerowane propozycje w staging area
**Kroki:**
1. Zaakceptuj pierwszą propozycję
2. Odrzuć drugą propozycję
3. Edytuj trzecią propozycję i zapisz
4. Kliknij "Akceptuj wszystkie"
5. Kliknij "Zapisz zaakceptowane"

**Oczekiwany rezultat:**
- Propozycja 1: status "accepted"
- Propozycja 2: status "rejected"
- Propozycja 3: status "accepted", badge "edytowana"
- Pozostałe: status "accepted"
- Po zapisie: fiszki w bazie, localStorage wyczyszczony

#### TC-GEN-004: Obsługa błędu API podczas generowania
**Warunki wstępne:** Mockowany błąd OpenRouter (503)
**Kroki:**
1. Wklej poprawny tekst
2. Kliknij "Generuj fiszki"

**Oczekiwany rezultat:**
- Toast z komunikatem "Przekroczono limit zapytań"
- Przycisk "Spróbuj ponownie" w toast
- Tekst źródłowy zachowany

### 4.3 Zarządzanie fiszkami

#### TC-FLASH-001: Wyświetlanie listy fiszek z paginacją
**Warunki wstępne:** Użytkownik ma 50 fiszek
**Kroki:**
1. Przejdź do `/flashcards`
2. Sprawdź wyświetlaną liczbę
3. Przejdź do strony 2
4. Przejdź do strony 3

**Oczekiwany rezultat:**
- Strona 1: 20 fiszek
- Paginacja pokazuje "Strona 1 z 3 (50 fiszek)"
- Przełączanie stron działa poprawnie

#### TC-FLASH-002: Wyszukiwanie fiszek
**Warunki wstępne:** Użytkownik ma fiszki z różną treścią
**Kroki:**
1. Wpisz frazę w pole wyszukiwania
2. Poczekaj 300ms (debounce)

**Oczekiwany rezultat:**
- Lista przefiltrowana po front i back
- Paginacja zaktualizowana
- Przycisk "Wyczyść filtr" widoczny

#### TC-FLASH-003: Edycja fiszki
**Warunki wstępne:** Istnieje fiszka do edycji
**Kroki:**
1. Kliknij na fiszkę w tabeli/liście
2. Zmień treść front i back
3. Kliknij "Zapisz zmiany"

**Oczekiwany rezultat:**
- Modal zamknięty
- Lista zaktualizowana (optimistic update)
- Toast "Zmiany zostały zapisane!"

#### TC-FLASH-004: Reset postępu nauki
**Warunki wstępne:** Fiszka z postępem (interval > 0)
**Kroki:**
1. Otwórz modal edycji fiszki
2. Kliknij "Resetuj postęp"
3. Potwierdź w dialogu

**Oczekiwany rezultat:**
- interval = 0
- ease_factor = 2.5
- repetitions = 0
- next_review_date = dzisiaj
- Toast "Postęp nauki został zresetowany!"

### 4.4 Moduł nauki (SM-2)

#### TC-STUDY-001: Rozpoczęcie sesji nauki
**Warunki wstępne:** Użytkownik ma fiszki do powtórki i nowe
**Kroki:**
1. Przejdź do `/study`
2. Sprawdź statystyki na ekranie startowym
3. Kliknij "Rozpocznij sesję"

**Oczekiwany rezultat:**
- Statystyki: nowe fiszki (max 20), karty do powtórki
- Po kliknięciu: pierwsza fiszka wyświetlona (front)
- Pasek postępu pokazuje 0%

#### TC-STUDY-002: Ocena fiszki - Pamiętam
**Warunki wstępne:** Sesja nauki w trakcie, fiszka odsłonięta
**Kroki:**
1. Kliknij "Pamiętam" (lub Enter)

**Oczekiwany rezultat:**
- Następna fiszka wyświetlona
- Licznik "Pamiętam" +1
- Pasek postępu zaktualizowany
- API wywołane w tle

#### TC-STUDY-003: Algorytm SM-2 - pierwsza powtórka
**Warunki wstępne:** Nowa fiszka (repetitions=0, interval=0)
**Kroki:**
1. Oceń jako "Pamiętam"

**Oczekiwany rezultat:**
- repetitions = 1
- interval = 1
- ease_factor = 2.6 (2.5 + 0.1)
- next_review_date = jutro

#### TC-STUDY-004: Algorytm SM-2 - nie pamiętam
**Warunki wstępne:** Fiszka po kilku powtórkach (repetitions=3, ease_factor=2.7)
**Kroki:**
1. Oceń jako "Nie pamiętam"

**Oczekiwany rezultat:**
- repetitions = 0
- interval = 1
- ease_factor = 2.5 (2.7 - 0.2)
- next_review_date = jutro

#### TC-STUDY-005: Przerwanie sesji
**Warunki wstępne:** Sesja w trakcie, oceniono 5 z 10 fiszek
**Kroki:**
1. Kliknij "Przerwij sesję" (lub Escape)

**Oczekiwany rezultat:**
- Podsumowanie pokazuje 5 przejrzanych
- Status "Sesja przerwana"
- Ocenione fiszki zapisane w bazie

#### TC-STUDY-006: Skróty klawiszowe
**Warunki wstępne:** Sesja nauki w trakcie
**Kroki:**
1. Naciśnij Spację (odsłonięcie)
2. Naciśnij Enter (pamiętam)
3. Na następnej fiszce: Spacja → Backspace (nie pamiętam)

**Oczekiwany rezultat:**
- Spacja: odsłania odpowiedź
- Enter: zapisuje "pamiętam", następna fiszka
- Backspace: zapisuje "nie pamiętam", następna fiszka

### 4.5 Nawigacja i sesja

#### TC-NAV-001: Przekierowanie nieautoryzowanego użytkownika
**Warunki wstępne:** Użytkownik niezalogowany
**Kroki:**
1. Spróbuj wejść na `/flashcards`

**Oczekiwany rezultat:**
- Przekierowanie do `/login`
- Po zalogowaniu: powrót do `/flashcards`

#### TC-NAV-002: Nawigacja mobilna
**Warunki wstępne:** Viewport <768px, użytkownik zalogowany
**Kroki:**
1. Kliknij ikonę menu (hamburger)
2. Kliknij link "Generator"

**Oczekiwany rezultat:**
- Sheet otwiera się z lewej strony
- Linki nawigacyjne widoczne
- Po kliknięciu: menu zamknięte, nawigacja do strony

---

## 5. Środowisko testowe

### 5.1 Środowiska

| Środowisko | Cel | Baza danych | API AI |
|------------|-----|-------------|--------|
| **Local** | Rozwój, testy jednostkowe | Supabase local (Docker) | Mock |
| **Test** | Testy integracyjne, E2E | Supabase projekt testowy | Mock |
| **Staging** | Testy akceptacyjne, UAT | Supabase projekt staging | OpenRouter (limit) |
| **Production** | - | Supabase produkcja | OpenRouter |

### 5.2 Konfiguracja środowiska lokalnego

```bash
# Wymagania
Node.js 22.14.0
Docker (dla Supabase local)
npm

# Instalacja
npm install

# Uruchomienie Supabase local
npx supabase start

# Migracje
npx supabase db reset

# Testy
npm run test        # Unit tests
npm run test:e2e    # E2E tests
```

### 5.3 Dane testowe

**Użytkownicy testowi:**
| Email | Hasło | Rola |
|-------|-------|------|
| test@example.com | TestPassword123! | Użytkownik z fiszkami |
| empty@example.com | TestPassword123! | Użytkownik bez fiszek |
| new@example.com | TestPassword123! | Nowy użytkownik |

**Fixtures:**
- 50 fiszek dla użytkownika testowego
- 10 fiszek AI-generated, 40 manual
- 5 generation_logs z różnymi statystykami
- Fiszki w różnych stanach SM-2

---

## 6. Narzędzia do testowania

### 6.1 Testy jednostkowe i integracyjne

| Narzędzie | Wersja | Przeznaczenie |
|-----------|--------|---------------|
| **Vitest** | 1.x | Test runner, assertions |
| **React Testing Library** | 14.x | Testy komponentów React |
| **MSW** | 2.x | Mockowanie API |
| **@testing-library/user-event** | 14.x | Symulacja interakcji |

### 6.2 Testy E2E

| Narzędzie | Wersja | Przeznaczenie |
|-----------|--------|---------------|
| **Playwright** | 1.x | Browser automation |
| **@playwright/test** | 1.x | Test runner dla Playwright |

### 6.3 Testy wizualne i a11y

| Narzędzie | Wersja | Przeznaczenie |
|-----------|--------|---------------|
| **Storybook** | 8.x | Izolacja komponentów |
| **Chromatic** | - | Visual regression |
| **axe-core** | 4.x | Testy dostępności |
| **@axe-core/playwright** | 4.x | Integracja z Playwright |

### 6.4 Testy wydajnościowe

| Narzędzie | Wersja | Przeznaczenie |
|-----------|--------|---------------|
| **Lighthouse CI** | - | Audyt wydajności |
| **web-vitals** | 3.x | Metryki Core Web Vitals |

### 6.5 CI/CD

| Narzędzie | Przeznaczenie |
|-----------|---------------|
| **GitHub Actions** | Pipeline CI/CD |
| **Codecov** | Raportowanie pokrycia |

### 6.6 Konfiguracja package.json (propozycja)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "lighthouse": "lhci autorun"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitest/coverage-v8": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "axe-core": "^4.8.0",
    "msw": "^2.0.0",
    "vitest": "^1.0.0"
  }
}
```

---

## 7. Harmonogram testów

### 7.1 Faza 1: Przygotowanie (Tydzień 1)

| Dzień | Zadanie |
|-------|---------|
| 1-2 | Konfiguracja narzędzi (Vitest, Playwright, Storybook) |
| 3-4 | Przygotowanie fixtures i mocków |
| 5 | Konfiguracja CI/CD dla testów |

### 7.2 Faza 2: Testy jednostkowe (Tydzień 2-3)

| Tydzień | Obszar | Odpowiedzialność |
|---------|--------|------------------|
| 2 | Serwisy (auth, flashcard, study, generation, openrouter) | Backend QA |
| 2 | Schematy Zod | Backend QA |
| 3 | Hooki React | Frontend QA |
| 3 | Utility functions | Frontend QA |

### 7.3 Faza 3: Testy integracyjne (Tydzień 4)

| Dzień | Obszar |
|-------|--------|
| 1-2 | API Endpoints (Auth, Flashcards) |
| 3-4 | API Endpoints (Study, Generations) |
| 5 | Integracja komponentów z hookami |

### 7.4 Faza 4: Testy E2E (Tydzień 5)

| Dzień | Scenariusze |
|-------|-------------|
| 1 | Flow rejestracji/logowania |
| 2 | Flow generowania fiszek |
| 3 | Flow zarządzania fiszkami |
| 4 | Flow nauki |
| 5 | Scenariusze negatywne |

### 7.5 Faza 5: Testy specjalistyczne (Tydzień 6)

| Dzień | Obszar |
|-------|--------|
| 1-2 | Testy dostępności (a11y) |
| 3 | Testy responsywności |
| 4 | Testy wydajnościowe |
| 5 | Testy wizualne (Storybook/Chromatic) |

### 7.6 Faza 6: Regresja i raportowanie (Tydzień 7)

| Dzień | Zadanie |
|-------|---------|
| 1-3 | Pełna regresja |
| 4 | Naprawa krytycznych błędów |
| 5 | Raport końcowy |

---

## 8. Kryteria akceptacji testów

### 8.1 Kryteria wejścia (Entry Criteria)

- [ ] Kod źródłowy dostępny w repozytorium
- [ ] Środowisko testowe skonfigurowane i działające
- [ ] Dane testowe przygotowane
- [ ] Narzędzia testowe zainstalowane i skonfigurowane
- [ ] Dokumentacja API dostępna

### 8.2 Kryteria wyjścia (Exit Criteria)

#### Testy jednostkowe
- [ ] Pokrycie kodu ≥ 80% (linie)
- [ ] Pokrycie serwisów krytycznych ≥ 90%
- [ ] 100% testów przechodzi
- [ ] Brak błędów krytycznych

#### Testy integracyjne
- [ ] Wszystkie endpointy API przetestowane
- [ ] 100% testów przechodzi
- [ ] Brak błędów blokujących

#### Testy E2E
- [ ] Wszystkie scenariusze krytyczne przetestowane
- [ ] ≥ 95% testów przechodzi
- [ ] Brak błędów krytycznych i wysokich

#### Testy a11y
- [ ] 0 błędów krytycznych (WCAG 2.1 Level A)
- [ ] ≤ 5 błędów poważnych (WCAG 2.1 Level AA)

#### Testy wydajnościowe
- [ ] LCP < 2.5s na wszystkich stronach
- [ ] Lighthouse Performance Score ≥ 90

### 8.3 Klasyfikacja defektów

| Priorytet | Opis | SLA naprawy |
|-----------|------|-------------|
| **Krytyczny (P1)** | Blokuje główną funkcjonalność, brak workaround | 24h |
| **Wysoki (P2)** | Poważny problem, istnieje workaround | 3 dni |
| **Średni (P3)** | Problem funkcjonalny, nie blokuje | 1 tydzień |
| **Niski (P4)** | Kosmetyczny, UX improvement | 2 tygodnie |

### 8.4 Kryteria akceptacji dla kluczowych funkcjonalności

#### Autentykacja
- Rejestracja działa dla poprawnych danych
- Login zwraca token JWT
- Logout czyści sesję
- Usunięcie konta usuwa wszystkie dane użytkownika

#### Generator AI
- Generowanie działa dla tekstu 1000-10000 znaków
- Staging area poprawnie zarządza propozycjami
- Batch save tworzy fiszki i aktualizuje generation_log
- Obsługa błędów AI (timeout, rate limit) z komunikatami

#### Nauka SM-2
- Algorytm oblicza poprawne wartości interval, ease_factor, repetitions
- Sesja zawiera karty do powtórki i nowe (max 20)
- Podsumowanie pokazuje poprawne statystyki
- Skróty klawiszowe działają

---

## 9. Role i odpowiedzialności w procesie testowania

### 9.1 Zespół testowy

| Rola | Odpowiedzialności |
|------|-------------------|
| **QA Lead** | Planowanie testów, przegląd raportów, eskalacja defektów, raportowanie do stakeholderów |
| **Backend QA Engineer** | Testy jednostkowe serwisów, testy API, testy integracyjne z Supabase |
| **Frontend QA Engineer** | Testy komponentów React, testy hooków, testy E2E, testy a11y |
| **Performance Engineer** | Testy wydajnościowe, optymalizacja, monitoring |

### 9.2 Macierz RACI

| Aktywność | QA Lead | Backend QA | Frontend QA | Dev Team |
|-----------|---------|------------|-------------|----------|
| Plan testów | A/R | C | C | I |
| Testy jednostkowe (backend) | I | R | - | C |
| Testy jednostkowe (frontend) | I | - | R | C |
| Testy integracyjne | A | R | R | C |
| Testy E2E | A | C | R | I |
| Testy a11y | A | - | R | C |
| Raportowanie defektów | A | R | R | I |
| Naprawa defektów | I | C | C | R |
| Raport końcowy | R | C | C | I |

*R - Responsible, A - Accountable, C - Consulted, I - Informed*

### 9.3 Komunikacja

| Spotkanie | Częstotliwość | Uczestnicy |
|-----------|---------------|------------|
| Daily standup | Codziennie | Zespół QA |
| Defect triage | 2x tydzień | QA Lead, Tech Lead, PM |
| Test review | Tygodniowo | Zespół QA, Dev Lead |
| Sprint review | Co 2 tygodnie | Cały zespół |

---

## 10. Procedury raportowania błędów

### 10.1 Szablon zgłoszenia defektu

```markdown
## Tytuł defektu
[Krótki, opisowy tytuł]

## Priorytet
[Krytyczny / Wysoki / Średni / Niski]

## Środowisko
- Środowisko: [Local / Test / Staging]
- Przeglądarka: [Chrome 120 / Firefox 121 / Safari 17]
- System: [macOS 14 / Windows 11 / Ubuntu 22]
- Viewport: [Desktop / Mobile]

## Kroki reprodukcji
1. [Krok 1]
2. [Krok 2]
3. [Krok 3]

## Oczekiwany rezultat
[Co powinno się stać]

## Aktualny rezultat
[Co się dzieje]

## Załączniki
- Screenshot / nagranie
- Logi konsoli
- Network trace

## Dodatkowe informacje
[Obserwacje, workaround]
```

### 10.2 Workflow defektu

```
New → Triage → Assigned → In Progress → In Review → Verified → Closed
                ↓
            Won't Fix / Duplicate / Cannot Reproduce
```

### 10.3 Narzędzia do zarządzania defektami

- **GitHub Issues** - główne repozytorium defektów
- **Labels:** `bug`, `priority:critical`, `priority:high`, `priority:medium`, `priority:low`, `area:auth`, `area:flashcards`, `area:generator`, `area:study`
- **Projects:** Tablica Kanban z kolumnami workflow

### 10.4 Metryki defektów

| Metryka | Opis | Cel |
|---------|------|-----|
| Defect Density | Defekty / KLOC | < 5 |
| Defect Leakage | Defekty znalezione po release | < 2% |
| Mean Time to Resolve (MTTR) | Średni czas naprawy | P1: <24h, P2: <3d |
| Test Coverage | Pokrycie kodu testami | > 80% |
| Test Pass Rate | Procent przechodzących testów | > 95% |

### 10.5 Raportowanie

#### Raport dzienny
- Liczba wykonanych testów
- Nowe defekty
- Status defektów w trakcie

#### Raport tygodniowy
- Podsumowanie postępu testów
- Trendy defektów
- Ryzyka i blokery
- Plan na następny tydzień

#### Raport końcowy
- Podsumowanie wykonanych testów
- Statystyki defektów
- Pokrycie testami
- Rekomendacje
- Go/No-Go decision

---

## Załączniki

### A. Przykładowa struktura katalogów testów

```
tests/
├── unit/
│   ├── services/
│   │   ├── auth.service.test.ts
│   │   ├── flashcard.service.test.ts
│   │   ├── study.service.test.ts
│   │   ├── generation.service.test.ts
│   │   └── openrouter.service.test.ts
│   ├── schemas/
│   │   ├── auth.schema.test.ts
│   │   ├── flashcard.schema.test.ts
│   │   ├── generation.schema.test.ts
│   │   └── study.schema.test.ts
│   ├── hooks/
│   │   ├── useAuthForm.test.ts
│   │   ├── useFlashcards.test.ts
│   │   ├── useGenerator.test.ts
│   │   ├── useStudySession.test.ts
│   │   └── useNavigation.test.ts
│   └── utils/
│       ├── utils.test.ts
│       └── auth.client.test.ts
├── integration/
│   ├── api/
│   │   ├── auth.api.test.ts
│   │   ├── flashcards.api.test.ts
│   │   ├── study.api.test.ts
│   │   └── generations.api.test.ts
│   └── components/
│       ├── FlashcardsContainer.test.tsx
│       ├── GeneratorContainer.test.tsx
│       └── StudyContainer.test.tsx
├── e2e/
│   ├── auth.spec.ts
│   ├── generator.spec.ts
│   ├── flashcards.spec.ts
│   ├── study.spec.ts
│   └── navigation.spec.ts
├── fixtures/
│   ├── users.ts
│   ├── flashcards.ts
│   └── generations.ts
└── mocks/
    ├── handlers.ts
    └── server.ts
```

### B. Konfiguracja Vitest (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        'src/components/ui/**', // Shadcn components
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

### C. Konfiguracja Playwright (playwright.config.ts)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```
