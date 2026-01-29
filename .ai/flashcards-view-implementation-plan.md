# Plan implementacji widoku Moje Fiszki

## 1. Przegląd

Widok "Moje Fiszki" (`/flashcards`) służy do przeglądania, wyszukiwania i zarządzania wszystkimi fiszkami użytkownika. Umożliwia wyświetlanie listy fiszek z paginacją, wyszukiwanie tekstowe, edycję i usuwanie fiszek przez modale, resetowanie postępów nauki oraz ręczne dodawanie nowych fiszek. Widok jest responsywny — na desktop wyświetla tabelę, na mobile karty.

## 2. Routing widoku

- **Ścieżka**: `/flashcards`
- **Typ strony**: Strona chroniona (SSR z middleware sprawdzającym sesję Supabase)
- **Plik**: `src/pages/flashcards.astro`

## 3. Struktura komponentów

```
flashcards.astro
└── FlashcardsContainer (client:load)
    ├── FlashcardsHeader
    │   ├── Tytuł strony
    │   └── Button "Dodaj fiszkę"
    ├── FlashcardsToolbar
    │   ├── SearchInput (wyszukiwarka z debounce)
    │   └── SortSelect (sortowanie)
    ├── FlashcardsContent
    │   ├── LoadingState (Skeleton)
    │   ├── EmptyState
    │   ├── FlashcardsTable (desktop >= 768px)
    │   │   └── FlashcardTableRow
    │   └── FlashcardCardList (mobile < 768px)
    │       └── FlashcardCard
    ├── Pagination
    ├── FlashcardEditModal
    │   ├── Formularz edycji (front, back)
    │   ├── Sekcja informacji read-only
    │   ├── AlertDialog "Resetuj postęp"
    │   └── AlertDialog "Usuń"
    └── FlashcardAddModal
        └── Formularz dodawania (front, back)
```

## 4. Szczegóły komponentów

### FlashcardsContainer

- **Opis**: Główny komponent-kontener orkiestrujący cały widok. Zarządza stanem za pomocą custom hooka `useFlashcards`, przekazuje dane i callbacki do komponentów potomnych.
- **Główne elementy**: `<section>` z `aria-labelledby`, zawierający wszystkie komponenty potomne
- **Obsługiwane interakcje**:
  - Montowanie: automatyczne pobranie pierwszej strony fiszek
  - Obsługa zmiany filtrów/sortowania
  - Obsługa paginacji
  - Otwieranie/zamykanie modali
- **Obsługiwana walidacja**: Brak (deleguje do komponentów potomnych)
- **Typy**: `FlashcardsListResponseDTO`, `FlashcardListItemDTO`, `FlashcardsQueryParams`
- **Propsy**: Brak (komponent top-level)

### FlashcardsHeader

- **Opis**: Nagłówek widoku z tytułem strony i głównym przyciskiem akcji "Dodaj fiszkę"
- **Główne elementy**: `<header>`, `<h1>`, `<Button>`
- **Obsługiwane interakcje**:
  - Kliknięcie "Dodaj fiszkę" — otwiera `FlashcardAddModal`
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**:
  - `onAddClick: () => void`

### FlashcardsToolbar

- **Opis**: Pasek narzędziowy z wyszukiwarką i opcjami sortowania
- **Główne elementy**: `<div>` flex container, `<SearchInput>`, `<SortSelect>`
- **Obsługiwane interakcje**:
  - Wpisywanie w wyszukiwarkę (debounce 300ms)
  - Zmiana sortowania
- **Obsługiwana walidacja**: Brak (wartości są zawsze poprawne)
- **Typy**: `FlashcardsQueryParams`
- **Propsy**:
  - `searchValue: string`
  - `onSearchChange: (value: string) => void`
  - `sortValue: "created_at" | "updated_at" | "next_review_date"`
  - `sortOrder: "asc" | "desc"`
  - `onSortChange: (sort: string, order: string) => void`

### SearchInput

