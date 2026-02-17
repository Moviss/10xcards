# Dokument wymagań produktu (PRD) - 10xCards i18n PL/EN
## 1. Przegląd produktu
### 1.1 Cel
Celem projektu jest wdrożenie pełnej obsługi dwóch języków interfejsu aplikacji 10xCards: polskiego (PL) i angielskiego (EN), bez regresji istniejących funkcji produktu.

### 1.2 Zakres biznesowy MVP
MVP internacjonalizacji obejmuje:
1. Cały interfejs użytkownika (UI).
2. Komunikaty walidacyjne formularzy.
3. Komunikaty błędów API.
4. Lokalizację formatów dat, liczb i walut dla PL/EN.

### 1.3 Kontekst techniczny i decyzja o bibliotece
Aplikacja działa w stacku Astro 5 + React 19 + TypeScript 5. Dla zgodności ze stackiem i wymaganiami fallback/lazy-loading wybrano:
1. `i18next` jako silnik i18n.
2. `react-i18next` dla komponentów React.
3. `i18next-http-backend` do lazy-loadingu słowników.
4. `i18next-browser-languagedetector` z własną konfiguracją kolejności źródeł preferencji.

### 1.4 Reguła języka domyślnego
1. Pierwsza wizyta: `język przeglądarki zaczyna się od pl` -> UI po polsku.
2. Pierwsza wizyta: każdy inny język przeglądarki -> UI po angielsku.
3. Po pierwszej wizycie obowiązuje zapisana preferencja użytkownika.

### 1.5 Priorytet źródeł preferencji języka
Kolejność obowiązująca w runtime:
1. Preferencja z profilu użytkownika (dla zalogowanego użytkownika).
2. Ustawienie lokalne w przeglądarce (localStorage/cookie).
3. Język przeglądarki (`navigator.language`) przy braku powyższych.

### 1.6 Harmonogram wdrożenia (milestone)
1. M1 (2026-02-18 do 2026-02-24): infrastruktura i18n, konwencja kluczy, szkielety słowników.
2. M2 (2026-02-25 do 2026-03-03): tłumaczenia UI i switcher języka (desktop/mobile).
3. M3 (2026-03-04 do 2026-03-10): walidacje, błędy API, formaty lokalne, standaryzacja kodów błędów.
4. M4 (2026-03-11 do 2026-03-14): testy, checklista DoD, rollout feature flag i plan rollbacku.
5. Release candidate: 2026-03-16.

## 2. Problem użytkownika
### 2.1 Aktualny problem
Obecnie cała aplikacja jest zahardcodowana po polsku, co powoduje:
1. Brak użyteczności dla użytkowników niepolskojęzycznych.
2. Niespójne doświadczenie przy błędach i walidacjach.
3. Brak skalowalności produktu na kolejne rynki.

### 2.2 Skutki produktowe
1. Użytkownik z przeglądarką EN otrzymuje komunikaty niedopasowane do jego języka.
2. Zmiana języka nie jest możliwa z poziomu UX.
3. Przy utrzymaniu hardcodów rośnie koszt rozwoju i ryzyko regresji.

### 2.3 Oczekiwany efekt
1. Użytkownik otrzymuje poprawny język już na pierwszej wizycie.
2. Użytkownik może zmienić język globalnym przełącznikiem na desktop i mobile.
3. Komunikaty UI, walidacji i błędów API pozostają spójne językowo w całej aplikacji.

## 3. Wymagania funkcjonalne
### 3.1 Fundament i18n
1. FR-001: System musi używać `i18next` + `react-i18next`.
2. FR-002: Obsługiwane locale MVP: `pl`, `en`.
3. FR-003: Domyślny fallback tłumaczeń: `en`.
4. FR-004: Słowniki muszą być ładowane leniwie per moduł.
5. FR-005: Brakujący klucz nie może powodować błędu runtime i musi zostać zalogowany.

### 3.2 Konwencja kluczy i struktura słowników
1. FR-010: Klucze muszą używać konwencji: `{moduł}.{widok}.{element}.{typ}`.
2. FR-011: Słowniki muszą być podzielone co najmniej na moduły: `common`, `landing`, `auth`, `generator`, `flashcards`, `study`, `errors`, `validation`.
3. FR-012: Każdy nowy tekst UI musi być dodany do słownika, bez hardcodu w komponencie.
4. FR-013: Każdy klucz `pl` musi mieć odpowiednik `en` przed releasem.

