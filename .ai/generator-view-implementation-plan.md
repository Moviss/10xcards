# Plan implementacji widoku Generator fiszek AI

## 1. Przegląd

Widok Generator fiszek AI to kluczowy element aplikacji 10xCards, umożliwiający użytkownikom automatyczne generowanie propozycji fiszek edukacyjnych z tekstu źródłowego przy użyciu modelu GPT-4o-mini. Widok składa się z formularza do wprowadzania tekstu z licznikiem znaków, obszaru Staging Area do recenzji wygenerowanych propozycji oraz mechanizmów zarządzania stanem propozycji (akceptacja, edycja, odrzucenie). Dane w Staging Area są persystowane w localStorage, aby zapobiec ich utracie po odświeżeniu strony.

## 2. Routing widoku

- **Ścieżka**: `/generator`
- **Typ strony**: Chroniona (SSR z middleware sprawdzającym sesję Supabase)
- **Plik**: `src/pages/generator.astro`

## 3. Struktura komponentów

```
GeneratorView (strona Astro)
└── GeneratorContainer (React, client:load)
    ├── SourceTextForm
    │   ├── CharCountTextarea
    │   └── Button "Generuj"
    ├── GenerationLoader (warunkowo)
    ├── StagingArea (warunkowo, po wygenerowaniu)
    │   ├── BulkActions
    │   │   ├── Button "Akceptuj wszystkie"
    │   │   └── Button "Odrzuć wszystkie"
    │   ├── ProposalList
    │   │   └── ProposalCard (dla każdej propozycji)
    │   │       ├── ProposalContent (Przód/Tył)
    │   │       └── ProposalActions (Akceptuj/Edytuj/Odrzuć)
    │   └── SaveActions
    │       └── Button "Zapisz zaakceptowane"
    └── ProposalEditModal (warunkowo)
        ├── Textarea (Przód)
        ├── Textarea (Tył)
        └── Button "Zapisz zmiany" / "Anuluj"
```

## 4. Szczegóły komponentów

### GeneratorContainer

- **Opis**: Główny kontener widoku generatora, zarządzający całym stanem i logiką widoku. Orkiestruje komunikację między formularzem, Staging Area i modalem edycji.
- **Główne elementy**: Komponent opakowujący wszystkie podkomponenty, zarządza globalnym stanem generatora poprzez custom hook `useGenerator`.
- **Obsługiwane interakcje**:
  - Inicjalizacja stanu z localStorage przy montowaniu
  - Synchronizacja stanu z localStorage przy zmianach
- **Obsługiwana walidacja**: Brak bezpośredniej walidacji (delegowana do podkomponentów)
- **Typy**:
  - `GeneratorState`
  - `ProposalViewModel`
- **Propsy**: Brak (komponent główny)

### SourceTextForm

- **Opis**: Formularz do wprowadzania tekstu źródłowego z licznikiem znaków i przyciskiem generowania. Wyświetla błędy walidacji inline.
- **Główne elementy**:
  - `CharCountTextarea` - pole tekstowe z licznikiem
  - `Button` - przycisk "Generuj fiszki"
  - Komunikat błędu inline (dla błędów 400)
- **Obsługiwane interakcje**:
  - `onChange` - aktualizacja tekstu źródłowego
  - `onSubmit` - wywołanie generowania fiszek
- **Obsługiwana walidacja**:
  - Tekst musi mieć od 1000 do 10000 znaków
  - Przycisk "Generuj" jest disabled gdy tekst poza zakresem lub trwa generowanie
- **Typy**:
  - `SourceTextFormProps`
- **Propsy**:
  ```typescript
  interface SourceTextFormProps {
    sourceText: string;
    onSourceTextChange: (text: string) => void;
    onSubmit: () => void;
    isGenerating: boolean;
    error: string | null;
  }
  ```

### CharCountTextarea

