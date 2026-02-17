# Plan implementacji tłumaczeń (i18n PL/EN) dla 10xCards

## 1. Cel dokumentu
Dokument definiuje optymalną kolejność wdrożenia wymagań z `/.ai/translations-prd.md`, tak aby:
- najpierw zbudować stabilne fundamenty techniczne,
- ograniczyć ryzyko regresji,
- dopiero potem migrować UI modułami,
- na końcu domknąć jakość, rollout i rollback.

Plan jest przygotowany jako baza pod szczegółowe plany wdrożenia dla kolejnych iteracji.

## 2. Stan obecny po analizie kodu
Najważniejsze luki względem PRD:
- Brak infrastruktury i18n (`i18next`, `react-i18next`, lazy-loading namespace, logging brakujących kluczy).
- Brak feature flagi `feature.i18n_mvp`.
- Brak trwałej preferencji języka w profilu użytkownika (nie ma tabeli profilu/preferencji języka).
- UI i komunikaty są głównie hardcodowane (duża liczba tekstów PL w `src/components`, `src/pages`, `src/lib/hooks`, `src/lib/schemas`, `src/pages/api`, `src/lib/services`).
- API zwraca niespójne teksty błędów zamiast stabilnych `error_code`.
- Formatowanie lokalne jest częściowo zahardcodowane na `pl-PL` (np. `toLocaleString`, `toLocaleDateString`).
- Testy i CI nie mają bramek i18n (raport brakujących kluczy, skan hardcodów, próg pokrycia tłumaczeń).

## 3. Zasady kolejności
1. Najpierw kontrakty i fundamenty techniczne, później masowa migracja tekstów.
2. Najpierw spójny kontrakt błędów API (`error_code`), później mapowanie błędów w UI.
3. Najpierw mechanizm wyboru języka i persystencja, później switcher i migracja ekranów.
4. Najpierw elementy współdzielone, potem moduły biznesowe (`generator` -> `flashcards` -> `study`).
5. Każdy krok kończy się mierzalnym kryterium wyjścia, żeby kolejne iteracje były niezależne i bezpieczne.

## 4. Plan implementacji krok po kroku

### Krok 1: Kontrakty i inwentaryzacja migracji
Cel:
- zamrozić reguły implementacyjne przed zmianami w kodzie.

Zakres:
- Ustalić docelowy kontrakt i18n: locale `pl/en`, fallback `en`, kolejność źródeł preferencji, reguły pluralizacji/interpolacji.
- Zdefiniować namespace zgodne z PRD: `common`, `landing`, `auth`, `generator`, `flashcards`, `study`, `errors`, `validation`.
- Przygotować mapę ekranów/komponentów/API do migracji wraz z przypisaniem do namespace.
- Uzgodnić słownik pojęć i styl copy PL/EN (glossary, ton komunikatów).

Kryterium zamknięcia:
- Jest gotowa lista plików i odpowiedzialnych namespace.
- Jest jednoznaczna konwencja kluczy `{moduł}.{widok}.{element}.{typ}`.

Pokrycie PRD:
- FR-010, FR-011, FR-076.

### Krok 2: Włączenie feature flag i trybu bezpiecznego
Cel:
- umożliwić wdrażanie iteracyjne bez ryzyka dla produkcji.

Zakres:
- Dodać centralną obsługę flagi `feature.i18n_mvp`.
- Zapewnić dwa tryby runtime:
- flaga OFF: aktualny tryb PL-only,
- flaga ON: pełny tryb i18n.
- Dodać punkty kontrolne w layoutach i komponentach globalnych (switcher, inicjalizacja i18n).

Kryterium zamknięcia:
- Wyłączenie flagi przywraca działanie aplikacji w trybie PL-only bez zmian danych.

Pokrycie PRD:
- FR-080, FR-082, US-019.

### Krok 3: Warstwa danych preferencji języka (profil użytkownika)
Cel:
- spełnić wymaganie trwałej preferencji dla użytkownika zalogowanego.

Zakres:
- Dodać migrację DB dla preferencji języka profilu (np. tabela `user_preferences` z `user_id`, `locale`, `updated_at`) i RLS.
- Zaktualizować typy bazy (`src/db/database.types.ts`).
- Dodać API do odczytu/zapisu preferencji języka zalogowanego użytkownika.
- Zapewnić walidację locale do zakresu `pl|en`.

Kryterium zamknięcia:
- Preferencja języka jest zapisywana i odczytywana per użytkownik na różnych urządzeniach.

Pokrycie PRD:
- FR-022, FR-023, US-006, US-007.

### Krok 4: Fundament i18n runtime (React + lazy loading + fallback)
Cel:
- uruchomić bazową infrastrukturę tłumaczeń zgodną z PRD.