### 3.3 Wybór i utrwalanie języka
1. FR-020: Przy pierwszej wizycie system stosuje regułę `pl -> PL`, `inne -> EN`.
2. FR-021: Zmiana języka przez użytkownika zapisuje preferencję lokalnie.
3. FR-022: Dla użytkownika zalogowanego preferencja języka musi być zapisywana również w profilu.
4. FR-023: Priorytet źródeł preferencji: profil > lokalnie > przeglądarka.
5. FR-024: Po wylogowaniu sesja gościa korzysta z ustawienia lokalnego.

### 3.4 UX przełącznika języka
1. FR-030: Globalny przełącznik języka musi być dostępny stale w nawigacji desktop.
2. FR-031: Globalny przełącznik języka musi być dostępny stale w nawigacji mobile.
3. FR-032: Przełączenie języka musi odświeżyć treści bez przeładowania całej strony.
4. FR-033: Przełącznik musi spełniać wymagania dostępności klawiaturowej i czytników ekranu.

### 3.5 Zakres tłumaczeń funkcjonalnych
1. FR-040: Tłumaczeniu podlegają wszystkie teksty na stronach: `/`, `/login`, `/register`, `/generator`, `/flashcards`, `/study`.
2. FR-041: Tłumaczeniu podlegają wszystkie komunikaty walidacyjne formularzy.
3. FR-042: Tłumaczeniu podlegają wszystkie komunikaty błędów API w UI.
4. FR-043: Tłumaczeniu podlegają toasty, modale potwierdzeń, stany puste, loading i komunikaty sukcesu.
5. FR-044: Dane użytkownika (treści fiszek, tekst źródłowy, wygenerowane pary QA) nie są automatycznie tłumaczone.

### 3.6 Standaryzacja błędów API
1. FR-050: API musi zwracać stabilny `error_code` dla błędów biznesowych i technicznych obsługiwanych przez UI.
2. FR-051: Frontend mapuje `error_code` na komunikat PL/EN w słowniku `errors`.
3. FR-052: Dla nieznanego `error_code` UI pokazuje generyczny komunikat w aktualnym języku.
4. FR-053: API nie może zwracać komunikatów użytkowych zależnych od języka jako jedynego źródła treści.

### 3.7 Lokalizacja formatów
1. FR-060: Daty muszą być formatowane zgodnie z `pl-PL` lub `en-US`.
2. FR-061: Liczby i separatory dziesiętne muszą być formatowane wg aktywnego locale.
3. FR-062: Waluty prezentowane w UI muszą respektować aktywny locale.

### 3.8 Jakość, testy i Definition of Done
1. FR-070: Definition of Done wymaga braku hardcodowanych komunikatów PL w zakresie MVP.
2. FR-071: Definition of Done wymaga pełnej pary kluczy PL/EN dla ścieżek krytycznych.
3. FR-072: Definition of Done wymaga poprawnego fallbacku EN i braku błędów runtime przy brakującym kluczu.
4. FR-073: Każdy ekran w scope musi mieć test przełączania języka.
5. FR-074: Wymagany jest raport brakujących kluczy na etapie CI i przed release.
6. FR-075: Minimalny próg pokrycia tłumaczeń na release: 100% dla ścieżek krytycznych, 98% dla całego zakresu MVP.
7. FR-076: Proces jakości tłumaczeń musi obejmować glossary/styl i finalny review copy.

### 3.9 Feature flag i rollout
1. FR-080: Funkcjonalność musi być wdrażana za flagą `feature.i18n_mvp`.
2. FR-081: Warunki włączenia globalnego: pozytywne testy automatyczne, przejście checklisty DoD, brak błędów krytycznych P0/P1.
3. FR-082: Rollback polega na wyłączeniu flagi i powrocie do aktualnego trybu PL-only bez migracji danych.
4. FR-083: Plan rolloutu: środowisko developerskie -> testowe -> produkcyjne (zamknięta beta).