- **Opis**: Komponent textarea z licznikiem znaków i progresywnym kolorowaniem wskazującym poprawność długości tekstu.
- **Główne elementy**:
  - `Textarea` (natywny element HTML)
  - `Label` - etykieta pola
  - Licznik znaków z kolorowaniem (aria-live region)
- **Obsługiwane interakcje**:
  - `onChange` - aktualizacja wartości i licznika
- **Obsługiwana walidacja**:
  - Wizualne wskazanie stanu walidacji poprzez kolor licznika:
    - Czerwony: < 1000 znaków lub > 10000 znaków
    - Zielony: 1000-10000 znaków
- **Typy**:
  - `CharCountTextareaProps`
- **Propsy**:
  ```typescript
  interface CharCountTextareaProps {
    value: string;
    onChange: (value: string) => void;
    minLength: number;
    maxLength: number;
    disabled?: boolean;
    error?: string;
  }
  ```

### GenerationLoader

- **Opis**: Komponent wyświetlający wieloetapowy stan ładowania podczas generowania fiszek przez AI.
- **Główne elementy**:
  - Spinner (0-2s)
  - Skeleton loader dla propozycji (2-5s)
  - Komunikat "Generowanie może potrwać dłużej..." (5s+)
- **Obsługiwane interakcje**: Brak (komponent prezentacyjny)
- **Obsługiwana walidacja**: Brak
- **Typy**:
  - `GenerationLoaderProps`
- **Propsy**:
  ```typescript
  interface GenerationLoaderProps {
    elapsedTime: number; // czas w sekundach od rozpoczęcia generowania
  }
  ```

### StagingArea

- **Opis**: Obszar recenzji wygenerowanych propozycji fiszek. Umożliwia masowe akcje oraz zarządzanie pojedynczymi propozycjami.
- **Główne elementy**:
  - `BulkActions` - przyciski masowych akcji
  - `ProposalList` - lista propozycji
  - `SaveActions` - przycisk zapisu
- **Obsługiwane interakcje**:
  - Akcje masowe (akceptuj/odrzuć wszystkie)
  - Zapis zaakceptowanych propozycji
- **Obsługiwana walidacja**:
  - Przycisk "Zapisz" aktywny tylko gdy istnieje co najmniej jedna zaakceptowana propozycja
- **Typy**:
  - `StagingAreaProps`
  - `ProposalViewModel`
- **Propsy**:
  ```typescript
  interface StagingAreaProps {
    proposals: ProposalViewModel[];
    onAcceptAll: () => void;
    onRejectAll: () => void;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onEdit: (id: string) => void;
    onSave: () => void;
    isSaving: boolean;
  }
  ```

### BulkActions

- **Opis**: Komponent z przyciskami do masowej akceptacji lub odrzucenia wszystkich propozycji.
- **Główne elementy**:
  - `Button` "Akceptuj wszystkie"
  - `Button` "Odrzuć wszystkie"
- **Obsługiwane interakcje**:
  - `onClick` na "Akceptuj wszystkie"
  - `onClick` na "Odrzuć wszystkie"
- **Obsługiwana walidacja**: Brak
- **Typy**:
  - `BulkActionsProps`
- **Propsy**:
  ```typescript
  interface BulkActionsProps {
    onAcceptAll: () => void;
    onRejectAll: () => void;
    disabled?: boolean;
  }
  ```

### ProposalCard

- **Opis**: Karta pojedynczej propozycji fiszki wyświetlająca treść (Przód/Tył) oraz przyciski akcji. Kolorowe obramowanie wskazuje status propozycji.
- **Główne elementy**:
  - Kontener z kolorowym obramowaniem (zależnym od statusu)
  - Treść przodu fiszki
  - Treść tyłu fiszki
  - Przyciski: Akceptuj, Edytuj, Odrzuć
- **Obsługiwane interakcje**:
  - `onClick` Akceptuj - zmiana statusu na "accepted"
  - `onClick` Edytuj - otwarcie modalu edycji
  - `onClick` Odrzuć - zmiana statusu na "rejected"