- **Opis**: Pole wyszukiwania z ikoną lupy i funkcją debounce
- **Główne elementy**: `<div>` wrapper, `<Input>`, ikona `Search` z lucide-react
- **Obsługiwane interakcje**:
  - Wpisywanie tekstu z debounce 300ms
  - Czyszczenie pola (przycisk X gdy wartość niepusta)
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**:
  - `value: string`
  - `onChange: (value: string) => void`
  - `placeholder?: string`

### SortSelect

- **Opis**: Komponent select do wyboru kryterium i kierunku sortowania
- **Główne elementy**: `<select>` lub komponenty Select z shadcn/ui
- **Obsługiwane interakcje**:
  - Zmiana wartości sortowania
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**:
  - `sort: "created_at" | "updated_at" | "next_review_date"`
  - `order: "asc" | "desc"`
  - `onSortChange: (sort: string, order: string) => void`

### FlashcardsContent

- **Opis**: Komponent warunkowy renderujący odpowiedni stan: ładowanie, pusty lub listę fiszek
- **Główne elementy**: Warunkowo `<LoadingState>`, `<EmptyState>`, `<FlashcardsTable>` lub `<FlashcardCardList>`
- **Obsługiwane interakcje**: Deleguje do komponentów potomnych
- **Obsługiwana walidacja**: Brak
- **Typy**: `FlashcardListItemDTO[]`
- **Propsy**:
  - `flashcards: FlashcardListItemDTO[]`
  - `isLoading: boolean`
  - `onFlashcardClick: (flashcard: FlashcardListItemDTO) => void`

### LoadingState

- **Opis**: Stan ładowania z komponentami Skeleton
- **Główne elementy**: Siatka `<Skeleton>` imitująca wiersze tabeli/karty
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: Brak

### EmptyState

- **Opis**: Stan pusty wyświetlany gdy brak fiszek lub brak wyników wyszukiwania
- **Główne elementy**: `<div>` z ikoną, tekstem i przyciskami CTA
- **Obsługiwane interakcje**:
  - Kliknięcie "Wygeneruj fiszki z AI" — nawigacja do `/generator`
  - Kliknięcie "Dodaj fiszkę ręcznie" — callback do otwarcia modalu
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**:
  - `hasSearchQuery: boolean`
  - `onClearSearch: () => void`
  - `onAddClick: () => void`

### FlashcardsTable

- **Opis**: Tabela fiszek wyświetlana na desktop (>= 768px)
- **Główne elementy**: `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th scope="col">`, `<td>`
- **Obsługiwane interakcje**:
  - Kliknięcie wiersza — otwiera modal edycji
  - Obsługa klawiatury (Enter/Space na wierszu)
- **Obsługiwana walidacja**: Brak
- **Typy**: `FlashcardListItemDTO[]`
- **Propsy**:
  - `flashcards: FlashcardListItemDTO[]`
  - `onFlashcardClick: (flashcard: FlashcardListItemDTO) => void`

### FlashcardTableRow

- **Opis**: Pojedynczy wiersz tabeli reprezentujący fiszkę
- **Główne elementy**: `<tr>` klikalny, `<td>` z treścią (skróconą do 100-150 znaków), badge "AI"
- **Obsługiwane interakcje**:
  - Kliknięcie/Enter — wywołuje callback
- **Obsługiwana walidacja**: Brak
- **Typy**: `FlashcardListItemDTO`
- **Propsy**:
  - `flashcard: FlashcardListItemDTO`
  - `onClick: () => void`

### FlashcardCardList

- **Opis**: Lista kart fiszek wyświetlana na mobile (< 768px)
- **Główne elementy**: `<div>` z układem flex/grid, lista `<FlashcardCard>`
- **Obsługiwane interakcje**: Deleguje do `FlashcardCard`
- **Obsługiwana walidacja**: Brak
- **Typy**: `FlashcardListItemDTO[]`
- **Propsy**:
  - `flashcards: FlashcardListItemDTO[]`
  - `onFlashcardClick: (flashcard: FlashcardListItemDTO) => void`

### FlashcardCard

- **Opis**: Pojedyncza karta fiszki na mobile
- **Główne elementy**: `<article>` z border, `<div>` dla przodu/tyłu (skrócone), badge "AI"
- **Obsługiwane interakcje**:
  - Kliknięcie karty — otwiera modal edycji