## 4. Granice produktu
### 4.1 In scope (MVP)
1. Obsługa języków `pl` i `en`.
2. Globalny switcher języka w nawigacji desktop i mobile.
3. Wykrywanie języka na pierwszej wizycie wg reguły przeglądarki.
4. Zapamiętywanie preferencji lokalnie i w profilu użytkownika.
5. Tłumaczenie UI, walidacji i błędów API dla stron `/`, `/login`, `/register`, `/generator`, `/flashcards`, `/study`.
6. Lokalizacja formatów dat/liczb/walut dla PL/EN.
7. Fallback EN i logowanie brakujących kluczy.
8. Standaryzacja kodów błędów API mapowanych na słownik frontendowy.
9. Testy automatyczne i manualne i18n oraz regresja desktop/mobile.

### 4.2 Out of scope (poza MVP)
1. Trzeci i kolejne języki.
2. Automatyczne tłumaczenie treści generowanych przez użytkownika lub AI.
3. Wersjonowanie i edycja tłumaczeń przez panel CMS.
4. Lokalizacja e-maili systemowych Supabase.
5. Osobne ścieżki URL per język (np. `/en/...`, `/pl/...`).
6. Zmiany SEO wielojęzycznego poza metadanymi podstawowymi.
7. Rozbudowane KPI biznesowe po stronie produktu (projekt pre-release).

### 4.3 Ścieżki krytyczne (wymagane 100% pokrycia)
1. Wejście do aplikacji i automatyczny dobór języka.
2. Ręczna zmiana języka i utrwalenie preferencji.
3. Rejestracja, logowanie, wylogowanie, utrata sesji.
4. Generator: walidacja, generowanie, obsługa błędów API.
5. Flashcards: lista, CRUD, potwierdzenia, komunikaty błędów.
6. Study: start sesji, odpowiedzi, podsumowanie, stany błędów.

### 4.4 Założenia i zależności
1. Jeden fullstack developer realizuje całość end-to-end z wsparciem Codex.
2. Backend może zostać dostosowany do zwracania stabilnych kodów błędów.
3. Aktualny stack testowy (Vitest, Playwright) pozostaje bez zmian.

## 5. Historyjki użytkowników
### US-001
ID: US-001
Tytuł: Automatyczny język PL na pierwszej wizycie
Opis: Jako nowy użytkownik z przeglądarką ustawioną na polski chcę od razu widzieć aplikację po polsku.
Kryteria akceptacji:
1. Scenariusz podstawowy: przy `navigator.language` równym `pl` lub `pl-PL` aplikacja startuje w języku polskim.
2. Scenariusz alternatywny: przy pustej pamięci lokalnej i braku sesji użytkownika reguła działa identycznie.
3. Scenariusz skrajny: przy nietypowej wielkości liter (`PL-pl`) język nadal mapuje się do `pl`.

### US-002
ID: US-002
Tytuł: Automatyczny język EN na pierwszej wizycie
Opis: Jako nowy użytkownik z dowolnym niepolskim językiem przeglądarki chcę widzieć aplikację po angielsku.
Kryteria akceptacji:
1. Scenariusz podstawowy: przy `navigator.language` równym `en-US` aplikacja startuje w języku angielskim.
2. Scenariusz alternatywny: przy `de-DE`, `fr-FR` i innych niepolskich locale aplikacja startuje w `en`.
3. Scenariusz skrajny: przy nieobsługiwanym locale lub braku locale aplikacja wybiera `en` jako fallback.

### US-003
ID: US-003
Tytuł: Zmiana języka w nawigacji desktop
Opis: Jako użytkownik desktop chcę przełączyć język globalnie bez szukania ustawień.
Kryteria akceptacji:
1. Scenariusz podstawowy: przełącznik jest zawsze widoczny w globalnej nawigacji desktop.
2. Scenariusz alternatywny: zmiana z `pl` na `en` i z `en` na `pl` aktualizuje wszystkie widoczne teksty.
3. Scenariusz skrajny: przełączenie języka podczas aktywnego formularza nie czyści danych wpisanych przez użytkownika.