- **Obsługiwana walidacja**: Brak
- **Typy**:
  - `ProposalCardProps`
  - `ProposalViewModel`
  - `ProposalStatus`
- **Propsy**:
  ```typescript
  interface ProposalCardProps {
    proposal: ProposalViewModel;
    onAccept: () => void;
    onReject: () => void;
    onEdit: () => void;
  }
  ```

### ProposalEditModal

- **Opis**: Modal do edycji treści pojedynczej propozycji fiszki. Po zapisie propozycja automatycznie otrzymuje status "accepted" z flagą edycji.
- **Główne elementy**:
  - `Dialog` (Shadcn/ui)
  - `Textarea` dla pola Przód z licznikiem
  - `Textarea` dla pola Tył z licznikiem
  - `Button` "Zapisz zmiany"
  - `Button` "Anuluj"
- **Obsługiwane interakcje**:
  - `onChange` dla pól Przód i Tył
  - `onSubmit` - zapisanie zmian
  - `onCancel` / Escape - zamknięcie bez zapisu
- **Obsługiwana walidacja**:
  - Pole Przód nie może być puste
  - Pole Tył nie może być puste
  - Przycisk "Zapisz zmiany" disabled gdy walidacja nie przechodzi
- **Typy**:
  - `ProposalEditModalProps`
  - `ProposalViewModel`
- **Propsy**:
  ```typescript
  interface ProposalEditModalProps {
    proposal: ProposalViewModel | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, front: string, back: string) => void;
  }
  ```

## 5. Typy

### Typy DTO (z API)

```typescript
// Już zdefiniowane w src/types.ts

/**
 * AI-generated flashcard proposal (returned from POST /api/generations)
 */
export interface FlashcardProposalDTO {
  front: string;
  back: string;
}

/**
 * Response for AI generation (POST /api/generations)
 */
export interface GenerationResponseDTO {
  generation_log_id: string;
  proposals: FlashcardProposalDTO[];
  model_used: string;
  generated_count: number;
}

/**
 * Command for generating flashcards from text (POST /api/generations)
 */
export interface GenerateFlashcardsCommand {
  source_text: string;
}

/**
 * Command for batch creating flashcards from AI generation (POST /api/flashcards/batch)
 */
export interface CreateFlashcardsBatchCommand {
  generation_log_id: string;
  flashcards: BatchFlashcardItem[];
  rejected_count: number;
}

/**
 * Single flashcard item in batch create command
 */
export interface BatchFlashcardItem {
  front: string;
  back: string;
  original_front: string;
  original_back: string;
  is_edited: boolean;
}
```

### Typy ViewModel (nowe, do dodania)

```typescript
// Do dodania w src/components/generator/types.ts

/**
 * Status propozycji fiszki w Staging Area
 */
export type ProposalStatus = "pending" | "accepted" | "rejected";

/**
 * ViewModel dla pojedynczej propozycji fiszki w Staging Area
 */
export interface ProposalViewModel {
  id: string; // unikalne ID wygenerowane na froncie (np. crypto.randomUUID())
  front: string; // aktualna treść przodu (po edycji)
  back: string; // aktualna treść tyłu (po edycji)
  originalFront: string; // oryginalna treść z AI
  originalBack: string; // oryginalna treść z AI
  status: ProposalStatus;
  isEdited: boolean; // czy treść została zmodyfikowana
}

/**
 * Stan generatora przechowywany w localStorage
 */
export interface GeneratorState {
  sourceText: string;
  generationLogId: string | null;
  proposals: ProposalViewModel[];
}

/**
 * Stan błędów w formularzu generatora
 */
export interface GeneratorErrors {
  sourceText?: string;
  generation?: string;
  save?: string;
}
```

## 6. Zarządzanie stanem

### Custom Hook: `useGenerator`

Hook zarządzający całym stanem widoku Generator, łącznie z persystencją w localStorage.

