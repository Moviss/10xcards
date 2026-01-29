# Architektura UI dla 10xCards

## 1. Przegląd struktury UI

10xCards to aplikacja webowa MVP służąca do automatycznego generowania fiszek edukacyjnych przy użyciu AI oraz nauki z wykorzystaniem algorytmu SM-2. Architektura UI opiera się na następujących założeniach:

- **Framework**: Astro z komponentami React (hybrydowe SSG/SSR)
- **Biblioteka komponentów**: Shadcn/ui
- **Zarządzanie stanem**: Tanstack Query (server state) + React Context (UI state) + localStorage (Staging Area)
- **Responsywność**: Mobile-first z breakpointem na 768px (md)
- **Dostępność**: WCAG AA compliance

Struktura nawigacji jest płaska, z czterema głównymi sekcjami dostępnymi z top-bar: Generator, Moje Fiszki, Nauka i Konto. Aplikacja dzieli się na strony publiczne (SSG) oraz chronione (SSR z middleware sprawdzającym sesję Supabase).

---

## 2. Lista widoków

### 2.1. Landing Page

- **Ścieżka**: `/`
- **Główny cel**: Przedstawienie wartości produktu i zachęcenie do rejestracji/logowania
- **Kluczowe informacje do wyświetlenia**:
  - Nagłówek z opisem głównej korzyści (automatyczne tworzenie fiszek z AI)
  - Krótki opis działania aplikacji
  - Przyciski CTA: "Zaloguj się" i "Zarejestruj się"
- **Kluczowe komponenty widoku**:
  - Hero section z tekstem i ilustracją
  - Sekcja korzyści (3-4 punkty)
  - Przyciski nawigacyjne do `/login` i `/register`
- **UX, dostępność i bezpieczeństwo**:
  - Strona statyczna (SSG) dla szybkiego ładowania
  - Semantyczny HTML z nagłówkami hierarchicznymi
  - Kontrast WCAG AA dla wszystkich elementów tekstowych
  - Po zalogowaniu przekierowanie do `/generator`

---

### 2.2. Strona logowania

- **Ścieżka**: `/login`
- **Główny cel**: Umożliwienie zalogowania się istniejącym użytkownikom
- **Kluczowe informacje do wyświetlenia**:
  - Formularz logowania (email, hasło)
  - Link do rejestracji dla nowych użytkowników
  - Komunikaty o błędach walidacji
- **Kluczowe komponenty widoku**:
  - `Input` (email) z walidacją formatu
  - `Input` (hasło) typu password
  - `Button` "Zaloguj się"
  - Link tekstowy do `/register`
  - Inline error messages
- **UX, dostępność i bezpieczeństwo**:
  - Strona statyczna (SSG)
  - Etykiety powiązane z polami (aria-labelledby)
  - Focus trap w formularzu
  - Czytelne komunikaty błędów przy niepoprawnych danych
  - Przycisk disabled podczas wysyłania formularza
  - Po pomyślnym logowaniu przekierowanie do `/generator`

---

### 2.3. Strona rejestracji

- **Ścieżka**: `/register`
- **Główny cel**: Umożliwienie utworzenia nowego konta użytkownika
- **Kluczowe informacje do wyświetlenia**:
  - Formularz rejestracji (email, hasło)
  - Link do logowania dla istniejących użytkowników
  - Komunikaty o błędach walidacji
- **Kluczowe komponenty widoku**:
  - `Input` (email) z walidacją formatu i unikalności
  - `Input` (hasło) z wymaganiami siły hasła
  - `Button` "Zarejestruj się"
  - Link tekstowy do `/login`
  - Inline error messages
- **UX, dostępność i bezpieczeństwo**:
  - Strona statyczna (SSG)
  - Wyświetlanie wymagań hasła
  - Walidacja email w czasie rzeczywistym
  - Obsługa błędu 409 (email już zarejestrowany)
  - Po pomyślnej rejestracji automatyczne logowanie i przekierowanie do `/generator`

