# Schemat bazy danych PostgreSQL - 10xCards

## 1. Tabele

### 1.1. Tabela `flashcards`

Główna tabela przechowująca fiszki edukacyjne użytkowników wraz z parametrami algorytmu SM-2.

| Kolumna | Typ danych | Ograniczenia | Opis |
|---------|------------|--------------|------|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unikalny identyfikator fiszki |
| `user_id` | `UUID` | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | Identyfikator właściciela fiszki |
| `front` | `TEXT` | `NOT NULL CHECK (char_length(trim(front)) > 0)` | Treść przedniej strony fiszki (pytanie) |
| `back` | `TEXT` | `NOT NULL CHECK (char_length(trim(back)) > 0)` | Treść tylnej strony fiszki (odpowiedź) |
| `original_front` | `TEXT` | `NULL` | Oryginalna treść pytania wygenerowana przez AI (przed edycją) |
| `original_back` | `TEXT` | `NULL` | Oryginalna treść odpowiedzi wygenerowana przez AI (przed edycją) |
| `is_ai_generated` | `BOOLEAN` | `NOT NULL DEFAULT false` | Flaga określająca czy fiszka została wygenerowana przez AI |
| `generation_log_id` | `UUID` | `NULL REFERENCES generation_logs(id) ON DELETE SET NULL` | Referencja do sesji generowania AI |
| `interval` | `INTEGER` | `NOT NULL DEFAULT 0` | Interwał powtórki w dniach (SM-2) |
| `ease_factor` | `DECIMAL(3,2)` | `NOT NULL DEFAULT 2.5` | Współczynnik łatwości (SM-2) |
| `repetitions` | `INTEGER` | `NOT NULL DEFAULT 0` | Liczba udanych powtórek (SM-2) |
| `next_review_date` | `DATE` | `NOT NULL DEFAULT CURRENT_DATE` | Data następnej zaplanowanej powtórki |
| `last_reviewed_at` | `TIMESTAMPTZ` | `NULL` | Timestamp ostatniej powtórki |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Timestamp utworzenia rekordu |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Timestamp ostatniej modyfikacji |

### 1.2. Tabela `generation_logs`

Tabela przechowująca logi sesji generowania fiszek przez AI dla celów analitycznych.

| Kolumna | Typ danych | Ograniczenia | Opis |
|---------|------------|--------------|------|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unikalny identyfikator logu |
| `user_id` | `UUID` | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | Identyfikator użytkownika |
| `source_text_length` | `INTEGER` | `NOT NULL` | Długość tekstu źródłowego w znakach |
| `generated_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Liczba wygenerowanych propozycji fiszek |
| `accepted_unedited_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Liczba fiszek zaakceptowanych bez edycji |
| `accepted_edited_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Liczba fiszek zaakceptowanych po edycji |
| `rejected_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Liczba odrzuconych propozycji |
| `model_used` | `VARCHAR(100)` | `NOT NULL` | Nazwa użytego modelu AI |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Timestamp utworzenia logu |

## 2. Relacje między tabelami

### 2.1. Diagram relacji

```
auth.users (Supabase Auth)
    │
    ├──< flashcards (1:N)
    │       user_id → auth.users.id (CASCADE DELETE)
    │       generation_log_id → generation_logs.id (SET NULL)
    │
    └──< generation_logs (1:N)
            user_id → auth.users.id (CASCADE DELETE)
```

### 2.2. Opis relacji

| Relacja | Kardynalność | Opis |
|---------|--------------|------|
| `auth.users` → `flashcards` | 1:N | Użytkownik może posiadać wiele fiszek. Usunięcie użytkownika kaskadowo usuwa wszystkie jego fiszki. |
| `auth.users` → `generation_logs` | 1:N | Użytkownik może mieć wiele logów generowania. Usunięcie użytkownika kaskadowo usuwa wszystkie jego logi. |
| `generation_logs` → `flashcards` | 1:N | Sesja generowania może być źródłem wielu fiszek. Usunięcie logu ustawia `generation_log_id` na NULL (SET NULL). |

