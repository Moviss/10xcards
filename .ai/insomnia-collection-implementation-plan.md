# Plan implementacji kolekcji Insomnia dla API 10xcards

## 1. Przegląd

Utworzenie ręcznie pliku kolekcji Insomnia (`insomnia.json`) zawierającego definicje wszystkich endpointów API. Plik będzie można zaimportować do Insomnia, co umożliwi szybkie testowanie API bez konieczności ręcznego konfigurowania każdego żądania.

## 2. Lokalizacja pliku

```
/docs/insomnia.json
```

## 3. Struktura kolekcji

### 3.1. Foldery (grupowanie endpointów)

| Folder | Endpointy |
|--------|-----------|
| Auth | register, login, logout, delete account |
| Flashcards | CRUD operacje na fiszkach |
| Flashcards Batch | batch create, reset progress |
| Study | session, review |
| Generations | generate, list |

### 3.2. Środowiska (Environments)

| Środowisko | Base URL | Opis |
|------------|----------|------|
| Local | `http://localhost:3000` | Lokalne środowisko deweloperskie |
| Production | `https://10xcards.example.com` | Produkcja (do uzupełnienia) |

### 3.3. Zmienne środowiskowe

| Zmienna | Opis | Przykład |
|---------|------|----------|
| `base_url` | URL bazowy API | `http://localhost:3000` |
| `access_token` | Token JWT użytkownika | `eyJhbGciOiJIUzI1NiIs...` |
| `test_email` | Email testowego użytkownika | `test@example.com` |
| `test_password` | Hasło testowego użytkownika | `TestPassword123!` |

## 4. Lista endpointów do zdefiniowania

### 4.1. Auth (4 endpointy)

| Metoda | Endpoint | Nazwa w kolekcji |
|--------|----------|------------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| DELETE | `/api/auth/account` | Delete Account |

### 4.2. Flashcards (5 endpointów)

| Metoda | Endpoint | Nazwa w kolekcji |
|--------|----------|------------------|
| GET | `/api/flashcards` | List Flashcards |
| GET | `/api/flashcards/:id` | Get Flashcard |
| POST | `/api/flashcards` | Create Flashcard |
| PUT | `/api/flashcards/:id` | Update Flashcard |
| DELETE | `/api/flashcards/:id` | Delete Flashcard |

### 4.3. Flashcards Batch (2 endpointy)

| Metoda | Endpoint | Nazwa w kolekcji |
|--------|----------|------------------|
| POST | `/api/flashcards/batch` | Batch Create Flashcards |
| POST | `/api/flashcards/:id/reset-progress` | Reset Progress |

### 4.4. Study (2 endpointy)

| Metoda | Endpoint | Nazwa w kolekcji |
|--------|----------|------------------|
| GET | `/api/study/session` | Get Study Session |
| POST | `/api/study/review` | Submit Review |

### 4.5. Generations (2 endpointy)

| Metoda | Endpoint | Nazwa w kolekcji |
|--------|----------|------------------|
| POST | `/api/generations` | Generate Flashcards |
| GET | `/api/generations` | List Generation Logs |

**Razem: 15 endpointów**

## 5. Etapy wdrożenia

### Krok 1: Utworzenie struktury bazowej kolekcji

Utworzyć plik `docs/insomnia.json` z podstawową strukturą:
- Metadane kolekcji (`_type: "export"`, `__export_format: 4`)
- Workspace główny
- Foldery dla grup endpointów
- Środowiska (Local, Production)

### Krok 2: Definicja endpointów Auth

Dodać 4 endpointy autoryzacji:
- Register z body: `{ "email": "{{test_email}}", "password": "{{test_password}}" }`
- Login z body jak wyżej
- Logout z headerem Authorization
- Delete Account z headerem Authorization

### Krok 3: Definicja endpointów Flashcards

Dodać 5 endpointów CRUD:
- List z parametrami query (page, limit, search, sort, order)
- Get z parametrem path `:id`
- Create z body: `{ "front": "", "back": "" }`
- Update z body: `{ "front": "", "back": "" }`
- Delete z parametrem path `:id`

### Krok 4: Definicja endpointów Flashcards Batch

Dodać 2 endpointy:
- Batch Create z pełnym body zgodnym ze specyfikacją
- Reset Progress z parametrem path `:id`

### Krok 5: Definicja endpointów Study

Dodać 2 endpointy:
- Get Study Session (GET bez body)
- Submit Review z body: `{ "flashcard_id": "", "remembered": true }`

### Krok 6: Definicja endpointów Generations

Dodać 2 endpointy:
- Generate Flashcards z body: `{ "source_text": "" }`
- List Generation Logs z parametrami query (page, limit)

### Krok 7: Walidacja i dokumentacja

- Zaimportować kolekcję do Insomnia i przetestować każdy endpoint
- Dodać opisy do każdego endpointu
- Zaktualizować README o instrukcję importu

## 6. Format pliku Insomnia

Przykładowa struktura pojedynczego żądania:

```json
{
  "_id": "req_generations_list",
  "_type": "request",
  "parentId": "fld_generations",
  "name": "List Generation Logs",
  "method": "GET",
  "url": "{{ _.base_url }}/api/generations",
  "parameters": [
    { "name": "page", "value": "1", "disabled": false },
    { "name": "limit", "value": "20", "disabled": false }
  ],
  "headers": [
    { "name": "Authorization", "value": "Bearer {{ _.access_token }}" },
    { "name": "Content-Type", "value": "application/json" }
  ],
  "body": {},
  "authentication": {}
}
```

## 7. Automatyzacja (opcjonalnie, poza MVP)

W przyszłości można rozważyć:
- Generowanie kolekcji z pliku OpenAPI (`openapi.yaml`)
- Użycie `zod-to-openapi` do generowania OpenAPI ze schematów Zod
- Skrypt CI/CD aktualizujący kolekcję przy zmianach w API

