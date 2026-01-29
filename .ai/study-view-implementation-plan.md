# Plan implementacji widoku Sesja nauki

## 1. Przegląd

Widok "Sesja nauki" (`/study`) umożliwia użytkownikowi przeprowadzenie sesji nauki fiszek z wykorzystaniem algorytmu SM-2 (spaced repetition). Widok składa się z czterech głównych stanów: ekran startowy z podsumowaniem sesji, widok fiszki (przód/tył), pasek postępu oraz podsumowanie po zakończeniu. System ogranicza liczbę nowych fiszek do 20 na sesję, jednocześnie pozwalając na nieograniczoną liczbę powtórek. Użytkownik ocenia swoją wiedzę binarnie: "Pamiętam" lub "Nie pamiętam", co aktualizuje parametry algorytmu SM-2 w bazie danych.

## 2. Routing widoku

- **Ścieżka**: `/study`
- **Typ strony**: Chroniona (SSR z middleware sprawdzającym sesję Supabase)
- **Plik**: `src/pages/study.astro`
- **Przekierowanie po wygaśnięciu sesji**: `/login` z zapisem URL w sessionStorage

## 3. Struktura komponentów

```
study.astro
└── StudyContainer (client:load)
    ├── StudyStartScreen
    │   ├── SessionStatistics
    │   └── Button "Rozpocznij sesję"
    ├── StudyFlashcard
    │   ├── FlashcardFront
    │   ├── FlashcardBack (po odsłonięciu)
    │   ├── RevealButton
    │   └── AnswerButtons
    │       ├── Button "Nie pamiętam"
    │       └── Button "Pamiętam"
    ├── StudyProgress
    │   ├── Progress (Shadcn/ui)
    │   ├── CardCounter
    │   └── MiniStats
    ├── StudySummary
    │   ├── SummaryStatistics
    │   └── Button "Zakończ"
    ├── InterruptButton
    └── EmptyState (gdy brak fiszek)
```

## 4. Szczegóły komponentów

### StudyContainer

- **Opis**: Główny komponent kontenerowy zarządzający stanem całej sesji nauki. Koordynuje przepływ między ekranami (start, nauka, podsumowanie), obsługuje wywołania API oraz zarządza powiadomieniami toast.
- **Główne elementy**: Warunkowe renderowanie ekranów w zależności od stanu sesji (`idle`, `loading`, `studying`, `completed`, `interrupted`, `empty`).
- **Obsługiwane interakcje**: 
  - Inicjalizacja sesji (pobieranie fiszek z API)
  - Rozpoczęcie sesji
  - Przerwanie sesji
  - Zakończenie sesji
- **Obsługiwana walidacja**: Brak bezpośredniej walidacji - delegowana do hooka `useStudySession`.
- **Typy**: `StudySessionState`, `StudySessionResponseDTO`, `StudyCardDTO`
- **Propsy**: Brak (komponent kontenerowy pobierający dane samodzielnie)

### StudyStartScreen

- **Opis**: Ekran startowy wyświetlany przed rozpoczęciem sesji. Prezentuje statystyki sesji (liczba nowych fiszek, liczba powtórek) oraz informację o limicie 20 nowych fiszek.
- **Główne elementy**: 
  - `Card` z informacjami o sesji
  - Sekcja statystyk (nowe: X/20, powtórki: Y)
  - Informacja o limicie nowych fiszek
  - `Button` "Rozpocznij sesję" (primary)
- **Obsługiwane interakcje**: 
  - Kliknięcie przycisku "Rozpocznij sesję"
- **Obsługiwana walidacja**: Brak
- **Typy**: `StudySessionStatisticsDTO`
- **Propsy**: 
  ```typescript
  interface StudyStartScreenProps {
    statistics: StudySessionStatisticsDTO;
    onStartSession: () => void;
    isLoading: boolean;
  }
  ```

### StudyFlashcard

- **Opis**: Komponent wyświetlający aktualną fiszkę podczas sesji nauki. Początkowo pokazuje przód fiszki, po interakcji użytkownika odsłania tył z animacją.
- **Główne elementy**: 
  - `Card` z treścią fiszki
  - `FlashcardFront` - treść przodu fiszki
  - `FlashcardBack` - treść tyłu fiszki (widoczna po odsłonięciu)
  - `RevealButton` - przycisk "Pokaż odpowiedź" (lub kliknięcie na kartę)
  - `AnswerButtons` - przyciski oceny