---

### 2.4. Generator fiszek AI

- **Ścieżka**: `/generator`
- **Główny cel**: Generowanie propozycji fiszek z tekstu źródłowego przy użyciu AI
- **Kluczowe informacje do wyświetlenia**:
  - Formularz z textarea do wklejenia tekstu
  - Licznik znaków (1000-10000)
  - Staging Area z propozycjami fiszek (po wygenerowaniu)
  - Banner o zaplanowanych powtórkach (jeśli due cards > 0)
- **Kluczowe komponenty widoku**:
  - `Textarea` z licznikiem znaków (progresywne kolorowanie)
  - `Button` "Generuj" (disabled poza zakresem 1000-10000 znaków)
  - Loader wieloetapowy (spinner → skeleton → komunikat po 5+ sekundach)
  - Staging Area (pojawia się dynamicznie po wygenerowaniu):
    - Lista propozycji fiszek (dwie kolumny na desktop: Przód | Tył)
    - Przyciski "Akceptuj wszystkie" / "Odrzuć wszystkie"
    - Dla każdej propozycji: status (kolorowe obramowanie), przyciski Akceptuj/Edytuj/Odrzuć
    - `Button` "Zapisz zaakceptowane"
  - Banner z linkiem do sesji nauki (opcjonalny)
  - Link do ręcznego dodawania fiszki (secondary action)
- **UX, dostępność i bezpieczeństwo**:
  - Strona chroniona (SSR z middleware)
  - Licznik znaków jako aria-live region
  - Dane Staging Area zapisywane w localStorage (przetrwają refresh)
  - Optymistyczne aktualizacje statusów propozycji
  - Obsługa błędów:
    - 400: Inline przy textarea
    - 502/503 AI: Toast z przyciskiem "Spróbuj ponownie"
  - Focus management po wygenerowaniu (przejście do Staging Area)

---

### 2.5. Modal edycji propozycji (w Staging Area)

- **Ścieżka**: N/A (modal w `/generator`)
- **Główny cel**: Edycja treści pojedynczej propozycji fiszki przed zapisem
- **Kluczowe informacje do wyświetlenia**:
  - Pola Przód i Tył propozycji
  - Liczniki znaków dla każdego pola
- **Kluczowe komponenty widoku**:
  - `Dialog` (Shadcn/ui)
  - `Textarea` dla pola Przód z licznikiem
  - `Textarea` dla pola Tył z licznikiem
  - `Button` "Zapisz zmiany"
  - `Button` "Anuluj"
- **UX, dostępność i bezpieczeństwo**:
  - Focus trap w modalu
  - Zamykanie przez Escape
  - Walidacja: pola nie mogą być puste
  - Zmiany zapisywane lokalnie w Staging Area

---

### 2.6. Moje Fiszki (lista)

- **Ścieżka**: `/flashcards`
- **Główny cel**: Przeglądanie, wyszukiwanie i zarządzanie wszystkimi fiszkami użytkownika
- **Kluczowe informacje do wyświetlenia**:
  - Lista fiszek z skróconą treścią (100-150 znaków)
  - Wyszukiwarka
  - Paginacja
  - Filtr AI/Manualne (opcjonalny)
  - Empty state dla nowych użytkowników
- **Kluczowe komponenty widoku**:
  - `Input` wyszukiwarka (debounced 300ms)
  - `Select` filtr źródła (Wszystkie/AI/Manualne)
  - `Table` na desktop / `Card` na mobile
  - Badge "AI" przy fiszkach wygenerowanych przez AI
  - `Pagination` (Shadcn/ui)
  - `Button` "Dodaj fiszkę" (primary action)
  - Empty state z CTA do generatora lub ręcznego dodawania
- **UX, dostępność i bezpieczeństwo**:
  - Strona chroniona (SSR)
  - Tabela z odpowiednimi nagłówkami (th, scope)
  - Karty na mobile z czytelną hierarchią
  - Kliknięcie wiersza/karty otwiera modal edycji
  - Paginacja z informacją o aktualnej stronie i liczbie wyników