### US-004
ID: US-004
Tytuł: Zmiana języka w nawigacji mobile
Opis: Jako użytkownik mobile chcę mieć taki sam dostęp do zmiany języka jak na desktopie.
Kryteria akceptacji:
1. Scenariusz podstawowy: przełącznik jest dostępny w menu mobile.
2. Scenariusz alternatywny: zmiana języka nie zamyka trwale dostępu do bieżącej funkcji (użytkownik pozostaje na tym samym widoku).
3. Scenariusz skrajny: po zmianie języka i ponownym otwarciu menu mobile przełącznik pokazuje aktualny aktywny język.

### US-005
ID: US-005
Tytuł: Zapamiętanie języka dla użytkownika niezalogowanego
Opis: Jako użytkownik niezalogowany chcę, aby aplikacja pamiętała mój wybór języka między sesjami.
Kryteria akceptacji:
1. Scenariusz podstawowy: po ręcznej zmianie języka preferencja zapisuje się lokalnie.
2. Scenariusz alternatywny: po odświeżeniu strony aplikacja używa zapisanej preferencji lokalnej.
3. Scenariusz skrajny: po zamknięciu i ponownym otwarciu przeglądarki preferencja jest nadal stosowana.

### US-006
ID: US-006
Tytuł: Zapamiętanie języka dla użytkownika zalogowanego
Opis: Jako zalogowany użytkownik chcę mieć swój język zapisany w profilu i odtwarzany na różnych urządzeniach.
Kryteria akceptacji:
1. Scenariusz podstawowy: zmiana języka zapisuje preferencję w profilu użytkownika.
2. Scenariusz alternatywny: po zalogowaniu na drugim urządzeniu aplikacja używa języka z profilu.
3. Scenariusz skrajny: jeśli lokalne ustawienie różni się od profilu, wygrywa preferencja z profilu.

### US-007
ID: US-007
Tytuł: Rozstrzyganie konfliktu preferencji po logowaniu
Opis: Jako użytkownik, który wcześniej korzystał anonimowo, chcę mieć jednoznaczne zasady po zalogowaniu.
Kryteria akceptacji:
1. Scenariusz podstawowy: po logowaniu system porównuje źródła i stosuje priorytet profil > lokalnie > przeglądarka.
2. Scenariusz alternatywny: jeśli profil nie ma ustawienia języka, używane jest ustawienie lokalne.
3. Scenariusz skrajny: jeśli profil i ustawienie lokalne są puste, używany jest język przeglądarki.

### US-008
ID: US-008
Tytuł: Lokalizacja formularzy logowania i rejestracji
Opis: Jako użytkownik chcę rozumieć wszystkie etykiety i walidacje w procesie logowania/rejestracji.
Kryteria akceptacji:
1. Scenariusz podstawowy: wszystkie etykiety, placeholdery i przyciski na `/login` i `/register` są w aktywnym języku.
2. Scenariusz alternatywny: komunikaty walidacyjne (np. niepoprawny e-mail, zbyt krótkie hasło) są w aktywnym języku.
3. Scenariusz skrajny: zmiana języka w trakcie wypełniania formularza nie usuwa wpisanych danych.

### US-009
ID: US-009
Tytuł: Bezpieczna obsługa autoryzacji i wygaśnięcia sesji
Opis: Jako użytkownik chcę otrzymać zrozumiały komunikat o wygaśnięciu sesji bez ujawniania danych technicznych.
Kryteria akceptacji:
1. Scenariusz podstawowy: przy błędzie 401/403 UI pokazuje komunikat w aktywnym języku i kieruje do logowania.
2. Scenariusz alternatywny: użytkownik po ponownym logowaniu wraca do działania bez utraty spójności języka.
3. Scenariusz skrajny: odpowiedź API nie ujawnia szczegółów bezpieczeństwa w komunikacie dla użytkownika końcowego.

### US-010
ID: US-010
Tytuł: Lokalizacja strony głównej i nawigacji globalnej
Opis: Jako odwiedzający chcę widzieć spójny język na landing page i elementach nawigacji.
Kryteria akceptacji:
1. Scenariusz podstawowy: wszystkie teksty na `/` i elementach nawigacji są tłumaczone PL/EN.
2. Scenariusz alternatywny: CTA i stany przejść między widokami zachowują wybrany język.
3. Scenariusz skrajny: teksty w komponentach współdzielonych (np. dialogi) nie wracają do polskiego hardcodu.