## 3. Indeksy

### 3.1. Indeksy dla tabeli `flashcards`

| Nazwa indeksu | Typ | Kolumny | Cel |
|---------------|-----|---------|-----|
| `idx_flashcards_user_id` | B-tree | `user_id` | Podstawowy indeks dla RLS i filtrowania po użytkowniku |
| `idx_flashcards_user_next_review` | B-tree | `(user_id, next_review_date)` | Optymalizacja zapytań sesji nauki (wybór fiszek do powtórki) |
| `idx_flashcards_front_trgm` | GIN (pg_trgm) | `front gin_trgm_ops` | Wyszukiwanie pełnotekstowe w treści pytań |
| `idx_flashcards_back_trgm` | GIN (pg_trgm) | `back gin_trgm_ops` | Wyszukiwanie pełnotekstowe w treści odpowiedzi |

### 3.2. Indeksy dla tabeli `generation_logs`

| Nazwa indeksu | Typ | Kolumny | Cel |
|---------------|-----|---------|-----|
| `idx_generation_logs_user_id` | B-tree | `user_id` | Filtrowanie logów po użytkowniku |
| `idx_generation_logs_created_at` | B-tree | `created_at` | Sortowanie i filtrowanie po dacie utworzenia |

## 4. Polityki Row Level Security (RLS)

### 4.1. Włączenie RLS

```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;
```

### 4.2. Polityki dla tabeli `flashcards`

| Nazwa polityki | Operacja | Definicja | Opis |
|----------------|----------|-----------|------|
| `flashcards_select_policy` | SELECT | `auth.uid() = user_id` | Użytkownik widzi tylko swoje fiszki |
| `flashcards_insert_policy` | INSERT | `auth.uid() = user_id` | Użytkownik może dodawać fiszki tylko dla siebie |
| `flashcards_update_policy` | UPDATE | `auth.uid() = user_id` | Użytkownik może edytować tylko swoje fiszki |
| `flashcards_delete_policy` | DELETE | `auth.uid() = user_id` | Użytkownik może usuwać tylko swoje fiszki |

### 4.3. Polityki dla tabeli `generation_logs`

| Nazwa polityki | Operacja | Definicja | Opis |
|----------------|----------|-----------|------|
| `generation_logs_select_policy` | SELECT | `auth.uid() = user_id` | Użytkownik widzi tylko swoje logi |
| `generation_logs_insert_policy` | INSERT | `auth.uid() = user_id` | Użytkownik może tworzyć logi tylko dla siebie |

## 5. Funkcje i triggery

### 5.1. Funkcja aktualizacji `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 5.2. Trigger dla tabeli `flashcards`

```sql
CREATE TRIGGER trigger_flashcards_updated_at
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 6. Wymagane rozszerzenia PostgreSQL

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Rozszerzenie `pg_trgm` jest wymagane dla indeksów GIN umożliwiających efektywne wyszukiwanie pełnotekstowe w treści fiszek.

## 7. Pełny skrypt SQL

```sql
-- Włączenie wymaganych rozszerzeń
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Tabela generation_logs (tworzona jako pierwsza ze względu na FK)
CREATE TABLE generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_text_length INTEGER NOT NULL,
    generated_count INTEGER NOT NULL DEFAULT 0,
    accepted_unedited_count INTEGER NOT NULL DEFAULT 0,
    accepted_edited_count INTEGER NOT NULL DEFAULT 0,
    rejected_count INTEGER NOT NULL DEFAULT 0,
    model_used VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela flashcards
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    front TEXT NOT NULL CHECK (char_length(trim(front)) > 0),
    back TEXT NOT NULL CHECK (char_length(trim(back)) > 0),
    original_front TEXT NULL,
    original_back TEXT NULL,
    is_ai_generated BOOLEAN NOT NULL DEFAULT false,
    generation_log_id UUID NULL REFERENCES generation_logs(id) ON DELETE SET NULL,
    interval INTEGER NOT NULL DEFAULT 0,
    ease_factor DECIMAL(3,2) NOT NULL DEFAULT 2.5,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indeksy dla flashcards
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_user_next_review ON flashcards(user_id, next_review_date);
CREATE INDEX idx_flashcards_front_trgm ON flashcards USING GIN (front gin_trgm_ops);
CREATE INDEX idx_flashcards_back_trgm ON flashcards USING GIN (back gin_trgm_ops);