- **Obsługiwana walidacja**: Brak
- **Typy**: `FlashcardListItemDTO`
- **Propsy**:
  - `flashcard: FlashcardListItemDTO`
  - `onClick: () => void`

### Pagination

- **Opis**: Komponent paginacji z informacją o aktualnej stronie i liczbie wyników
- **Główne elementy**: `<nav>`, przyciski Poprzednia/Następna, numery stron, tekst "Strona X z Y (Z wyników)"
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku strony
  - Kliknięcie Poprzednia/Następna
- **Obsługiwana walidacja**: Brak (przyciski disabled gdy nieosiągalne)
- **Typy**: `PaginationDTO`
- **Propsy**:
  - `pagination: PaginationDTO`
  - `onPageChange: (page: number) => void`

### FlashcardEditModal

- **Opis**: Modal do edycji istniejącej fiszki z opcjami resetowania postępu i usuwania
- **Główne elementy**:
  - `<Dialog>` z shadcn/ui
  - `<DialogHeader>` z tytułem
  - `<form>` z dwoma `<Textarea>` (Przód, Tył) z licznikami znaków
  - Sekcja informacji read-only: data utworzenia, źródło (badge AI/Manualna), parametry SM-2
  - `<DialogFooter>` z przyciskami: Zapisz, Anuluj
  - Przyciski akcji destrukcyjnych: "Resetuj postęp", "Usuń"
  - Wewnętrzne `<AlertDialog>` dla potwierdzenia akcji destrukcyjnych
- **Obsługiwane interakcje**:
  - Edycja pól front/back
  - Zapisanie zmian (PUT /api/flashcards/:id)
  - Resetowanie postępu (POST /api/flashcards/:id/reset-progress) z potwierdzeniem
  - Usunięcie fiszki (DELETE /api/flashcards/:id) z potwierdzeniem
  - Zamknięcie modalu (Escape lub przycisk)
- **Obsługiwana walidacja**:
  - Pole "Przód" nie może być puste (po trim)
  - Pole "Tył" nie może być puste (po trim)
  - Przycisk "Zapisz" disabled gdy walidacja nie przechodzi
- **Typy**: `FlashcardListItemDTO`, `UpdateFlashcardCommand`, `FlashcardUpdateResponseDTO`, `FlashcardResetProgressResponseDTO`, `MessageResponseDTO`
- **Propsy**:
  - `flashcard: FlashcardListItemDTO | null`
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onSave: (id: string, data: UpdateFlashcardCommand) => Promise<void>`
  - `onResetProgress: (id: string) => Promise<void>`
  - `onDelete: (id: string) => Promise<void>`

### FlashcardAddModal

- **Opis**: Modal do ręcznego tworzenia nowej fiszki
- **Główne elementy**:
  - `<Dialog>` z shadcn/ui
  - `<DialogHeader>` z tytułem
  - `<form>` z dwoma `<Textarea>` (Przód, Tył) z licznikami znaków
  - `<DialogFooter>` z przyciskami: Dodaj, Anuluj
- **Obsługiwane interakcje**:
  - Wypełnienie pól front/back
  - Zapisanie nowej fiszki (POST /api/flashcards)
  - Zamknięcie modalu
- **Obsługiwana walidacja**:
  - Pole "Przód" nie może być puste (po trim)
  - Pole "Tył" nie może być puste (po trim)
  - Przycisk "Dodaj" disabled gdy walidacja nie przechodzi
- **Typy**: `CreateFlashcardCommand`, `FlashcardCreateResponseDTO`
- **Propsy**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onSave: (data: CreateFlashcardCommand) => Promise<void>`

### AlertDialog (potwierdzenie)

- **Opis**: Dialog potwierdzenia dla akcji destrukcyjnych (reset postępu, usunięcie)
- **Główne elementy**: `<AlertDialog>` z shadcn/ui (do dodania), tytuł, opis, przyciski Potwierdź/Anuluj
- **Obsługiwane interakcje**:
  - Potwierdzenie akcji
  - Anulowanie
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**:
  - `isOpen: boolean`
  - `onConfirm: () => void`
  - `onCancel: () => void`
  - `title: string`
  - `description: string`
  - `confirmLabel: string`
  - `variant?: "default" | "destructive"`