---

### 2.7. Modal edycji fiszki

- **Ścieżka**: N/A (modal w `/flashcards`)
- **Główny cel**: Edycja, usuwanie lub resetowanie postępów istniejącej fiszki
- **Kluczowe informacje do wyświetlenia**:
  - Pola Przód i Tył (edytowalne)
  - Informacje read-only: data utworzenia, źródło (AI/manualna), parametry SM-2
  - Akcje destrukcyjne
- **Kluczowe komponenty widoku**:
  - `Dialog` (Shadcn/ui)
  - `Textarea` dla pola Przód z licznikiem
  - `Textarea` dla pola Tył z licznikiem
  - Sekcja informacji (read-only):
    - Data utworzenia
    - Źródło (badge AI lub Manualna)
    - Parametry SM-2 (interval, ease_factor, repetitions, next_review_date)
  - `Button` "Zapisz"
  - `Button` "Anuluj"
  - `Button` "Resetuj postęp" (wymaga potwierdzenia AlertDialog)
  - `Button` "Usuń" (wymaga potwierdzenia AlertDialog)
- **UX, dostępność i bezpieczeństwo**:
  - Focus trap
  - Walidacja: pola nie mogą być puste
  - Optymistyczne aktualizacje z rollback przy błędzie
  - AlertDialog przed destrukcyjnymi akcjami
  - Toast potwierdzający sukces operacji

---

### 2.8. Modal dodawania fiszki ręcznie

- **Ścieżka**: N/A (modal dostępny z `/flashcards` i `/generator`)
- **Główny cel**: Ręczne utworzenie nowej fiszki
- **Kluczowe informacje do wyświetlenia**:
  - Pola Przód i Tył
  - Liczniki znaków
- **Kluczowe komponenty widoku**:
  - `Dialog` (Shadcn/ui)
  - `Textarea` dla pola Przód z licznikiem
  - `Textarea` dla pola Tył z licznikiem
  - `Button` "Dodaj"
  - `Button` "Anuluj"
- **UX, dostępność i bezpieczeństwo**:
  - Walidacja: pola nie mogą być puste
  - Focus na pierwszym polu po otwarciu
  - Toast potwierdzający dodanie
  - Fiszka zapisywana z flagą `is_ai_generated = false`

---

### 2.9. Sesja nauki

- **Ścieżka**: `/study`
- **Główny cel**: Przeprowadzenie sesji nauki z wykorzystaniem algorytmu SM-2
- **Kluczowe informacje do wyświetlenia**:
  - Ekran startowy z podsumowaniem sesji
  - Aktualna fiszka (przód, potem tył)
  - Pasek postępu i licznik
  - Przyciski oceny
  - Podsumowanie po zakończeniu
- **Kluczowe komponenty widoku**:
  - **Ekran startowy**:
    - Informacja o liczbie kart (nowe: X/20, powtórki: Y)
    - Informacja o limicie 20 nowych fiszek
    - `Button` "Rozpocznij sesję"
    - Link "Wróć" jeśli brak kart do nauki (empty state)
  - **Widok fiszki**:
    - `Card` z treścią przodu
    - `Button` "Pokaż odpowiedź" (lub tap/click na kartę)
    - Po odsłonięciu: treść tyłu z animacją flip/fade
    - Przyciski oceny na dole ekranu (duże, mobile-friendly):
      - `Button` "Nie pamiętam" (destructive variant)
      - `Button` "Pamiętam" (primary variant)
  - **Pasek postępu**:
    - `Progress` (Shadcn/ui)
    - Licznik "Karta X z Y"
    - Mini-statystyka: Pamiętam: N, Nie pamiętam: M
  - **Podsumowanie sesji**:
    - Liczba przerobionych kart
    - Podział: nowe vs powtórki
    - Współczynnik sukcesu (% "Pamiętam")
    - `Button` "Zakończ" (powrót do generatora)
  - **Przerwanie sesji**:
    - `Button` "Przerwij sesję" (zawsze widoczny)
    - Po przerwaniu: częściowe podsumowanie