-- Indeksy dla generation_logs
CREATE INDEX idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX idx_generation_logs_created_at ON generation_logs(created_at);

-- Funkcja aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla flashcards
CREATE TRIGGER trigger_flashcards_updated_at
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Włączenie RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- Polityki RLS dla flashcards
CREATE POLICY flashcards_select_policy ON flashcards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY flashcards_insert_policy ON flashcards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY flashcards_update_policy ON flashcards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY flashcards_delete_policy ON flashcards
    FOR DELETE USING (auth.uid() = user_id);

-- Polityki RLS dla generation_logs
CREATE POLICY generation_logs_select_policy ON generation_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY generation_logs_insert_policy ON generation_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 8. Uwagi dotyczące decyzji projektowych

### 8.1. Parametry SM-2 w tabeli `flashcards`

Parametry algorytmu SM-2 (`interval`, `ease_factor`, `repetitions`, `next_review_date`) zostały umieszczone bezpośrednio w tabeli `flashcards` zamiast w osobnej tabeli `learning_progress`. Decyzja ta wynika z:
- Prostszej architektury dla MVP
- Braku funkcjonalności współdzielenia talii między użytkownikami
- Uproszczenia zapytań do sesji nauki (brak konieczności JOIN)

### 8.2. Śledzenie edycji treści AI

Kolumny `original_front` i `original_back` umożliwiają:
- Porównanie oryginalnej treści wygenerowanej przez AI z wersją po edycji użytkownika
- Precyzyjne obliczanie metryki AI Acceptance Rate
- Wartość NULL oznacza brak edycji lub fiszkę utworzoną ręcznie

### 8.3. Identyfikacja nowych fiszek

Kolumna `last_reviewed_at` pozwala odróżnić:
- Fiszki nigdy niepowtarzane (`NULL`) - nowe fiszki ograniczone do 20 na sesję
- Fiszki już powtarzane (z timestampem) - dodawane do sesji ponad limit

### 8.4. Cascade Delete vs Soft Delete

Zastosowano twarde usuwanie (CASCADE DELETE) zgodnie z wymaganiami PRD:
- Usunięcie konta użytkownika automatycznie usuwa wszystkie jego dane
- Upraszcza logikę aplikacji i zapytania
- Brak konieczności filtrowania usuniętych rekordów

### 8.5. Brak tabeli sesji nauki

Zgodnie z decyzją z sesji planowania, nie tworzymy osobnej tabeli do śledzenia historii sesji nauki. Wszystkie wymagane metryki można obliczyć na podstawie istniejących danych w tabelach `flashcards` i `generation_logs`.

### 8.6. Typ danych dla `ease_factor`

Użyto `DECIMAL(3,2)` co pozwala na przechowywanie wartości od 0.00 do 9.99. Standardowy zakres dla SM-2 to 1.3-2.5, więc typ jest wystarczający z marginesem bezpieczeństwa.

### 8.7. Wyszukiwanie pełnotekstowe

Zamiast pełnego FTS PostgreSQL (tsvector/tsquery) zastosowano indeksy GIN z rozszerzeniem pg_trgm, co:
- Umożliwia wyszukiwanie fragmentów tekstu (LIKE '%query%')
- Jest prostsze w implementacji dla MVP
- Wystarcza dla oczekiwanej skali aplikacji