## 5. Typy

### Typy z API (istniejące w `src/types.ts`)

```typescript
// DTO dla elementu listy fiszek
type FlashcardListItemDTO = Pick<
  FlashcardRow,
  | "id"
  | "front"
  | "back"
  | "is_ai_generated"
  | "interval"
  | "ease_factor"
  | "repetitions"
  | "next_review_date"
  | "last_reviewed_at"
  | "created_at"
  | "updated_at"
>;

// Parametry paginacji
interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Odpowiedź listy fiszek
interface FlashcardsListResponseDTO {
  data: FlashcardListItemDTO[];
  pagination: PaginationDTO;
}

// Parametry zapytania
interface FlashcardsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "created_at" | "updated_at" | "next_review_date";
  order?: "asc" | "desc";
}

// Komendy
interface CreateFlashcardCommand {
  front: string;
  back: string;
}

interface UpdateFlashcardCommand {
  front?: string;
  back?: string;
}

// Odpowiedzi
type FlashcardCreateResponseDTO = Pick<FlashcardRow, ...>;
type FlashcardUpdateResponseDTO = Pick<FlashcardRow, "id" | "front" | "back" | "is_ai_generated" | "updated_at">;

interface FlashcardResetProgressResponseDTO {
  id: string;
  interval: number;
  ease_factor: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string | null;
  message: string;
}

interface MessageResponseDTO {
  message: string;
}
```

### Nowe typy ViewModel (do utworzenia w `src/components/flashcards/types.ts`)

```typescript
// Stan UI widoku fiszek
interface FlashcardsViewState {
  // Dane
  flashcards: FlashcardListItemDTO[];
  pagination: PaginationDTO | null;
  
  // Filtry i sortowanie
  searchQuery: string;
  sortField: "created_at" | "updated_at" | "next_review_date";
  sortOrder: "asc" | "desc";
  currentPage: number;
  
  // Stany ładowania
  isLoading: boolean;
  isLoadingMore: boolean;
  
  // Błędy
  error: string | null;
  
  // Stan modali
  editModalFlashcard: FlashcardListItemDTO | null;
  isEditModalOpen: boolean;
  isAddModalOpen: boolean;
  
  // Stany operacji
  isSaving: boolean;
  isDeleting: boolean;
  isResettingProgress: boolean;
}

// Błędy formularza w modalach
interface FlashcardFormErrors {
  front?: string;
  back?: string;
  general?: string;
}

// Stan formularza w modalu
interface FlashcardFormState {
  front: string;
  back: string;
  touched: {
    front: boolean;
    back: boolean;
  };
  errors: FlashcardFormErrors;
}
```

## 6. Zarządzanie stanem

### Custom Hook: `useFlashcards`

Hook zarządzający całym stanem widoku fiszek. Wzorowany na istniejącym `useGenerator`.

```typescript
// src/lib/hooks/useFlashcards.ts

interface UseFlashcardsReturn {
  // Dane
  flashcards: FlashcardListItemDTO[];
  pagination: PaginationDTO | null;
  
  // Filtry
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortField: "created_at" | "updated_at" | "next_review_date";
  sortOrder: "asc" | "desc";
  setSorting: (field: string, order: string) => void;
  
  // Paginacja
  currentPage: number;
  goToPage: (page: number) => void;
  
  // Stany
  isLoading: boolean;
  error: string | null;
  
  // Modal edycji
  editingFlashcard: FlashcardListItemDTO | null;
  isEditModalOpen: boolean;
  openEditModal: (flashcard: FlashcardListItemDTO) => void;
  closeEditModal: () => void;
  
  // Modal dodawania
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
  
  // Operacje CRUD
  isSaving: boolean;
  saveError: string | null;
  createFlashcard: (data: CreateFlashcardCommand) => Promise<void>;
  updateFlashcard: (id: string, data: UpdateFlashcardCommand) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
  resetProgress: (id: string) => Promise<void>;
  
  // Helpers
  hasFlashcards: boolean;
  hasSearchQuery: boolean;
  clearSearch: () => void;
  refetch: () => Promise<void>;
}
```