- **UX, dostępność i bezpieczeństwo**:
  - Strona chroniona (SSR)
  - Aria-live region dla ogłaszania nowej fiszki
  - Każda odpowiedź zapisywana natychmiast (optymistycznie)
  - Subtelne animacje (respektujące prefers-reduced-motion)
  - Focus management między stanami
  - Obsługa przerwania: nieoceniona fiszka wraca do kolejki
  - Empty state gdy brak fiszek do nauki

---

### 2.10. Konto (dropdown menu)

- **Ścieżka**: N/A (dropdown w nawigacji)
- **Główny cel**: Dostęp do opcji konta użytkownika
- **Kluczowe informacje do wyświetlenia**:
  - Email zalogowanego użytkownika
  - Opcje: Wyloguj, Usuń konto
- **Kluczowe komponenty widoku**:
  - `DropdownMenu` (Shadcn/ui)
  - Email użytkownika (read-only)
  - `DropdownMenuItem` "Wyloguj"
  - `DropdownMenuItem` "Usuń konto" (destructive)
- **UX, dostępność i bezpieczeństwo**:
  - Nawigacja klawiaturą w dropdown
  - Wylogowanie: natychmiastowe przekierowanie do `/login`
  - Usunięcie konta: wymaga wpisania "USUŃ" w AlertDialog
  - Po usunięciu: przekierowanie do landing page

---

### 2.11. AlertDialog potwierdzenia usunięcia konta

- **Ścieżka**: N/A (modal z dropdown Konto)
- **Główny cel**: Bezpieczne potwierdzenie nieodwracalnej operacji
- **Kluczowe informacje do wyświetlenia**:
  - Ostrzeżenie o nieodwracalności
  - Pole do wpisania słowa "USUŃ"
- **Kluczowe komponenty widoku**:
  - `AlertDialog` (Shadcn/ui)
  - Tekst ostrzegawczy
  - `Input` do wpisania "USUŃ"
  - `Button` "Usuń konto" (disabled dopóki nie wpisano "USUŃ")
  - `Button` "Anuluj"
- **UX, dostępność i bezpieczeństwo**:
  - Wysoki poziom zabezpieczenia przed przypadkowym usunięciem
  - Przycisk aktywny tylko po wpisaniu dokładnego słowa

---

## 3. Mapa podróży użytkownika

### 3.1. Przepływ nowego użytkownika

```
Landing Page (/) 
    ↓ [Klik "Zarejestruj się"]
Rejestracja (/register)
    ↓ [Wypełnienie formularza, submit]
Generator (/generator) [automatyczne przekierowanie]
    ↓ [Wklejenie tekstu, klik "Generuj"]
Staging Area [propozycje AI]
    ↓ [Recenzja: akceptacja/edycja/odrzucenie]
    ↓ [Klik "Zapisz zaakceptowane"]
Generator [Staging Area znika, toast sukcesu]
    ↓ [Klik "Nauka" w nawigacji]
Sesja nauki (/study) [ekran startowy]
    ↓ [Klik "Rozpocznij sesję"]
Sesja nauki [fiszki]
    ↓ [Ocena: Pamiętam/Nie pamiętam]
Podsumowanie sesji
    ↓ [Klik "Zakończ"]
Generator (/generator)
```

### 3.2. Przepływ generowania fiszek AI

1. Użytkownik wchodzi na `/generator`
2. Widzi textarea z licznikiem znaków (0/1000-10000)
3. Wkleja tekst źródłowy
4. Licznik aktualizuje się w czasie rzeczywistym z kolorowaniem:
   - Czerwony: < 1000 znaków
   - Zielony: 1000-10000 znaków
   - Czerwony: > 10000 znaków