- **Obsługiwane interakcje**: 
  - Kliknięcie/tap na kartę lub przycisk "Pokaż odpowiedź" - odsłania tył
  - Kliknięcie "Pamiętam" - ocena pozytywna
  - Kliknięcie "Nie pamiętam" - ocena negatywna
- **Obsługiwana walidacja**: Brak
- **Typy**: `StudyCardDTO`, `FlashcardDisplayState`
- **Propsy**: 
  ```typescript
  interface StudyFlashcardProps {
    card: StudyCardDTO;
    isRevealed: boolean;
    onReveal: () => void;
    onAnswer: (remembered: boolean) => void;
    isSubmitting: boolean;
  }
  ```

### AnswerButtons

- **Opis**: Komponent z dwoma dużymi przyciskami oceny, zoptymalizowany pod urządzenia mobilne. Wyświetlany po odsłonięciu tyłu fiszki.
- **Główne elementy**: 
  - `Button` "Nie pamiętam" (destructive variant, ikona X)
  - `Button` "Pamiętam" (primary/default variant, ikona Check)
- **Obsługiwane interakcje**: 
  - Kliknięcie przycisku "Nie pamiętam" - wywołuje `onAnswer(false)`
  - Kliknięcie przycisku "Pamiętam" - wywołuje `onAnswer(true)`
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak specyficznych typów
- **Propsy**: 
  ```typescript
  interface AnswerButtonsProps {
    onAnswer: (remembered: boolean) => void;
    isSubmitting: boolean;
  }
  ```

### StudyProgress

- **Opis**: Pasek postępu sesji z licznikiem kart i mini-statystyką bieżącej sesji.
- **Główne elementy**: 
  - `Progress` (Shadcn/ui) - wizualny pasek postępu
  - Licznik "Karta X z Y"
  - Mini-statystyka: "Pamiętam: N, Nie pamiętam: M"
- **Obsługiwane interakcje**: Brak (komponent tylko do wyświetlania)
- **Obsługiwana walidacja**: Brak
- **Typy**: `SessionProgress`
- **Propsy**: 
  ```typescript
  interface StudyProgressProps {
    currentIndex: number;
    totalCards: number;
    rememberedCount: number;
    forgottenCount: number;
  }
  ```

### StudySummary

- **Opis**: Ekran podsumowania wyświetlany po zakończeniu lub przerwaniu sesji. Prezentuje statystyki sesji.
- **Główne elementy**: 
  - `Card` z podsumowaniem
  - Liczba przerobionych kart
  - Podział: nowe vs powtórki
  - Współczynnik sukcesu (% "Pamiętam")
  - `Button` "Zakończ" (przekierowanie do `/generator`)
- **Obsługiwane interakcje**: 
  - Kliknięcie przycisku "Zakończ" - przekierowanie do generatora
- **Obsługiwana walidacja**: Brak
- **Typy**: `SessionSummary`
- **Propsy**: 
  ```typescript
  interface StudySummaryProps {
    summary: SessionSummary;
    isInterrupted: boolean;
    onFinish: () => void;
  }
  ```

### InterruptButton

- **Opis**: Przycisk do przerwania sesji, zawsze widoczny podczas nauki.
- **Główne elementy**: 
  - `Button` "Przerwij sesję" (ghost/outline variant)
- **Obsługiwane interakcje**: 
  - Kliknięcie - otwiera dialog potwierdzenia lub bezpośrednio przerywa sesję
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak specyficznych typów
- **Propsy**: 
  ```typescript
  interface InterruptButtonProps {
    onInterrupt: () => void;
    isSubmitting: boolean;
  }
  ```

### EmptyState

- **Opis**: Komponent wyświetlany gdy brak fiszek do nauki (wszystkie powtórzone lub użytkownik nie ma żadnych fiszek).
- **Główne elementy**: 
  - Ikona (np. CheckCircle lub BookOpen)
  - Tekst informacyjny
  - Link/Button do generatora lub listy fiszek
- **Obsługiwane interakcje**: 
  - Kliknięcie linku - nawigacja do generatora
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak specyficznych typów
- **Propsy**: 
  ```typescript
  interface EmptyStateProps {
    hasAnyFlashcards: boolean;
  }
  ```

## 5. Typy

### Typy z API (istniejące w `src/types.ts`)