```typescript
// src/lib/hooks/useGenerator.ts

interface UseGeneratorReturn {
  // Stan formularza
  sourceText: string;
  setSourceText: (text: string) => void;
  
  // Stan generowania
  isGenerating: boolean;
  generationError: string | null;
  
  // Stan Staging Area
  proposals: ProposalViewModel[];
  generationLogId: string | null;
  
  // Stan zapisu
  isSaving: boolean;
  saveError: string | null;
  
  // Stan modalu edycji
  editingProposal: ProposalViewModel | null;
  
  // Akcje generowania
  generateFlashcards: () => Promise<void>;
  
  // Akcje na propozycjach
  acceptProposal: (id: string) => void;
  rejectProposal: (id: string) => void;
  acceptAllProposals: () => void;
  rejectAllProposals: () => void;
  
  // Akcje edycji
  openEditModal: (id: string) => void;
  closeEditModal: () => void;
  saveProposalEdit: (id: string, front: string, back: string) => void;
  
  // Akcja zapisu
  saveAcceptedProposals: () => Promise<void>;
  
  // Pomocnicze
  hasAcceptedProposals: boolean;
  acceptedCount: number;
  rejectedCount: number;
  clearStagingArea: () => void;
}
```

### Persystencja w localStorage

- **Klucz**: `10xcards_generator_state`
- **Dane**: `GeneratorState` (serializowane jako JSON)
- **Inicjalizacja**: Przy montowaniu komponentu, odczyt z localStorage
- **Synchronizacja**: Przy każdej zmianie stanu proposals lub sourceText
- **Czyszczenie**: Po pomyślnym zapisie propozycji do bazy danych

### Czas ładowania (dla GenerationLoader)

Używamy `useState` + `useEffect` z `setInterval` do śledzenia czasu od rozpoczęcia generowania, aby wyświetlać odpowiedni etap loadera.

## 7. Integracja API

### Generowanie propozycji fiszek

**Endpoint**: `POST /api/generations`

**Żądanie**:
```typescript
interface GenerateFlashcardsCommand {
  source_text: string; // 1000-10000 znaków
}
```

**Odpowiedź sukcesu (200)**:
```typescript
interface GenerationResponseDTO {
  generation_log_id: string;
  proposals: FlashcardProposalDTO[];
  model_used: string;
  generated_count: number;
}
```

**Obsługa błędów**:
- `400` - Tekst poza zakresem (inline przy textarea)
- `401` - Brak autoryzacji (przekierowanie do logowania)
- `502` - AI service unavailable (Toast z "Spróbuj ponownie")
- `503` - AI rate limit (Toast z "Spróbuj ponownie")

### Zapis zaakceptowanych propozycji

**Endpoint**: `POST /api/flashcards/batch`

**Żądanie**:
```typescript
interface CreateFlashcardsBatchCommand {
  generation_log_id: string;
  flashcards: BatchFlashcardItem[];
  rejected_count: number;
}

interface BatchFlashcardItem {
  front: string;
  back: string;
  original_front: string;
  original_back: string;
  is_edited: boolean;
}
```

**Odpowiedź sukcesu (201)**:
```typescript
interface FlashcardsBatchResponseDTO {
  created_count: number;
  flashcards: FlashcardBatchItemDTO[];
}
```

**Obsługa błędów**:
- `400` - Błąd walidacji (Toast z komunikatem)
- `401` - Brak autoryzacji (przekierowanie do logowania)
- `404` - Generation log nie znaleziony (Toast z błędem)

## 8. Interakcje użytkownika

### Wprowadzanie tekstu źródłowego

1. Użytkownik wkleja lub wpisuje tekst w textarea
2. Licznik znaków aktualizuje się w czasie rzeczywistym
3. Kolor licznika zmienia się:
   - Czerwony: < 1000 lub > 10000 znaków
   - Zielony: 1000-10000 znaków
4. Przycisk "Generuj" jest aktywny tylko przy poprawnej długości

### Generowanie fiszek