### US-011
ID: US-011
Tytuł: Lokalizacja modułu generatora
Opis: Jako użytkownik generatora chcę otrzymywać wszystkie komunikaty w wybranym języku.
Kryteria akceptacji:
1. Scenariusz podstawowy: etykiety, instrukcje, przyciski i stany ładowania na `/generator` są tłumaczone.
2. Scenariusz alternatywny: błędy walidacji limitu znaków są tłumaczone.
3. Scenariusz skrajny: komunikaty o pustej liście propozycji i błędzie zapisu są tłumaczone.

### US-012
ID: US-012
Tytuł: Lokalizacja modułu fiszek (lista i CRUD)
Opis: Jako użytkownik chcę zarządzać fiszkami przy spójnych komunikatach językowych.
Kryteria akceptacji:
1. Scenariusz podstawowy: etykiety listy, wyszukiwarki, paginacji i akcji CRUD na `/flashcards` są tłumaczone.
2. Scenariusz alternatywny: walidacje formularza dodawania/edycji są tłumaczone.
3. Scenariusz skrajny: komunikaty potwierdzenia usunięcia i błędy operacji CRUD są tłumaczone.

### US-013
ID: US-013
Tytuł: Lokalizacja modułu nauki
Opis: Jako użytkownik sesji nauki chcę rozumieć wszystkie stany i akcje podczas powtórek.
Kryteria akceptacji:
1. Scenariusz podstawowy: teksty na `/study` (start, przyciski odpowiedzi, podsumowanie) są tłumaczone.
2. Scenariusz alternatywny: komunikaty o braku kart do nauki są tłumaczone.
3. Scenariusz skrajny: komunikaty błędów API sesji nauki są tłumaczone.

### US-014
ID: US-014
Tytuł: Lokalizacja ustawień konta i akcji destrukcyjnych
Opis: Jako użytkownik chcę rozumieć konsekwencje działań na koncie, szczególnie usuwania.
Kryteria akceptacji:
1. Scenariusz podstawowy: etykiety i opisy opcji konta są tłumaczone.
2. Scenariusz alternatywny: modal potwierdzenia usunięcia konta jest tłumaczony.
3. Scenariusz skrajny: komunikat błędu usunięcia konta jest tłumaczony i nie zawiera technicznych szczegółów backendowych.

### US-015
ID: US-015
Tytuł: Tłumaczenie błędów API na podstawie kodów
Opis: Jako użytkownik chcę widzieć stabilne i przewidywalne komunikaty błędów niezależnie od endpointu.
Kryteria akceptacji:
1. Scenariusz podstawowy: znany `error_code` mapuje się do poprawnego komunikatu w aktywnym języku.
2. Scenariusz alternatywny: ten sam `error_code` ma identyczne znaczenie i tłumaczenie w całej aplikacji.
3. Scenariusz skrajny: nieznany `error_code` pokazuje generyczny komunikat `errors.generic` w aktywnym języku.

### US-016
ID: US-016
Tytuł: Lokalizacja formatów dat, liczb i walut
Opis: Jako użytkownik chcę widzieć formaty liczbowe zgodne z moim językiem interfejsu.
Kryteria akceptacji:
1. Scenariusz podstawowy: w języku `pl` daty, liczby i waluty używają formatu `pl-PL`.
2. Scenariusz alternatywny: w języku `en` daty, liczby i waluty używają formatu `en-US`.
3. Scenariusz skrajny: zmiana języka aktualizuje formaty bez potrzeby pełnego odświeżenia strony.

### US-017
ID: US-017
Tytuł: Fallback i odporność na brak klucza tłumaczenia
Opis: Jako użytkownik chcę, aby aplikacja działała stabilnie nawet przy niekompletnym słowniku.
Kryteria akceptacji:
1. Scenariusz podstawowy: brak klucza w aktywnym języku powoduje fallback do `en`.
2. Scenariusz alternatywny: brak klucza jest logowany do raportu braków.
3. Scenariusz skrajny: brak klucza nie powoduje crasha UI ani przerwania krytycznej ścieżki.