**Kluczowe funkcjonalności hooka:**

1. **Pobieranie danych**: Fetch przy montowaniu i przy zmianie filtrów/strony
2. **Debounce wyszukiwania**: 300ms opóźnienie przed wysłaniem zapytania
3. **Optymistyczne aktualizacje**: Natychmiastowa aktualizacja UI przed potwierdzeniem z serwera
4. **Rollback przy błędzie**: Przywrócenie poprzedniego stanu gdy operacja się nie powiedzie
5. **Zarządzanie modalami**: Stan otwarcia i danych dla modali edycji/dodawania
6. **Obsługa błędów**: Centralne zarządzanie błędami z wyświetlaniem toast

## 7. Integracja API

### Endpointy

| Operacja | Metoda | Endpoint | Typ żądania | Typ odpowiedzi |
|----------|--------|----------|-------------|----------------|
| Lista fiszek | GET | `/api/flashcards` | `FlashcardsQueryParams` (query) | `FlashcardsListResponseDTO` |
| Utwórz fiszkę | POST | `/api/flashcards` | `CreateFlashcardCommand` | `FlashcardCreateResponseDTO` |
| Aktualizuj fiszkę | PUT | `/api/flashcards/:id` | `UpdateFlashcardCommand` | `FlashcardUpdateResponseDTO` |
| Usuń fiszkę | DELETE | `/api/flashcards/:id` | - | `MessageResponseDTO` |
| Resetuj postęp | POST | `/api/flashcards/:id/reset-progress` | - | `FlashcardResetProgressResponseDTO` |

### Implementacja fetch w hooku

```typescript
// Pobieranie listy
const fetchFlashcards = async (params: FlashcardsQueryParams) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);
  
  const response = await fetch(`/api/flashcards?${searchParams}`);
  if (!response.ok) {
    throw new Error("Nie udało się pobrać fiszek");
  }
  return response.json() as Promise<FlashcardsListResponseDTO>;
};

// Tworzenie fiszki
const createFlashcard = async (data: CreateFlashcardCommand) => {
  const response = await fetch("/api/flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Nie udało się utworzyć fiszki");
  }
  return response.json() as Promise<FlashcardCreateResponseDTO>;
};

// Aktualizacja fiszki
const updateFlashcard = async (id: string, data: UpdateFlashcardCommand) => {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Nie udało się zaktualizować fiszki");
  }
  return response.json() as Promise<FlashcardUpdateResponseDTO>;
};

// Usuwanie fiszki
const deleteFlashcard = async (id: string) => {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Nie udało się usunąć fiszki");
  }
  return response.json() as Promise<MessageResponseDTO>;
};

// Resetowanie postępu
const resetProgress = async (id: string) => {
  const response = await fetch(`/api/flashcards/${id}/reset-progress`, {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Nie udało się zresetować postępu");
  }
  return response.json() as Promise<FlashcardResetProgressResponseDTO>;
};
```

## 8. Interakcje użytkownika

| Interakcja | Element UI | Oczekiwany rezultat |
|------------|------------|---------------------|
| Wpisanie tekstu w wyszukiwarkę | SearchInput | Po 300ms debounce: nowe zapytanie API z filtrem search, reset do strony 1 |
| Zmiana sortowania | SortSelect | Nowe zapytanie API z nowym sortowaniem, reset do strony 1 |
| Kliknięcie przycisku strony | Pagination | Nowe zapytanie API z nową stroną |
| Kliknięcie wiersza/karty fiszki | FlashcardTableRow / FlashcardCard | Otwarcie FlashcardEditModal z danymi fiszki |
| Kliknięcie "Dodaj fiszkę" | FlashcardsHeader Button | Otwarcie FlashcardAddModal |
| Edycja i zapisanie fiszki | FlashcardEditModal | PUT request, toast sukcesu, zamknięcie modalu, odświeżenie listy |
| Kliknięcie "Resetuj postęp" | FlashcardEditModal | AlertDialog potwierdzenia, POST request, toast sukcesu, aktualizacja danych fiszki |
| Kliknięcie "Usuń" | FlashcardEditModal | AlertDialog potwierdzenia, DELETE request, toast sukcesu, zamknięcie modalu, odświeżenie listy |
| Dodanie nowej fiszki | FlashcardAddModal | POST request, toast sukcesu, zamknięcie modalu, odświeżenie listy |
| Kliknięcie "Wyczyść filtr" (empty state) | EmptyState | Wyczyszczenie searchQuery, ponowne pobranie danych |
| Kliknięcie "Wygeneruj fiszki z AI" | EmptyState | Nawigacja do `/generator` |