5. Przycisk "Generuj" aktywny tylko w zakresie 1000-10000
6. Klik "Generuj":
   - Wyświetla się spinner
   - Po 2-3s: skeleton loader dla propozycji
   - Po 5+ sekundach: komunikat "Generowanie może potrwać dłużej..."
7. Po otrzymaniu odpowiedzi:
   - Staging Area pojawia się pod formularzem
   - Focus przenosi się na listę propozycji
   - Każda propozycja ma status: oczekująca (domyślnie)
8. Użytkownik dla każdej propozycji może:
   - Akceptuj → status: zaakceptowana (zielone obramowanie)
   - Edytuj → modal edycji → po zapisie: status zaakceptowana (edytowana)
   - Odrzuć → status: odrzucona (czerwone obramowanie)
9. Przyciski "Akceptuj wszystkie" / "Odrzuć wszystkie" dla szybkiej akcji
10. Klik "Zapisz zaakceptowane":
    - Batch POST do `/api/flashcards/batch`
    - Optymistyczne zamknięcie Staging Area
    - Toast sukcesu
    - Czyszczenie localStorage
11. W przypadku błędu przy zapisie:
    - Toast z błędem
    - Dane pozostają w localStorage
    - Opcja ponownej próby

### 3.3. Przepływ sesji nauki

1. Użytkownik klika "Nauka" w nawigacji → `/study`
2. Ekran startowy:
   - GET `/api/study/session`
   - Wyświetlenie informacji: "Nowe: X/20, Powtórki: Y"
   - Jeśli brak kart: empty state z linkiem do generatora
3. Klik "Rozpocznij sesję"
4. Wyświetlenie pierwszej fiszki (przód)
5. Użytkownik klika/tapuje kartę lub przycisk "Pokaż odpowiedź"
6. Animacja odsłonięcia tyłu (flip lub fade, respektując prefers-reduced-motion)
7. Użytkownik ocenia:
   - "Pamiętam" lub "Nie pamiętam"
   - POST `/api/study/review` (optymistycznie)
   - Automatyczne przejście do następnej fiszki
8. Aktualizacja paska postępu i mini-statystyki
9. Po ostatniej fiszce: podsumowanie
10. Możliwość przerwania w dowolnym momencie:
    - Przycisk "Przerwij sesję"
    - Częściowe podsumowanie
    - Nieoceniona fiszka wraca do kolejki

### 3.4. Przepływ zarządzania fiszkami (CRUD)

1. Użytkownik klika "Moje Fiszki" → `/flashcards`
2. Wyświetlenie listy z paginacją (GET `/api/flashcards`)
3. Opcje filtrowania i wyszukiwania:
   - Wpisanie w wyszukiwarkę → debounce 300ms → nowe zapytanie
   - Wybór filtra AI/Manualne → nowe zapytanie
4. Klik na fiszkę → modal edycji
5. W modalu:
   - Edycja pól → "Zapisz" → PUT `/api/flashcards/:id`
   - "Resetuj postęp" → AlertDialog → POST `/api/flashcards/:id/reset-progress`
   - "Usuń" → AlertDialog → DELETE `/api/flashcards/:id`
6. Po akcji: toast, zamknięcie modalu, odświeżenie listy (invalidacja cache)

### 3.5. Przepływ ręcznego dodawania fiszki

1. Użytkownik klika "Dodaj fiszkę" (w `/flashcards` lub `/generator`)
2. Otwiera się modal z pustym formularzem
3. Wypełnienie pól Przód i Tył
4. Klik "Dodaj":
   - POST `/api/flashcards`
   - Toast sukcesu
   - Zamknięcie modalu
   - Odświeżenie listy (jeśli w `/flashcards`)

### 3.6. Przepływ autentykacji i wygaśnięcia sesji

1. Przy każdym żądaniu do API: sprawdzenie tokena
2. Jeśli 401 Unauthorized:
   - Interceptor przechwytuje błąd
   - Wyświetla modal z informacją o wygaśnięciu sesji
   - Zapisuje aktualny URL w sessionStorage
   - Przekierowuje do `/login`