```typescript
// Fiszka w sesji nauki
interface StudyCardDTO {
  id: string;
  front: string;
  back: string;
  is_new: boolean;
}

// Statystyki sesji
interface StudySessionStatisticsDTO {
  total_cards: number;
  new_cards: number;
  review_cards: number;
}

// Odpowiedź z GET /api/study/session
interface StudySessionResponseDTO {
  cards: StudyCardDTO[];
  statistics: StudySessionStatisticsDTO;
}

// Komenda przesłania oceny
interface SubmitReviewCommand {
  flashcard_id: string;
  remembered: boolean;
}

// Odpowiedź z POST /api/study/review
interface StudyReviewResponseDTO {
  flashcard_id: string;
  interval: number;
  ease_factor: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string;
}
```

### Nowe typy ViewModel (do utworzenia)

```typescript
// Stan sesji nauki
type StudySessionStatus = 
  | 'idle'        // Początkowy stan, ładowanie danych
  | 'loading'     // Trwa pobieranie sesji
  | 'ready'       // Sesja gotowa do rozpoczęcia
  | 'studying'    // Sesja w trakcie
  | 'completed'   // Sesja zakończona (wszystkie karty ocenione)
  | 'interrupted' // Sesja przerwana przez użytkownika
  | 'empty';      // Brak kart do nauki

// Stan wyświetlania fiszki
interface FlashcardDisplayState {
  isRevealed: boolean;
  isSubmitting: boolean;
}

// Postęp sesji
interface SessionProgress {
  currentIndex: number;        // Indeks aktualnej karty (0-based)
  totalCards: number;          // Łączna liczba kart w sesji
  answeredCount: number;       // Liczba już ocenionych kart
  rememberedCount: number;     // Liczba odpowiedzi "Pamiętam"
  forgottenCount: number;      // Liczba odpowiedzi "Nie pamiętam"
}

// Podsumowanie sesji
interface SessionSummary {
  totalReviewed: number;       // Łączna liczba ocenionych kart
  newCardsReviewed: number;    // Liczba ocenionych nowych kart
  reviewCardsReviewed: number; // Liczba ocenionych powtórek
  rememberedCount: number;     // Liczba "Pamiętam"
  forgottenCount: number;      // Liczba "Nie pamiętam"
  successRate: number;         // Procent "Pamiętam" (0-100)
}

// Pełny stan sesji (do hooka)
interface StudySessionState {
  status: StudySessionStatus;
  cards: StudyCardDTO[];
  statistics: StudySessionStatisticsDTO | null;
  progress: SessionProgress;
  currentCard: StudyCardDTO | null;
  flashcardDisplay: FlashcardDisplayState;
  summary: SessionSummary | null;
  error: string | null;
}

// Rekord odpowiedzi (do śledzenia w sesji)
interface AnswerRecord {
  flashcardId: string;
  isNew: boolean;
  remembered: boolean;
  timestamp: Date;
}
```

## 6. Zarządzanie stanem

### Custom Hook: `useStudySession`

Hook zarządzający całym stanem sesji nauki. Wzorowany na istniejących hookach (`useFlashcards`, `useGenerator`).

```typescript
interface UseStudySessionReturn {
  // Stan
  status: StudySessionStatus;
  statistics: StudySessionStatisticsDTO | null;
  currentCard: StudyCardDTO | null;
  progress: SessionProgress;
  isRevealed: boolean;
  isSubmitting: boolean;
  summary: SessionSummary | null;
  error: string | null;
  
  // Akcje
  fetchSession: () => Promise<void>;
  startSession: () => void;
  revealCard: () => void;
  submitAnswer: (remembered: boolean) => Promise<void>;
  interruptSession: () => void;
  finishSession: () => void;
}
```

**Logika hooka:**

1. **Inicjalizacja**: 
   - Przy montowaniu komponentu automatycznie pobiera sesję z API
   - Ustawia status na `loading`, następnie `ready` lub `empty`

2. **Rozpoczęcie sesji**:
   - Zmienia status na `studying`
   - Ustawia pierwszą kartę jako aktualną

3. **Odsłonięcie karty**:
   - Zmienia `isRevealed` na `true`

4. **Przesłanie odpowiedzi**:
   - Wywołuje POST `/api/study/review` (optymistycznie)
   - Aktualizuje postęp (`rememberedCount` lub `forgottenCount`)
   - Zapisuje odpowiedź w `answerRecords`
   - Przechodzi do następnej karty lub kończy sesję
   - Resetuje `isRevealed` na `false`

5. **Przerwanie sesji**:
   - Oblicza częściowe podsumowanie
   - Zmienia status na `interrupted`

6. **Zakończenie sesji**:
   - Przekierowuje do `/generator`