## 9. Warunki i walidacja

### Walidacja formularzy (modele edycji/dodawania)

| Pole | Warunek | Komunikat błędu | Wpływ na UI |
|------|---------|-----------------|-------------|
| front | Niepuste po trim | "Pole Przód nie może być puste" | Czerwona ramka, tekst błędu pod polem, przycisk Zapisz/Dodaj disabled |
| back | Niepuste po trim | "Pole Tył nie może być puste" | Czerwona ramka, tekst błędu pod polem, przycisk Zapisz/Dodaj disabled |

### Walidacja parametrów zapytania

| Parametr | Warunek | Zachowanie przy błędzie |
|----------|---------|------------------------|
| page | Liczba całkowita >= 1 | Domyślnie 1 |
| limit | Liczba całkowita 1-100 | Domyślnie 20 |
| search | String (dowolny) | Brak walidacji |
| sort | Enum: created_at, updated_at, next_review_date | Domyślnie created_at |
| order | Enum: asc, desc | Domyślnie desc |

### Warunki UI

| Warunek | Komponent | Efekt |
|---------|-----------|-------|
| isLoading === true | FlashcardsContent | Wyświetla LoadingState (Skeleton) |
| flashcards.length === 0 && !isLoading | FlashcardsContent | Wyświetla EmptyState |
| hasSearchQuery && flashcards.length === 0 | EmptyState | Pokazuje komunikat "Brak wyników" z przyciskiem "Wyczyść filtr" |
| !hasSearchQuery && flashcards.length === 0 | EmptyState | Pokazuje komunikat "Brak fiszek" z CTA do generatora |
| pagination.page === 1 | Pagination | Przycisk "Poprzednia" disabled |
| pagination.page === pagination.total_pages | Pagination | Przycisk "Następna" disabled |
| isSaving === true | Modal buttons | Przycisk Zapisz/Dodaj pokazuje spinner, disabled |
| isDeleting === true | Delete button | Przycisk Usuń pokazuje spinner, disabled |
| front.trim() === "" \|\| back.trim() === "" | Modal save button | Przycisk disabled |

## 10. Obsługa błędów

### Błędy API

| Kod HTTP | Scenariusz | Obsługa |
|----------|------------|---------|
| 400 | Nieprawidłowe parametry zapytania | Toast z komunikatem błędu, fallback do domyślnych parametrów |
| 401 | Sesja wygasła | Przekierowanie do `/login`, zapisanie URL w sessionStorage |
| 404 | Fiszka nie istnieje (podczas edycji/usuwania) | Toast "Fiszka nie została znaleziona", zamknięcie modalu, odświeżenie listy |
| 500 | Błąd serwera | Toast "Wystąpił błąd serwera. Spróbuj ponownie później." |
| Network Error | Brak połączenia | Toast "Brak połączenia z internetem" z przyciskiem "Spróbuj ponownie" |

### Błędy walidacji (client-side)

| Pole | Błąd | Komunikat |
|------|------|-----------|
| front | Puste | "Pole Przód nie może być puste" |
| back | Puste | "Pole Tył nie może być puste" |

### Obsługa błędów w komponentach

```typescript
// W hooku useFlashcards
const handleApiError = (error: unknown, defaultMessage: string) => {
  if (error instanceof Response && error.status === 401) {
    // Przekierowanie do logowania
    sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
    window.location.href = "/login";
    return;
  }
  
  const message = error instanceof Error ? error.message : defaultMessage;
  toast.error(message, { duration: 5000 });
};
```

### Optymistyczne aktualizacje z rollback