Zakres:
- Zainstalować i skonfigurować `i18next`, `react-i18next`, `i18next-http-backend`, `i18next-browser-languagedetector`.
- Zbudować singleton i18n i bootstrap klienta.
- Włączyć lazy-loading namespace przez backend HTTP.
- Ustawić `supportedLngs = ["pl", "en"]`, `fallbackLng = "en"`.
- Włączyć obsługę brakujących kluczy bez crasha UI i logowanie braków.

Kryterium zamknięcia:
- Dowolny komponent React może używać `t(...)`.
- Brakujący klucz nie zatrzymuje aplikacji i jest logowany.

Pokrycie PRD:
- FR-001, FR-002, FR-003, FR-004, FR-005, US-017, US-018.

### Krok 5: Szkielety słowników i parytet kluczy PL/EN
Cel:
- przygotować stabilny kontrakt treści przed migracją modułów.

Zakres:
- Utworzyć strukturę plików tłumaczeń per locale i namespace.
- Dodać minimalny zestaw kluczy startowych dla wszystkich modułów in-scope.
- Dodać skrypt parytetu kluczy PL/EN (wykrywanie braków).

Kryterium zamknięcia:
- Każdy namespace istnieje w `pl` i `en`.
- Skrypt wykrywa brakujące klucze przed rozpoczęciem masowej migracji.

Pokrycie PRD:
- FR-011, FR-013, FR-074.

### Krok 6: Resolver języka i synchronizacja źródeł preferencji
Cel:
- wdrożyć docelową logikę wyboru języka w runtime.

Zakres:
- Implementacja reguły pierwszej wizyty: `pl* -> pl`, inne -> `en`.
- Implementacja pełnego priorytetu: profil > local storage/cookie > `navigator.language`.
- Synchronizacja po logowaniu i wylogowaniu.
- Utrwalanie wyboru lokalnie dla gościa.
- Aktualizacja `html[lang]` i stanu i18n przy każdej zmianie języka.

Kryterium zamknięcia:
- Działają scenariusze konfliktu źródeł i przypadki skrajne z US-001/US-002/US-005/US-007.

Pokrycie PRD:
- FR-020, FR-021, FR-023, FR-024, US-001, US-002, US-005, US-007.

### Krok 7: Globalny switcher języka (desktop + mobile + a11y)
Cel:
- zapewnić użytkownikowi stałą kontrolę języka bez przeładowania strony.

Zakres:
- Dodać komponent switchera do `TopNav` i `MobileNav`.
- Zapewnić obsługę klawiatury, focus management i etykiety dla czytników.
- Zapewnić zmianę języka bez full reload i bez utraty danych formularza.

Kryterium zamknięcia:
- Zmiana `pl <-> en` działa w obu nawigacjach i aktualizuje widoczną treść na bieżąco.

Pokrycie PRD:
- FR-030, FR-031, FR-032, FR-033, US-003, US-004.

### Krok 8: Standaryzacja błędów API do `error_code`
Cel:
- odseparować treść UI od backendowych tekstów błędów.

Zakres:
- Zdefiniować listę stabilnych `error_code` dla endpointów auth/generator/flashcards/study.
- Ujednolicić odpowiedzi API do formatu z `error_code`.
- Dodać mapowanie `error_code -> key` po stronie frontendu i fallback `errors.generic`.
- Zachować bezpieczeństwo komunikatów (bez ujawniania szczegółów technicznych).

Kryterium zamknięcia:
- UI nie bazuje na tekstach błędów z API.
- Nieznany kod błędu zawsze mapuje się do generycznego komunikatu w aktywnym języku.

Pokrycie PRD:
- FR-050, FR-051, FR-052, FR-053, US-009, US-015.

### Krok 9: Migracja treści wspólnych i ścieżek wejścia
Cel:
- domknąć bazowe ekrany i komponenty współdzielone.

Zakres:
- Migracja `Layout`, `AuthenticatedLayout`, landing (`/`), auth (`/login`, `/register`), nawigacji i dialogów konta.
- Migracja toastów i komunikatów współdzielonych.
- Eliminacja hardcodów tekstowych w obszarze wspólnym.

Kryterium zamknięcia:
- Ścieżki wejścia i nawigacja działają w obu językach i reagują na switcher.

Pokrycie PRD:
- FR-040, FR-043, US-008, US-010, US-014.

### Krok 10: Migracja modułu Generator
Cel:
- przenieść pełny scope generatora do i18n.

Zakres:
- Komponenty generatora, hook `useGenerator`, komunikaty walidacyjne i błędów, loading/empty/toasty.
- Utrzymanie zasady: treść użytkownika i wygenerowane pary QA nie są automatycznie tłumaczone.

Kryterium zamknięcia:
- `/generator` spełnia scenariusze PL/EN, w tym walidacje i błędy API.

Pokrycie PRD:
- FR-040, FR-041, FR-042, FR-043, FR-044, US-011.

### Krok 11: Migracja modułu Flashcards
Cel:
- przenieść pełny scope listy i CRUD fiszek do i18n.