**Przechowywanie stanu:**
- Cały stan w `useState` wewnątrz hooka
- Brak localStorage (sesja nie wymaga persystencji między odświeżeniami)
- Każda odpowiedź zapisywana natychmiast do API (optymistycznie)

## 7. Integracja API

### GET /api/study/session

**Wywołanie**: Przy montowaniu `StudyContainer`

**Typ żądania**: Brak body (GET request)

**Typ odpowiedzi**: `StudySessionResponseDTO`
```typescript
{
  cards: StudyCardDTO[];
  statistics: StudySessionStatisticsDTO;
}
```

**Nagłówki**: 
```
Authorization: Bearer <access_token>
```

**Obsługa odpowiedzi**:
- `200 OK`: Ustawienie `cards` i `statistics`, status `ready` lub `empty` (jeśli `cards.length === 0`)
- `401 Unauthorized`: Przekierowanie do `/login`

### POST /api/study/review

**Wywołanie**: Po każdej ocenie fiszki

**Typ żądania**: `SubmitReviewCommand`
```typescript
{
  flashcard_id: string;
  remembered: boolean;
}
```

**Typ odpowiedzi**: `StudyReviewResponseDTO`
```typescript
{
  flashcard_id: string;
  interval: number;
  ease_factor: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string;
}
```

**Nagłówki**: 
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Obsługa odpowiedzi**:
- `200 OK`: Kontynuacja do następnej karty
- `400 Bad Request`: Toast z błędem walidacji
- `401 Unauthorized`: Przekierowanie do `/login`
- `404 Not Found`: Toast z błędem, pominięcie karty

## 8. Interakcje użytkownika

| Interakcja | Element UI | Akcja | Efekt |
|------------|-----------|-------|-------|
| Wejście na stronę | - | Auto | Pobranie sesji z API, wyświetlenie ekranu startowego lub empty state |
| Kliknięcie "Rozpocznij sesję" | Button | `startSession()` | Przejście do widoku fiszki, wyświetlenie pierwszej karty |
| Kliknięcie karty lub "Pokaż odpowiedź" | Card / Button | `revealCard()` | Animacja odsłonięcia tyłu fiszki, wyświetlenie przycisków oceny |
| Kliknięcie "Pamiętam" | Button | `submitAnswer(true)` | Wysłanie oceny do API, przejście do następnej karty |
| Kliknięcie "Nie pamiętam" | Button | `submitAnswer(false)` | Wysłanie oceny do API, przejście do następnej karty |
| Kliknięcie "Przerwij sesję" | Button | `interruptSession()` | Wyświetlenie częściowego podsumowania |
| Ostatnia karta oceniona | - | Auto | Wyświetlenie pełnego podsumowania |
| Kliknięcie "Zakończ" | Button | `finishSession()` | Przekierowanie do `/generator` |
| Kliknięcie linku w empty state | Link | Nawigacja | Przekierowanie do `/generator` |

### Skróty klawiszowe (opcjonalne)

| Klawisz | Akcja |
|---------|-------|
| Spacja | Pokaż odpowiedź (gdy ukryta) |
| Enter | Pamiętam (gdy odpowiedź widoczna) |
| Backspace | Nie pamiętam (gdy odpowiedź widoczna) |
| Escape | Przerwij sesję |

## 9. Warunki i walidacja

### Warunki po stronie API (weryfikowane przez backend)

| Warunek | Opis | Komponent |
|---------|------|-----------|
| Nowe karty <= 20 | API zwraca maksymalnie 20 nowych kart | StudyStartScreen (info) |
| Karty do powtórki | `next_review_date <= CURRENT_DATE` | StudyStartScreen (info) |
| Właściciel fiszki | Użytkownik może oceniać tylko swoje fiszki | StudyFlashcard |
| Poprawne `flashcard_id` | UUID fiszki musi istnieć | AnswerButtons |
| Pole `remembered` | Wymagane, boolean | AnswerButtons |

### Warunki po stronie frontendu

| Warunek | Weryfikacja | Wpływ na UI |
|---------|-------------|-------------|
| Sesja załadowana | `status !== 'loading'` | Wyświetlenie ekranu startowego zamiast loadera |
| Są karty do nauki | `cards.length > 0` | Wyświetlenie ekranu startowego zamiast empty state |
| Sesja rozpoczęta | `status === 'studying'` | Wyświetlenie fiszki i paska postępu |
| Karta odsłonięta | `isRevealed === true` | Wyświetlenie tyłu i przycisków oceny |
| Nie trwa wysyłanie | `isSubmitting === false` | Aktywne przyciski oceny |
| Sesja zakończona | `status === 'completed' \|\| 'interrupted'` | Wyświetlenie podsumowania |