3. Po ponownym zalogowaniu:
   - Sprawdzenie sessionStorage
   - Przekierowanie do zapisanego URL lub `/generator`

---

## 4. Układ i struktura nawigacji

### 4.1. Top-bar (desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo 10xCards]   Generator   Moje Fiszki   Nauka   [Konto]│
└─────────────────────────────────────────────────────────────┘
```

- Logo: link do `/generator` (dla zalogowanych) lub `/` (dla niezalogowanych)
- Generator: `/generator` (podświetlenie gdy aktywny)
- Moje Fiszki: `/flashcards` (podświetlenie gdy aktywny)
- Nauka: `/study` (podświetlenie gdy aktywny)
- Konto: dropdown menu z email, wyloguj, usuń konto

### 4.2. Mobile navigation

**Opcja A: Bottom navigation bar**
```
┌─────────────────────────────────────────────────────────────┐
│                        [Treść strony]                       │
├─────────────────────────────────────────────────────────────┤
│  [Generator]    [Fiszki]    [Nauka]    [Konto]              │
└─────────────────────────────────────────────────────────────┘
```

**Opcja B: Hamburger menu**
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]                                            [☰ Menu] │
├─────────────────────────────────────────────────────────────┤
│                        [Treść strony]                       │
└─────────────────────────────────────────────────────────────┘
```

Po rozwinięciu menu:
- Generator
- Moje Fiszki
- Nauka
- Email użytkownika
- Wyloguj
- Usuń konto

### 4.3. Nawigacja kontekstowa

- W Generatorze po wygenerowaniu: banner z linkiem do sesji nauki (jeśli due cards > 0)
- Empty states zawierają linki do odpowiednich akcji:
  - Pusta lista fiszek → link do Generatora
  - Brak kart do nauki → link do Generatora lub listy fiszek

### 4.4. Dostępność nawigacji

- Pełna obsługa klawiaturą (Tab, Enter, Space, Escape)
- Skip link na początku strony ("Przejdź do treści głównej")
- Aria-current dla aktywnego elementu nawigacji
- Focus visible dla wszystkich elementów interaktywnych
- Hamburger menu: aria-expanded, aria-controls

---

## 5. Kluczowe komponenty

### 5.1. Komponenty nawigacji

| Komponent | Opis | Shadcn/ui |
|-----------|------|-----------|
| `TopNav` | Główna nawigacja top-bar | NavigationMenu |
| `MobileNav` | Nawigacja mobile (hamburger lub bottom nav) | Sheet / custom |
| `AccountDropdown` | Dropdown menu konta | DropdownMenu |

### 5.2. Komponenty formularzy

| Komponent | Opis | Shadcn/ui |
|-----------|------|-----------|
| `CharCountTextarea` | Textarea z licznikiem znaków i kolorowaniem | Textarea + custom |
| `LoginForm` | Formularz logowania | Form, Input, Button |
| `RegisterForm` | Formularz rejestracji | Form, Input, Button |
| `FlashcardForm` | Formularz edycji/dodawania fiszki | Form, Textarea, Button |

### 5.3. Komponenty Staging Area

| Komponent | Opis | Shadcn/ui |
|-----------|------|-----------|
| `StagingArea` | Kontener dla propozycji AI | custom |
| `ProposalCard` | Pojedyncza propozycja z akcjami | Card, Button |
| `ProposalEditModal` | Modal edycji propozycji | Dialog, Textarea |
| `BulkActions` | Przyciski "Akceptuj/Odrzuć wszystkie" | Button |

### 5.4. Komponenty listy fiszek