### US-018
ID: US-018
Tytuł: Lazy-loading słowników i wydajność
Opis: Jako użytkownik chcę, aby dodanie i18n nie pogarszało odczuwalnej wydajności aplikacji.
Kryteria akceptacji:
1. Scenariusz podstawowy: ładowane są tylko potrzebne namespace dla bieżącego widoku.
2. Scenariusz alternatywny: przełączenie języka dociąga brakujące zasoby asynchronicznie.
3. Scenariusz skrajny: przy problemie sieciowym UI pokazuje kontrolowany komunikat i nie zawiesza aplikacji.

### US-019
ID: US-019
Tytuł: Rollout i rollback przez feature flag
Opis: Jako zespół produktowy chcę bezpiecznie uruchamiać i wycofywać funkcję i18n bez przestojów.
Kryteria akceptacji:
1. Scenariusz podstawowy: przy wyłączonej fladze działa obecny tryb PL-only.
2. Scenariusz alternatywny: przy włączonej fladze aktywne jest pełne i18n PL/EN.
3. Scenariusz skrajny: rollback przez wyłączenie flagi przywraca stabilny stan bez migracji danych.

### US-020
ID: US-020
Tytuł: Brama jakości release i raport pokrycia tłumaczeń
Opis: Jako osoba wydająca release chcę mieć obiektywny raport gotowości i18n.
Kryteria akceptacji:
1. Scenariusz podstawowy: pipeline generuje raport brakujących kluczy i pokrycia PL/EN.
2. Scenariusz alternatywny: release blokuje się automatycznie, gdy pokrycie ścieżek krytycznych spada poniżej 100%.
3. Scenariusz skrajny: release blokuje się, gdy wykryte są hardcody w zakresie MVP.

## 6. Metryki sukcesu
### 6.1 Metryki jakościowe pre-release
1. M-001 Pokrycie tłumaczeń ścieżek krytycznych: cel 100%, pomiar z raportu kluczy i testów E2E.
2. M-002 Pokrycie tłumaczeń całego zakresu MVP: cel minimum 98%, pomiar z narzędzia raportującego klucze.
3. M-003 Hardcoded strings: cel 0 w zakresie MVP, pomiar przez skan statyczny i code review.
4. M-004 Mapowanie kodów błędów API: cel 100% zdefiniowanych `error_code`, pomiar testami integracyjnymi.
5. M-005 Stabilność fallbacku: cel 0 błędów runtime związanych z tłumaczeniami, pomiar z logów i testów.

### 6.2 Metryki testowe
1. M-006 Test przełączania języka: 100% ekranów in scope posiada pozytywny przypadek testowy.
2. M-007 Regresja desktop/mobile: 0 błędów krytycznych P0/P1 po włączeniu flagi.
3. M-008 Testy automatyczne: pokrycie krytycznych ścieżek i18n przez unit/integration/E2E.
4. M-009 Testy manualne: przejście checklisty UX i copy review dla PL/EN.

### 6.3 Kryteria wejścia na release
1. Spełnione FR-070 do FR-076.
2. Spełnione metryki M-001 do M-009.
3. Zatwierdzony wynik review copy i raportu braków kluczy.
4. Gotowy i przetestowany plan rollbacku feature flagi.

### 6.4 Weryfikacja checklisty PRD
1. Czy każdą historię użytkownika można przetestować: Tak, każda US ma mierzalne kryteria akceptacji w scenariuszach podstawowy/alternatywny/skrajny.
2. Czy kryteria akceptacji są jasne i konkretne: Tak, kryteria definiują warunki wejścia, wynik i zachowanie systemu.
3. Czy mamy wystarczająco dużo historyjek do pełnej funkcjonalności: Tak, historyjki pokrywają detekcję języka, UX, persystencję, autoryzację, moduły biznesowe, fallback, rollout i release gate.
4. Czy uwzględniono uwierzytelnianie i autoryzację: Tak, wymagania i historyjki US-008, US-009 oraz US-006/US-007 obejmują obszar bezpieczeństwa dostępu i preferencji.