## 10. Obsługa błędów

| Scenariusz | Kod HTTP | Obsługa |
|------------|----------|---------|
| Brak autoryzacji | 401 | Przekierowanie do `/login`, zapis URL w sessionStorage |
| Błąd walidacji (review) | 400 | Toast z komunikatem błędu, możliwość ponownej próby |
| Fiszka nie znaleziona | 404 | Toast z błędem, pominięcie karty, przejście do następnej |
| Błąd serwera | 500 | Toast z błędem, możliwość ponownej próby |
| Błąd sieci | - | Toast z błędem, automatyczna ponowna próba (2x), przycisk "Spróbuj ponownie" |
| Timeout API | - | Toast z informacją, możliwość ponownej próby |

### Strategia obsługi błędów przy ocenie

1. **Optymistyczne aktualizacje**: UI przechodzi do następnej karty natychmiast
2. **W tle**: Wysyłanie oceny do API
3. **Przy błędzie**: 
   - Toast z informacją o błędzie
   - Automatyczna ponowna próba
   - Jeśli nadal błąd: zapis do kolejki do ponowienia przy następnej okazji

### Komunikaty błędów (w języku polskim)

```typescript
const errorMessages = {
  unauthorized: "Sesja wygasła. Zaloguj się ponownie.",
  networkError: "Błąd połączenia. Sprawdź internet i spróbuj ponownie.",
  serverError: "Błąd serwera. Spróbuj ponownie później.",
  flashcardNotFound: "Fiszka nie została znaleziona.",
  invalidReview: "Nieprawidłowe dane oceny.",
};
```

## 11. Kroki implementacji

### Krok 1: Utworzenie typów ViewModel
1. Dodać nowe typy do `src/types.ts` lub utworzyć `src/lib/types/study.types.ts`
2. Typy: `StudySessionStatus`, `FlashcardDisplayState`, `SessionProgress`, `SessionSummary`, `StudySessionState`, `AnswerRecord`

### Krok 2: Implementacja hooka `useStudySession`
1. Utworzyć plik `src/lib/hooks/useStudySession.ts`
2. Zaimplementować logikę pobierania sesji
3. Zaimplementować zarządzanie stanem karty (reveal/answer)
4. Zaimplementować wysyłanie ocen do API
5. Zaimplementować obliczanie postępu i podsumowania
6. Dodać obsługę błędów i przekierowań

### Krok 3: Utworzenie komponentów prezentacyjnych
1. Utworzyć folder `src/components/study/`
2. Zaimplementować komponenty w kolejności:
   - `EmptyState.tsx`
   - `StudyProgress.tsx`
   - `AnswerButtons.tsx`
   - `StudyFlashcard.tsx`
   - `StudyStartScreen.tsx`
   - `StudySummary.tsx`
   - `InterruptButton.tsx`

### Krok 4: Implementacja animacji
1. Dodać animację flip/fade dla odsłonięcia karty
2. Respektować `prefers-reduced-motion`
3. Użyć Tailwind CSS transitions (`transition-all`, `animate-in`)

### Krok 5: Implementacja StudyContainer
1. Utworzyć `src/components/study/StudyContainer.tsx`
2. Zintegrować hook `useStudySession`
3. Zaimplementować warunkowe renderowanie ekranów
4. Dodać obsługę toast notifications (Sonner)
5. Zaimplementować focus management między stanami

### Krok 6: Utworzenie strony Astro
1. Utworzyć `src/pages/study.astro`
2. Dodać layout i kontener
3. Zaimportować `StudyContainer` z `client:load`

### Krok 7: Dostępność (a11y)
1. Dodać aria-live region dla ogłaszania nowej fiszki
2. Zaimplementować focus management
3. Dodać odpowiednie aria-labels
4. Przetestować nawigację klawiaturą

### Krok 8: Responsywność
1. Zoptymalizować przyciski oceny pod mobile (duże, full-width)
2. Dostosować layout karty dla różnych rozmiarów ekranu
3. Przetestować na breakpointach sm/md

### Krok 9: Testy i poprawki
1. Przetestować pełny przepływ sesji
2. Przetestować scenariusze błędów
3. Przetestować empty state
4. Przetestować przerwanie sesji
5. Sprawdzić wydajność i optymalizacje