| Komponent | Opis | Shadcn/ui |
|-----------|------|-----------|
| `FlashcardTable` | Tabela fiszek (desktop) | Table |
| `FlashcardCardList` | Lista kart fiszek (mobile) | Card |
| `FlashcardSearch` | Wyszukiwarka z debounce | Input |
| `FlashcardFilter` | Filtr AI/Manualne | Select |
| `FlashcardEditModal` | Modal edycji fiszki | Dialog, Textarea, Button |
| `AIBadge` | Badge "AI" przy fiszkach | Badge |

### 5.5. Komponenty sesji nauki

| Komponent | Opis | Shadcn/ui |
|-----------|------|-----------|
| `StudySessionStart` | Ekran startowy sesji | Card, Button |
| `FlashcardDisplay` | Wyświetlanie aktualnej fiszki | Card |
| `RevealButton` | Przycisk "Pokaż odpowiedź" | Button |
| `AnswerButtons` | Przyciski Pamiętam/Nie pamiętam | Button |
| `StudyProgress` | Pasek postępu + licznik | Progress |
| `SessionSummary` | Podsumowanie sesji | Card |
| `MiniStats` | Mini-statystyka Pamiętam/Nie pamiętam | custom |

### 5.6. Komponenty feedback

| Komponent | Opis | Shadcn/ui |
|-----------|------|-----------|
| `Toast` | Powiadomienia o sukcesie/błędzie | Toast |
| `LoadingSpinner` | Spinner podczas ładowania | custom |
| `SkeletonLoader` | Skeleton dla propozycji AI | Skeleton |
| `EmptyState` | Stan pusty z CTA | custom |
| `ErrorBoundary` | Obsługa błędów krytycznych | custom |

### 5.7. Komponenty potwierdzenia

| Komponent | Opis | Shadcn/ui |
|-----------|------|-----------|
| `ConfirmDialog` | Proste potwierdzenie (usunięcie fiszki, reset) | AlertDialog |
| `DeleteAccountDialog` | Potwierdzenie usunięcia konta z wpisaniem "USUŃ" | AlertDialog, Input |
| `SessionExpiredModal` | Modal wygaśnięcia sesji | Dialog |

### 5.8. Komponenty pomocnicze

| Komponent | Opis | Shadcn/ui |
|-----------|------|-----------|
| `Pagination` | Paginacja listy | Pagination |
| `ProtectedRoute` | Wrapper dla stron chronionych | custom (middleware Astro) |
| `RetryButton` | Przycisk ponownej próby dla błędów | Button |

---

## 6. Mapowanie historyjek użytkownika na elementy UI

| User Story | Elementy UI |
|------------|-------------|
| US-001: Rejestracja i logowanie | `/register`, `/login`, `RegisterForm`, `LoginForm`, `AccountDropdown` |
| US-002: Generowanie fiszek z tekstu | `/generator`, `CharCountTextarea`, `LoadingSpinner`, `SkeletonLoader`, `StagingArea` |
| US-003: Recenzja propozycji AI | `StagingArea`, `ProposalCard`, `ProposalEditModal`, `BulkActions` |
| US-004: Manualne dodawanie fiszek | `FlashcardForm` (modal), `/flashcards`, `/generator` |
| US-005: Zarządzanie listą fiszek | `/flashcards`, `FlashcardTable`, `FlashcardSearch`, `FlashcardEditModal`, `ConfirmDialog` |
| US-006: Sesja nauki z SM-2 | `/study`, `FlashcardDisplay`, `AnswerButtons`, `StudyProgress` |
| US-007: Limit nowych fiszek | `StudySessionStart` (informacja o limicie), `SessionSummary` |
| US-008: Resetowanie postępów | `FlashcardEditModal` (przycisk "Resetuj postęp"), `ConfirmDialog` |
| US-009: Logowanie skuteczności | Backend (generation_logs), brak dedykowanego UI w MVP |

---

## 7. Obsługa stanów i błędów

### 7.1. Stany ładowania