```typescript
// Przykład dla usuwania
const deleteFlashcard = async (id: string) => {
  const previousFlashcards = flashcards;
  
  // Optymistyczna aktualizacja
  setFlashcards(prev => prev.filter(f => f.id !== id));
  closeEditModal();
  
  try {
    await api.deleteFlashcard(id);
    toast.success("Fiszka została usunięta");
    refetch(); // Odśwież dla aktualnej paginacji
  } catch (error) {
    // Rollback
    setFlashcards(previousFlashcards);
    handleApiError(error, "Nie udało się usunąć fiszki");
  }
};
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1. Utworzyć katalog `src/components/flashcards/`
2. Utworzyć pliki:
   - `FlashcardsContainer.tsx`
   - `FlashcardsHeader.tsx`
   - `FlashcardsToolbar.tsx`
   - `SearchInput.tsx`
   - `SortSelect.tsx`
   - `FlashcardsContent.tsx`
   - `LoadingState.tsx`
   - `EmptyState.tsx`
   - `FlashcardsTable.tsx`
   - `FlashcardTableRow.tsx`
   - `FlashcardCardList.tsx`
   - `FlashcardCard.tsx`
   - `Pagination.tsx`
   - `FlashcardEditModal.tsx`
   - `FlashcardAddModal.tsx`
   - `ConfirmDialog.tsx`
   - `types.ts`

### Krok 2: Dodanie komponentu AlertDialog z shadcn/ui

1. Uruchomić `npx shadcn@latest add alert-dialog`
2. Zweryfikować instalację w `src/components/ui/alert-dialog.tsx`

### Krok 3: Implementacja typów

1. Utworzyć `src/components/flashcards/types.ts` z typami ViewModel
2. Zweryfikować istniejące typy w `src/types.ts`

### Krok 4: Implementacja custom hooka `useFlashcards`

1. Utworzyć `src/lib/hooks/useFlashcards.ts`
2. Zaimplementować pobieranie danych z API
3. Zaimplementować debounce dla wyszukiwania
4. Zaimplementować zarządzanie stanem modali
5. Zaimplementować operacje CRUD z obsługą błędów

### Krok 5: Implementacja komponentów pomocniczych

1. `SearchInput` — pole wyszukiwania z debounce
2. `SortSelect` — select sortowania
3. `Pagination` — komponent paginacji
4. `LoadingState` — skeleton loader
5. `EmptyState` — stan pusty z CTA
6. `ConfirmDialog` — dialog potwierdzenia

### Krok 6: Implementacja komponentów listy

1. `FlashcardTableRow` — wiersz tabeli
2. `FlashcardsTable` — tabela desktop
3. `FlashcardCard` — karta mobile
4. `FlashcardCardList` — lista kart mobile
5. `FlashcardsContent` — wrapper warunkowy

### Krok 7: Implementacja modali

1. `FlashcardAddModal` — modal dodawania
2. `FlashcardEditModal` — modal edycji z akcjami destrukcyjnymi

### Krok 8: Implementacja komponentów kontenerowych

1. `FlashcardsToolbar` — pasek narzędziowy
2. `FlashcardsHeader` — nagłówek z przyciskiem dodawania
3. `FlashcardsContainer` — główny kontener

### Krok 9: Utworzenie strony Astro

1. Utworzyć `src/pages/flashcards.astro`
2. Dodać middleware ochrony strony (sprawdzenie sesji)
3. Zintegrować `FlashcardsContainer` z `client:load`

### Krok 10: Stylowanie i responsywność

1. Zweryfikować breakpoint 768px dla desktop/mobile
2. Przetestować na różnych rozdzielczościach
3. Dostosować style zgodnie z istniejącym design system

### Krok 11: Dostępność (a11y)

1. Dodać odpowiednie `aria-*` atrybuty
2. Zaimplementować focus management w modalach
3. Przetestować nawigację klawiaturą
4. Zweryfikować kontrast kolorów

### Krok 12: Testowanie

1. Przetestować wszystkie interakcje użytkownika
2. Przetestować obsługę błędów API
3. Przetestować paginację i filtrowanie
4. Przetestować responsywność
5. Przetestować dostępność (screen reader)