1. Użytkownik klika "Generuj fiszki"
2. Wyświetla się loader wieloetapowy
3. Po otrzymaniu odpowiedzi:
   - Staging Area pojawia się pod formularzem
   - Focus przenosi się na Staging Area
   - Propozycje mają status "pending"

### Recenzja propozycji

1. **Akceptacja pojedynczej**: Klik "Akceptuj" → status "accepted" (zielone obramowanie)
2. **Odrzucenie pojedynczej**: Klik "Odrzuć" → status "rejected" (czerwone obramowanie)
3. **Edycja**: Klik "Edytuj" → otwarcie modalu → po zapisie status "accepted" z flagą isEdited=true
4. **Masowa akceptacja**: "Akceptuj wszystkie" → wszystkie pending → accepted
5. **Masowe odrzucenie**: "Odrzuć wszystkie" → wszystkie pending → rejected

### Zapis propozycji

1. Użytkownik klika "Zapisz zaakceptowane"
2. Batch POST do API z zaakceptowanymi propozycjami
3. Po sukcesie:
   - Toast z potwierdzeniem
   - Wyczyszczenie Staging Area
   - Wyczyszczenie localStorage
4. Po błędzie:
   - Toast z błędem
   - Dane pozostają w localStorage

### Edycja propozycji w modalu

1. Użytkownik klika "Edytuj" na propozycji
2. Modal otwiera się z aktualnymi wartościami
3. Użytkownik modyfikuje treść
4. "Zapisz zmiany" → aktualizacja propozycji, zamknięcie modalu
5. "Anuluj" lub Escape → zamknięcie bez zmian

## 9. Warunki i walidacja

### Walidacja tekstu źródłowego

| Warunek | Komponent | Efekt UI |
|---------|-----------|----------|
| Tekst < 1000 znaków | CharCountTextarea, SourceTextForm | Licznik czerwony, przycisk "Generuj" disabled |
| Tekst > 10000 znaków | CharCountTextarea, SourceTextForm | Licznik czerwony, przycisk "Generuj" disabled |
| Tekst 1000-10000 znaków | CharCountTextarea, SourceTextForm | Licznik zielony, przycisk "Generuj" enabled |
| Błąd 400 z API | SourceTextForm | Komunikat inline pod textarea |

### Walidacja edycji propozycji

| Warunek | Komponent | Efekt UI |
|---------|-----------|----------|
| Pole Przód puste | ProposalEditModal | Komunikat błędu, przycisk "Zapisz" disabled |
| Pole Tył puste | ProposalEditModal | Komunikat błędu, przycisk "Zapisz" disabled |
| Oba pola wypełnione | ProposalEditModal | Przycisk "Zapisz" enabled |

### Walidacja zapisu

| Warunek | Komponent | Efekt UI |
|---------|-----------|----------|
| Brak zaakceptowanych propozycji | StagingArea | Przycisk "Zapisz zaakceptowane" disabled |
| Trwa zapis | StagingArea | Przycisk "Zapisz" w stanie loading, wszystkie akcje disabled |

## 10. Obsługa błędów

### Błędy generowania

| Kod HTTP | Typ błędu | Obsługa |
|----------|-----------|---------|
| 400 | Walidacja tekstu | Inline error pod textarea |
| 401 | Brak autoryzacji | Przekierowanie do `/login` |
| 502 | AI service unavailable | Toast: "Usługa AI jest chwilowo niedostępna. Spróbuj ponownie." z przyciskiem retry |
| 503 | AI rate limit | Toast: "Przekroczono limit zapytań. Spróbuj ponownie za chwilę." z przyciskiem retry |
| Network error | Brak połączenia | Toast: "Nie można połączyć z serwerem. Sprawdź połączenie internetowe." |

### Błędy zapisu

| Kod HTTP | Typ błędu | Obsługa |
|----------|-----------|---------|
| 400 | Walidacja danych | Toast z komunikatem błędu, dane pozostają w localStorage |
| 401 | Brak autoryzacji | Przekierowanie do `/login` |
| 404 | Generation log nie istnieje | Toast: "Sesja generowania wygasła. Wygeneruj fiszki ponownie." |
| 500 | Błąd serwera | Toast: "Wystąpił błąd serwera. Spróbuj ponownie." |