| Kontekst | Komponent | Zachowanie |
|----------|-----------|------------|
| Generowanie AI | `LoadingSpinner` → `SkeletonLoader` | Wieloetapowy: spinner (0-2s), skeleton (2-5s), komunikat (5s+) |
| Ładowanie listy | `SkeletonLoader` | Skeleton dla wierszy tabeli/kart |
| Ładowanie sesji | `LoadingSpinner` | Spinner na ekranie startowym |
| Zapisywanie | `Button` z loading state | Disabled + spinner w przycisku |

### 7.2. Stany puste (empty states)

| Kontekst | Komunikat | CTA |
|----------|-----------|-----|
| Brak fiszek | "Nie masz jeszcze żadnych fiszek" | "Wygeneruj fiszki z AI" / "Dodaj fiszkę ręcznie" |
| Brak wyników wyszukiwania | "Brak fiszek pasujących do wyszukiwania" | "Wyczyść filtr" |
| Brak kart do nauki | "Wszystko powtórzone! Wróć jutro lub dodaj nowe fiszki" | "Przejdź do Generatora" |
| Pusta odpowiedź AI | "AI nie wygenerowało propozycji. Spróbuj z innym tekstem." | "Dodaj fiszkę ręcznie" |

### 7.3. Obsługa błędów

| Kod | Strategia | Komponent |
|-----|-----------|-----------|
| 400 | Inline przy polu formularza | Tekst błędu pod polem |
| 401 | Modal + przekierowanie | `SessionExpiredModal` |
| 404 | Toast + przekierowanie | `Toast` (destructive) |
| 409 | Inline (email zajęty) | Tekst błędu pod polem email |
| 429 | Toast z informacją o limicie | `Toast` + `RetryButton` (po czasie) |
| 502/503 | Toast z retry | `Toast` + `RetryButton` |
| Network | Toast z retry (2x automatycznie) | `Toast` |
| Critical | Full-page error boundary | `ErrorBoundary` |

---

## 8. Responsywność

### 8.1. Breakpointy

| Breakpoint | Wartość | Urządzenia |
|------------|---------|------------|
| sm | < 768px | Mobile |
| md | ≥ 768px | Tablet, Desktop |

### 8.2. Adaptacje komponentów

| Komponent | Mobile (< 768px) | Desktop (≥ 768px) |
|-----------|------------------|-------------------|
| Nawigacja | Bottom nav lub hamburger | Top-bar |
| Staging Area | 1 kolumna (Przód nad Tyłem) | 2 kolumny (Przód | Tył) |
| Lista fiszek | Karty | Tabela |
| Przyciski sesji | Pełna szerokość, duże | Standardowe |
| Modale | Pełnoekranowe | Wycentrowane |

---

## 9. Dostępność (a11y)

### 9.1. Wymagania WCAG AA

- **Kontrast**: minimum 4.5:1 dla tekstu, 3:1 dla dużego tekstu
- **Focus**: widoczny focus ring dla wszystkich elementów interaktywnych
- **Klawiatura**: pełna nawigacja bez myszy (Tab, Shift+Tab, Enter, Space, Escape, Arrow keys)
- **Screen readers**: semantyczny HTML, aria-labels, aria-live regions

### 9.2. Implementacja w komponentach

| Aspekt | Implementacja |
|--------|---------------|
| Nawigacja klawiaturą | Focus management, skip links |
| Formularze | Labels powiązane z inputs, aria-describedby dla błędów |
| Modale | Focus trap, aria-modal, zamykanie przez Escape |
| Liczniki znaków | aria-live="polite" |
| Sesja nauki | aria-live region dla ogłaszania nowej fiszki |
| Postęp | role="progressbar", aria-valuenow, aria-valuemax |
| Animacje | respektowanie prefers-reduced-motion |

### 9.3. Shadcn/ui

Komponenty Shadcn/ui mają wbudowane wsparcie dla dostępności (Radix UI primitives). Należy zadbać o:
- Przekazywanie odpowiednich aria-labels dla przycisków ikonowych
- Prawidłowe nagłówki (h1-h6) w hierarchii
- Oznaczenie aktualnej strony w nawigacji (aria-current="page")