Zakres:
- Komponenty listy/tabeli/kart/modali/paginacji/sortowania/wyszukiwania.
- Hook `useFlashcards`, błędy, toasty, potwierdzenia akcji destrukcyjnych.

Kryterium zamknięcia:
- `/flashcards` działa w PL/EN bez hardcodów i z poprawnym fallbackiem.

Pokrycie PRD:
- FR-040, FR-041, FR-042, FR-043, US-012.

### Krok 12: Migracja modułu Study i dokończenie flow konta
Cel:
- domknąć ostatni krytyczny moduł i scenariusze sesji użytkownika.

Zakres:
- Komponenty sesji nauki (`start`, `studying`, `summary`, `empty`), skróty klawiaturowe i komunikaty.
- Hook `useStudySession`, błędy, toasty, redirecty po autoryzacji.
- Dopięcie tłumaczeń dialogów i flow usuwania konta.

Kryterium zamknięcia:
- `/study` i akcje konta działają w obu językach w scenariuszach podstawowych i skrajnych.

Pokrycie PRD:
- FR-040, FR-042, FR-043, US-013, US-014.

### Krok 13: Lokalizacja walidacji oraz formatów dat/liczb/walut
Cel:
- domknąć obszary M3 z PRD bez rozproszonej logiki.

Zakres:
- Zastąpić literalne komunikaty walidacyjne kluczami tłumaczeń (`validation.*`) i/lub `error_code`.
- Dodać centralne utilsy formatujące `date/number/currency` na bazie aktywnego locale (`pl-PL`, `en-US`).
- Usunąć zahardcodowane `toLocaleString("pl-PL")` i `toLocaleDateString("pl-PL")` z komponentów.

Kryterium zamknięcia:
- Formaty i walidacje zmieniają się razem z językiem bez pełnego odświeżenia strony.

Pokrycie PRD:
- FR-041, FR-060, FR-061, FR-062, US-016.

### Krok 14: Brama jakości i automatyczne raporty i18n w CI
Cel:
- wymusić jakość release zgodną z DoD.

Zakres:
- Dodać skrypty:
- raport brakujących kluczy i parytetu PL/EN,
- skan hardcodów tekstowych w zakresie MVP,
- metryki pokrycia tłumaczeń.
- Wpiąć skrypty do pipeline (`.github/workflows/pull-request.yml`) jako warunki blokujące.
- Rozszerzyć testy unit/integration/e2e o scenariusze przełączania języka i fallback.

Kryterium zamknięcia:
- Pipeline blokuje release przy niespełnieniu progów PRD (100% krytyczne, 98% MVP, hardcoded=0 in-scope).

Pokrycie PRD:
- FR-070, FR-071, FR-072, FR-073, FR-074, FR-075, US-017, US-018, US-020, M-001..M-009.

### Krok 15: Rollout, rollback i release candidate
Cel:
- bezpiecznie uruchomić funkcję i18n i mieć natychmiastową ścieżkę wycofania.

Zakres:
- Przeprowadzić rollout: dev -> test -> produkcja (zamknięta beta).
- Wykonać checklistę release i review copy PL/EN.
- Zweryfikować rollback przez wyłączenie `feature.i18n_mvp`.

Kryterium zamknięcia:
- Funkcja działa stabilnie w produkcji i ma potwierdzony scenariusz rollbacku.

Pokrycie PRD:
- FR-081, FR-082, FR-083, US-019.

## 5. Mapowanie kroków do milestone z PRD
- M1 (2026-02-18 do 2026-02-24): Kroki 1-5.
- M2 (2026-02-25 do 2026-03-03): Kroki 6-7 oraz 9-12.
- M3 (2026-03-04 do 2026-03-10): Kroki 8 i 13.
- M4 (2026-03-11 do 2026-03-14): Kroki 14-15.

Uwaga:
- Krok 8 można rozpocząć technicznie pod koniec M2, ale jego finalne domknięcie powinno nastąpić w M3 razem z walidacjami i formatami.

## 6. Zależności krytyczne między krokami
- Krok 2 musi być gotowy przed rolloutem czegokolwiek na środowiskach współdzielonych.
- Krok 3 musi być zamknięty przed pełnym wdrożeniem Kroku 6.
- Kroki 4-5 muszą być gotowe przed migracją modułów (Kroki 9-12).
- Krok 8 powinien być ukończony przed finalnym domknięciem błędów w Krokach 10-12.
- Krok 13 musi być ukończony przed Krokami 14-15.

## 7. Efekt końcowy po realizacji planu
Po wykonaniu wszystkich kroków aplikacja spełnia cel PRD:
- pełne i spójne PL/EN dla UI, walidacji i błędów API,
- poprawny wybór języka na pierwszej wizycie i poprawna persystencja preferencji,
- lokalizacja formatów dat/liczb/walut,
- kontrolowany rollout przez flagę i gotowy rollback bez migracji danych,
- obiektywna brama jakości przed release.