### Komunikaty błędów (język polski)

- "Tekst źródłowy musi zawierać co najmniej 1000 znaków"
- "Tekst źródłowy nie może przekraczać 10000 znaków"
- "Pytanie nie może być puste"
- "Odpowiedź nie może być pusta"
- "Usługa AI jest chwilowo niedostępna. Spróbuj ponownie."
- "Przekroczono limit zapytań. Spróbuj ponownie za chwilę."
- "Nie można połączyć z serwerem. Sprawdź połączenie internetowe."
- "Sesja generowania wygasła. Wygeneruj fiszki ponownie."
- "Wystąpił błąd serwera. Spróbuj ponownie."

## 11. Kroki implementacji

### Krok 1: Przygotowanie infrastruktury

1. Utworzenie struktury katalogów:
   - `src/components/generator/`
   - `src/lib/hooks/useGenerator.ts`
2. Dodanie brakujących komponentów shadcn/ui:
   - `Textarea`
   - `Dialog`
   - `Toast` / `Sonner`
   - `Skeleton`
3. Zdefiniowanie typów ViewModel w `src/components/generator/types.ts`

### Krok 2: Implementacja custom hook useGenerator

1. Utworzenie hooka z podstawowym stanem (sourceText, proposals, errors)
2. Implementacja persystencji localStorage
3. Implementacja funkcji generowania (fetch do `/api/generations`)
4. Implementacja funkcji zarządzania propozycjami (accept, reject, edit)
5. Implementacja funkcji zapisu (fetch do `/api/flashcards/batch`)

### Krok 3: Implementacja komponentów formularza

1. `CharCountTextarea` - textarea z licznikiem i kolorowaniem
2. `SourceTextForm` - formularz z textarea i przyciskiem
3. `GenerationLoader` - wieloetapowy loader

### Krok 4: Implementacja komponentów Staging Area

1. `ProposalCard` - karta pojedynczej propozycji z akcjami
2. `BulkActions` - przyciski masowych akcji
3. `StagingArea` - kontener łączący powyższe komponenty

### Krok 5: Implementacja modalu edycji

1. `ProposalEditModal` - dialog z formularzem edycji
2. Walidacja pól (niepuste)
3. Obsługa zamykania (Escape, klik poza modalem)

### Krok 6: Implementacja głównego kontenera

1. `GeneratorContainer` - główny komponent łączący wszystko
2. Integracja z hookiem `useGenerator`
3. Focus management po wygenerowaniu (przejście do Staging Area)

### Krok 7: Utworzenie strony Astro

1. `src/pages/generator.astro` - strona chroniona
2. Import i renderowanie `GeneratorContainer` z `client:load`
3. Konfiguracja middleware dla ochrony strony

### Krok 8: Implementacja obsługi błędów i Toast

1. Konfiguracja systemu Toast (Sonner lub shadcn Toast)
2. Implementacja wyświetlania błędów API
3. Implementacja przycisku "Spróbuj ponownie"

### Krok 9: Implementacja dostępności (a11y)

1. Dodanie aria-live region dla licznika znaków
2. Focus trap w modalu edycji
3. Obsługa klawiatury (Escape, Tab)
4. Semantyczne nagłówki i etykiety

### Krok 10: Testy i optymalizacja

1. Testy manualne wszystkich ścieżek użytkownika
2. Testy edge cases (puste odpowiedzi AI, błędy sieci)
3. Weryfikacja persystencji localStorage
4. Optymalizacja wydajności (memo, useCallback)

### Krok 11: Stylowanie i responsywność

1. Stylowanie komponentów zgodnie z design system
2. Responsywność: 1 kolumna na mobile, 2 kolumny na desktop
3. Animacje z respektowaniem prefers-reduced-motion
4. Kolorowanie obramowań propozycji według statusu
