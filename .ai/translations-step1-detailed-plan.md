## A. Streszczenie decyzyjne
- Cel Kroku 1: zamrozić kontrakty i18n i kompletną mapę migracji bez zmian runtime.
- Zakres Kroku 1: decyzje architektoniczne, namespace, inwentaryzacja plików, konwencja kluczy, glossary i reguły copy.
- FR-010 pokryte jawnie: sekcja E zamraża format klucza `{moduł}.{widok}.{element}.{typ}` i przykłady z repo.
- FR-011 pokryte jawnie: sekcja C definiuje 8 namespace, sekcja D mapuje pliki do namespace.
- FR-076 pokryte jawnie: sekcja F wprowadza glossary PL/EN, styl copy i proces review; sekcja H ma mierzalne kryteria zamknięcia jakości copy.
- Założenie wykonawcze: 1 developer realizuje migrację sekwencyjnie P1 -> P2 -> P3, bez równoległych strumieni.

## B. Kontrakt i18n (tabela decyzji + uzasadnienie)
| obszar | decyzja docelowa | uzasadnienie osadzone w repo | pokrycie FR |
|---|---|---|---|
| Obsługiwane locale | `pl`, `en` | Aktualnie UI i błędy są mieszane PL/EN (np. `src/pages/login.astro`, `src/pages/api/auth/login.ts`), więc kontrakt musi zamknąć tylko 2 języki MVP. | FR-002 |
| Fallback | globalny fallback `en` | W kodzie są twarde komunikaty po polsku i po angielsku; fallback `en` daje deterministyczne zachowanie przy brakach kluczy i jest spójny z PRD. | FR-003 |
| Wybór języka | priorytet źródeł: profil > lokalnie (`localStorage`/cookie) > `navigator.language` | Obecnie brak persystencji języka; kontrakt musi jednoznacznie rozstrzygać konflikty przed implementacją switchera i profilu. | FR-023 |
| Reguła pierwszej wizyty | `navigator.language` zaczyna się od `pl` -> `pl`, w pozostałych przypadkach `en` | Aktualny kod ma `lang="pl"` hardcoded w `src/layouts/Layout.astro`, więc konieczna jest precyzyjna reguła startowa. | FR-020 |
| Pluralizacja | i18next plural rules: `en`: `one/other`, `pl`: `one/few/many/other`; wymuszony parametr `count` | W repo są ręczne warunki pluralizacji (np. `src/components/study/StudyStartScreen.tsx`, `src/components/flashcards/Pagination.tsx`), które trzeba zastąpić standardem CLDR. | FR-010, FR-040 |
| Interpolacja | standard i18next `{{param}}`; domyślnie escaped; dla rich text wyłącznie `Trans` | Występują teksty dynamiczne z liczbami i wstrzyknięciami (`countBefore`, `pendingCount`, daty), więc kontrakt musi zakazać konkatenacji stringów. | FR-010, FR-012 |
| Brakujące klucze | kolejność: aktywny locale -> fallback `en` -> `errors.common.translation_missing`; brak crasha; logowanie braków | Wymagane przez PRD i potrzebne przez aktualny stan (liczne hardcody); brakujący klucz nie może blokować UI. | FR-005, FR-072 |
| Kontrakt błędów API (na potrzeby migracji) | API docelowo zwraca `error_code` + opcjonalne `details`; UI mapuje `error_code` do `errors.*` | Aktualnie API zwraca free-text i miesza języki (np. `Flashcard not found`, `Błąd serwera`), co utrudnia i18n i testy. | FR-050, FR-051, FR-053 |
| Formatowanie dat/liczb | zawsze przez aktywny locale (`pl-PL` lub `en-US`), bez hardcodu `pl-PL` | W repo są twarde `toLocaleString("pl-PL")` i `toLocaleDateString("pl-PL")`. | FR-060, FR-061 |

Uzasadnienie wykonawcze: ten kontrakt jest minimalny, jednoznaczny i wystarczający, żeby od Kroku 2 migrować pliki bez cofania decyzji.

## C. Projekt namespace (tabela + reguły graniczne)
| namespace | odpowiedzialność | przykładowe pliki z repo | granica (co nie trafia) |
|---|---|---|---|
| `common` | Layout, nawigacja globalna, wspólne CTA i a11y teksty nawigacyjne | `src/layouts/Layout.astro`, `src/components/navigation/NavLinks.tsx` | Teksty modułowe (`generator`, `flashcards`, `study`) i walidacje formularzy |
| `landing` | Treści marketingowe i CTA strony `/` | `src/components/landing/HeroSection.astro`, `src/components/landing/FeaturesSection.astro` | Teksty po zalogowaniu i komunikaty błędów technicznych |
| `auth` | Ekrany `/login`, `/register`, formularze auth i copy konta | `src/pages/login.astro`, `src/components/auth/LoginForm.tsx` | Błędy API transportowane przez `errors.*`, walidacje Zod w `validation.*` |
| `generator` | UI generatora fiszek: formularz, staging area, modal edycji, loading, success toasty | `src/pages/generator.astro`, `src/components/generator/*.tsx` | Kody błędów i ich mapowanie (`errors.*`) oraz walidacje schematów (`validation.*`) |
| `flashcards` | UI listy i CRUD fiszek: tabela/karty, modale, paginacja, sortowanie, toasty sukcesu | `src/pages/flashcards.astro`, `src/components/flashcards/*.tsx` | Błędy API i walidacje niskopoziomowe |
| `study` | UI sesji nauki: start, karta, ocena, podsumowanie, stany puste | `src/pages/study.astro`, `src/components/study/*.tsx` | Błędy API i walidacje request body |
| `errors` | Wszystkie komunikaty błędów użytkowych (API, sieć, sesja, fallback generic) i mapy `error_code -> key` | `src/pages/api/**/*.ts`, `src/lib/hooks/useAuthForm.ts`, `src/lib/services/*.ts` | Teksty sukcesu, labelki formularzy, walidacje field-level |
| `validation` | Komunikaty walidacyjne Zod dla formularzy i query/body | `src/lib/schemas/*.ts` | Błędy runtime/API i copy ekranowe |

Reguły graniczne:
1. Tekst z `throw new Error(...)` lub `Response({ error: ... })` trafia do `errors`, nawet jeśli fizycznie jest w module.
2. Tekst z Zod (`min`, `max`, `required_error`, `refine`) trafia do `validation`.
3. Teksty przycisków sukcesu i opisy ekranów zostają w namespace modułu (`auth`, `generator`, `flashcards`, `study`, `landing`, `common`).
4. `common` nie zawiera copy biznesowego modułów.
5. `errors` nie przechowuje labeli pól i placeholderów.
6. Każdy klucz należy do jednego namespace; zakaz duplikowania treści między namespace.
7. Klucz współdzielony między modułami trafia do `common` tylko gdy ma identyczne znaczenie i kontekst.
8. Każdy nowy endpoint API dostaje mapowanie do `errors` przed użyciem w UI.

## D. Inwentaryzacja migracji (tabela)
| ścieżka_pliku | typ_artefaktu | obszar_funkcjonalny | obecny_stan_tekstów | docelowy_namespace | prefix_kluczy | priorytet(P1/P2/P3) | ryzyko | uwagi |
|---|---|---|---|---|---|---|---|---|
| /Users/marcinlubowicz/10xdevs2/10xcards/src/layouts/Layout.astro | layout Astro | globalny HTML | `lang="pl"` hardcoded, tytuły mieszane | common | common.layout | P1 | błędny język SSR | KRYTYCZNE: wszystkie ścieżki |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/layouts/AuthenticatedLayout.astro | layout Astro | shell po logowaniu | hardcoded skip-link „Przejdź do treści głównej” | common | common.a11y | P1 | regresja dostępności | KRYTYCZNE: /generator,/flashcards,/study |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/NavLinks.tsx | komponent React | nawigacja globalna | etykiety modułów po polsku | common | common.nav | P1 | niespójny język nawigacji | KRYTYCZNE: /generator,/flashcards,/study |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/MobileNavHeader.tsx | komponent React | nawigacja mobile | aria-label „Otwórz/Zamknij menu” hardcoded | common | common.mobile_nav | P2 | regress a11y mobile | dotyczy mobile all-app |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/MobileNav.tsx | komponent React | nawigacja mobile + konto | „Wyloguj”, „Usuń konto”, loading po polsku | common | common.account_mobile | P2 | rozjazd desktop/mobile copy | zależne od `useNavigation` |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/AccountDropdown.tsx | komponent React | menu konta | „Konto”, „Wyloguj”, „Usuń konto” | common | common.account_menu | P2 | duplikacja kluczy z mobile | wspólne copy konta |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/DeleteAccountDialog.tsx | komponent React | usuwanie konta | pełny dialog destrukcyjny po polsku | common | common.account_delete | P1 | krytyczny flow bezpieczeństwa | wymaga spójności z `errors.auth.*` |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/index.astro | strona Astro | landing `/` | title po polsku | landing | landing.page | P1 | niepełne pokrycie wejścia | KRYTYCZNE: / |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/landing/HeroSection.astro | komponent Astro | landing hero | nagłówki i opis marketingowy po polsku | landing | landing.hero | P1 | duży blok copy do review | KRYTYCZNE: / |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/landing/FeaturesSection.astro | komponent Astro | landing features | tablica cech po polsku | landing | landing.features | P1 | brak spójności terminologii | KRYTYCZNE: / |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/landing/CTAButtons.tsx | komponent React | landing CTA | „Zaloguj się/Zarejestruj się” hardcoded | landing | landing.cta | P1 | CTA w złym języku | KRYTYCZNE: / |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/login.astro | strona Astro | auth `/login` | title, heading, opis po polsku | auth | auth.login_page | P1 | brak lokalizacji ścieżki krytycznej | KRYTYCZNE: /login |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/register.astro | strona Astro | auth `/register` | title, heading, opis po polsku | auth | auth.register_page | P1 | brak lokalizacji ścieżki krytycznej | KRYTYCZNE: /register |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/auth/LoginForm.tsx | komponent React | formularz logowania | label/placeholder/button/link po polsku | auth | auth.login | P1 | regresja walidacji i a11y | KRYTYCZNE: /login |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/auth/RegisterForm.tsx | komponent React | formularz rejestracji | label/placeholder/button/link po polsku | auth | auth.register | P1 | regresja walidacji i testów e2e | KRYTYCZNE: /register |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/auth/PasswordRequirements.tsx | komponent React | pomoc hasła | hardcoded „Minimum 8 znaków”, SR hints | auth | auth.password_rules | P2 | niespójność z validation schema | skorelować z `validation.auth.*` |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/generator.astro | strona Astro | generator `/generator` | title + intro po polsku | generator | generator.page | P1 | brak lokalizacji ścieżki krytycznej | KRYTYCZNE: /generator |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/generator/SourceTextForm.tsx | komponent React | formularz generatora | label/placeholder/button po polsku | generator | generator.form | P1 | niepełna migracja wejścia generatora | KRYTYCZNE: /generator |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/generator/CharCountTextarea.tsx | komponent React | licznik znaków | teksty i `toLocaleString("pl-PL")` | generator | generator.char_count | P1 | błędne formaty liczb po EN | KRYTYCZNE: /generator |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/generator/GenerationLoader.tsx | komponent React | loading generatora | komunikaty loading po polsku | generator | generator.loading | P2 | niespójny UX podczas dłuższych requestów | powiązane z timeout w API |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/generator/StagingArea.tsx | komponent React | staging AI | nagłówek, summary i CTA po polsku | generator | generator.staging | P1 | błędna pluralizacja count | KRYTYCZNE: /generator |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/generator/BulkActions.tsx | komponent React | akcje masowe | labelki i aria-label po polsku | generator | generator.bulk_actions | P2 | regress a11y | używa dynamicznego `pendingCount` |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/generator/ProposalCard.tsx | komponent React | karta propozycji | statusy i akcje po polsku | generator | generator.proposal_card | P2 | duplikacja statusów | wspólny słownik statusów |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/generator/ProposalEditModal.tsx | komponent React | modal edycji propozycji | teksty formularza + walidacje inline PL | generator | generator.edit_modal | P2 | rozjazd z `validation.generator.*` | spójność z schema `generation` |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/generator/GeneratorContainer.tsx | komponent React | orkiestracja generatora | toasty success/error i retry label PL | generator | generator.toast | P1 | utrata kontekstu błędów API | KRYTYCZNE: /generator |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/hooks/useGenerator.ts | hook | logika generatora + błędy | mapowanie statusów HTTP na komunikaty PL | generator | generator.hook | P1 | brak separacji `errors` vs moduł | KRYTYCZNE: /generator; mapować do `errors.generator.*` |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/flashcards.astro | strona Astro | flashcards `/flashcards` | title po polsku | flashcards | flashcards.page | P1 | brak lokalizacji ścieżki krytycznej | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/FlashcardsHeader.tsx | komponent React | nagłówek listy | title/opis/button po polsku | flashcards | flashcards.header | P1 | wejściowe CTA w złym języku | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/SearchInput.tsx | komponent React | wyszukiwarka | placeholder i aria-label po polsku | flashcards | flashcards.search | P1 | regress a11y i e2e selector semantics | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/SortSelect.tsx | komponent React | sortowanie | etykiety opcji sortowania po polsku | flashcards | flashcards.sort | P1 | brak parytetu terminów w EN | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/Pagination.tsx | komponent React | paginacja | ręczna pluralizacja PL + aria PL | flashcards | flashcards.pagination | P1 | błędne reguły plural EN/PL | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/EmptyState.tsx | komponent React | empty/search-empty | kompletne copy po polsku | flashcards | flashcards.empty | P1 | niespójny tone of voice | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/FlashcardsTable.tsx | komponent React | tabela desktop | nagłówki „Przód/Tył/Źródło” | flashcards | flashcards.table | P2 | brak parytetu desktop/mobile | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/FlashcardAddModal.tsx | komponent React | dodawanie fiszki | formularz + błędy inline PL | flashcards | flashcards.add_modal | P1 | walidacja rozjeżdża się z schema | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/FlashcardEditModal.tsx | komponent React | edycja/reset/delete | dużo copy + `toLocaleDateString("pl-PL")` | flashcards | flashcards.edit_modal | P1 | daty i komunikaty destrukcyjne | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/FlashcardsContainer.tsx | komponent React | orkiestracja listy | toasty sukcesu po polsku | flashcards | flashcards.toast | P1 | utrata feedbacku po akcjach CRUD | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/hooks/useFlashcards.ts | hook | logika listy/CRUD | hardcoded błędy PL i sentinel `UNAUTHORIZED` | flashcards | flashcards.hook | P1 | niespójne mapowanie błędów | KRYTYCZNE: /flashcards; mapować do `errors.flashcards.*` |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/study.astro | strona Astro | study `/study` | title po polsku | study | study.page | P1 | brak lokalizacji ścieżki krytycznej | KRYTYCZNE: /study |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/study/StudyContainer.tsx | komponent React | orkiestracja sesji | hinty skrótów + heading SR + toast error | study | study.container | P1 | regresja flow klawiaturowego | KRYTYCZNE: /study |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/study/StudyStartScreen.tsx | komponent React | start sesji | ręczna pluralizacja i limity PL | study | study.start | P1 | błędny count/gramatyka | KRYTYCZNE: /study |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/study/StudyFlashcard.tsx | komponent React | karta nauki | „Pytanie/Odpowiedź”, aria i SR copy PL | study | study.flashcard | P1 | regresja a11y i skrótów | KRYTYCZNE: /study |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/study/AnswerButtons.tsx | komponent React | ocena odpowiedzi | „Nie pamiętam/Pamiętam” + SR hints | study | study.answer | P1 | krytyczne decyzje użytkownika | KRYTYCZNE: /study |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/study/StudyProgress.tsx | komponent React | pasek postępu | etykiety i aria-label PL | study | study.progress | P2 | a11y regress | powiązać z pluralizacją |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/study/StudySummary.tsx | komponent React | podsumowanie | motywacyjne komunikaty i statystyki PL | study | study.summary | P1 | duża powierzchnia copy | KRYTYCZNE: /study |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/study/EmptyState.tsx | komponent React | empty state study | komunikaty i CTA po polsku | study | study.empty | P1 | niespójny język po zakończeniu sesji | KRYTYCZNE: /study |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/components/study/types.ts | typy + stałe | słownik błędów study | `errorMessages` hardcoded po polsku | study | study.errors_local | P1 | duplikacja z `errors.*` | KRYTYCZNE: /study |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/hooks/useStudySession.ts | hook | logika sesji + błędy | fallback błędów i mapowanie statusów | study | study.hook | P1 | ciche pomijanie błędów API | KRYTYCZNE: /study; mapować do `errors.study.*` |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/hooks/useAuthForm.ts | hook | auth error handling | mapowanie HTTP->komunikat PL | errors | errors.auth_form | P1 | brak `error_code`, status-coupling | KRYTYCZNE: /login,/register |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/hooks/useNavigation.ts | hook | konto/logout/delete | toasty błędów po polsku | errors | errors.navigation | P1 | krytyczne flow sesji | dotyczy wszystkich widoków po auth |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/helpers/auth.helper.ts | helper backend | autoryzacja API | stały tekst `Unauthorized` | errors | errors.auth_api | P1 | brak kontraktu `error_code` | wspólne dla wszystkich endpointów chronionych |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/api/auth/login.ts | API route | auth login | `error` text payload, mieszane EN | errors | errors.api_auth_login | P1 | frontend zależny od treści | KRYTYCZNE: /login |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/api/auth/register.ts | API route | auth register | `error` text payload, mieszane EN | errors | errors.api_auth_register | P1 | frontend zależny od treści | KRYTYCZNE: /register |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/api/auth/logout.ts | API route | auth logout | `Logout failed` EN | errors | errors.api_auth_logout | P2 | niespójność językowa backendu | globalny flow sesji |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/api/auth/account.ts | API route | usuwanie konta | `Failed to delete account` EN | errors | errors.api_auth_account | P2 | brak stabilnego kodu błędu | destrukcyjna operacja |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/api/generations.ts | API route | generator API | `error` PL free-text | errors | errors.api_generator | P1 | brak standaryzacji błędów | KRYTYCZNE: /generator |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/api/flashcards/index.ts | API route | flashcards API | `error` PL free-text | errors | errors.api_flashcards_index | P1 | coupling UI do tekstu | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/api/flashcards/batch.ts | API route | batch save | `error` PL free-text | errors | errors.api_flashcards_batch | P1 | utrata informacji przy save batch | KRYTYCZNE: /generator,/flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/api/flashcards/[id]/index.ts | API route | flashcard detail CRUD | mix PL + `Flashcard not found` EN + success EN | errors | errors.api_flashcards_detail | P1 | niespójny język i brak kodów | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/api/flashcards/[id]/reset-progress.ts | API route | reset progress | mix PL + `Flashcard not found` EN | errors | errors.api_flashcards_reset | P1 | brak kodów błędów | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/api/study/session.ts | API route | study session | `error` PL free-text | errors | errors.api_study_session | P1 | coupling UI do tekstu | KRYTYCZNE: /study |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/api/study/review.ts | API route | study review | `error` PL free-text | errors | errors.api_study_review | P1 | coupling UI do tekstu | KRYTYCZNE: /study |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/services/auth.service.ts | serwis | auth backend | komunikaty biznesowe EN i success message EN | errors | errors.service_auth | P1 | brak jednego słownika kodów | źródło wielu odpowiedzi API |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/services/generation.service.ts | serwis | generator backend | komunikaty PL generic | errors | errors.service_generator | P1 | brak rozróżnienia klas błędów | KRYTYCZNE: /generator |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/services/openrouter.service.ts | serwis | integracja AI | wyjątki PL; prompt systemowy PL | errors | errors.service_openrouter | P2 | pomylenie copy UI z promptem AI | prompt AI zostaje poza i18n UI |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/services/flashcard.service.ts | serwis | flashcards backend | mix PL/EN (`Generation log not found`) | errors | errors.service_flashcards | P1 | niespójność kontraktu błędów | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/services/study.service.ts | serwis | study backend | wyjątki PL hardcoded | errors | errors.service_study | P1 | brak kodów błędów per przypadek | KRYTYCZNE: /study |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/types.ts | kontrakt DTO | wspólne DTO | `MessageResponseDTO.message` promuje free-text | errors | errors.dto_contract | P1 | blokuje pełne przejście na `error_code` | dotyczy auth/flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/schemas/auth.schema.ts | schema Zod | walidacja auth | komunikaty tylko EN (`Invalid email format`) | validation | validation.auth | P1 | niespójność z UI PL | KRYTYCZNE: /login,/register |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/schemas/generation.schema.ts | schema Zod | walidacja generatora | komunikaty mix PL/EN | validation | validation.generator | P1 | brak spójności walidacji | KRYTYCZNE: /generator |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/schemas/flashcard.schema.ts | schema Zod | walidacja flashcards | komunikaty PL hardcoded | validation | validation.flashcards | P1 | brak parytetu PL/EN | KRYTYCZNE: /flashcards |
| /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/schemas/study.schema.ts | schema Zod | walidacja review | komunikaty PL hardcoded | validation | validation.study | P1 | brak parytetu PL/EN | KRYTYCZNE: /study |

## E. Konwencja kluczy + przykłady (min. 20)
Zamrożona konwencja:
1. Format klucza: `{moduł}.{widok}.{element}.{typ}`.
2. `moduł` = jeden z namespace domenowych (`common`, `landing`, `auth`, `generator`, `flashcards`, `study`, `errors`, `validation`).
3. `widok` = route lub podwidok komponentu (`login`, `register`, `hero`, `pagination`, `edit_modal`, `api_auth_login`).
4. `element` = nazwa semantyczna w `snake_case` (np. `submit_button`, `cards_count`, `server_error`).
5. `typ` = kontrolowane wartości: `title`, `text`, `label`, `placeholder`, `hint`, `aria`, `error`, `success`, `loading`, `helper`.
6. Pluralizacja: ten sam format, a warianty typu z sufiksem CLDR: `label_one`, `label_few`, `label_many`, `label_other`.
7. Interpolacja: wyłącznie `{{param}}`; zakaz sklejania stringów i liczb w kodzie.

Przykłady kluczy z realnych miejsc w repo:
| klucz | aktualny tekst / użycie | plik źródłowy |
|---|---|---|
| `landing.hero.headline.text` | „Twórz fiszki w kilka sekund” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/landing/HeroSection.astro |
| `landing.hero.subtitle.text` | opis działania AI + SM-2 | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/landing/HeroSection.astro |
| `landing.cta.login.label` | „Zaloguj się” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/landing/CTAButtons.tsx |
| `landing.features.section.title` | „Dlaczego 10xCards?” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/landing/FeaturesSection.astro |
| `auth.login.page.title` | „Logowanie - 10xCards” | /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/login.astro |
| `auth.login.heading.title` | „Zaloguj się” | /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/login.astro |
| `auth.login.submit.loading` | „Logowanie...” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/auth/LoginForm.tsx |
| `auth.login.register_link.label` | „Zarejestruj się” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/auth/LoginForm.tsx |
| `auth.register.heading.title` | „Utwórz konto” | /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/register.astro |
| `auth.register.submit.loading` | „Rejestracja...” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/auth/RegisterForm.tsx |
| `auth.password_rules.min_length.label` | „Minimum 8 znaków” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/auth/PasswordRequirements.tsx |
| `common.nav.generator.label` | „Generator” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/NavLinks.tsx |
| `common.nav.flashcards.label` | „Moje Fiszki” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/NavLinks.tsx |
| `common.account.delete_cta.label` | „Usuń konto” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/AccountDropdown.tsx |
| `generator.form.source_label.text` | „Tekst źródłowy” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/generator/SourceTextForm.tsx |
| `generator.form.submit_button.label` | „Generuj fiszki” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/generator/SourceTextForm.tsx |
| `generator.char_count.remaining.text` | „Potrzebujesz jeszcze {{count}} znaków” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/generator/CharCountTextarea.tsx |
| `generator.staging.summary.text` | „{{proposals}} propozycji • {{accepted}} zaakceptowanych...” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/generator/StagingArea.tsx |
| `generator.toast.save_success.success` | „Zapisano {{count}} fiszek pomyślnie!” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/generator/GeneratorContainer.tsx |
| `flashcards.header.title.text` | „Moje fiszki” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/FlashcardsHeader.tsx |
| `flashcards.search.input.placeholder` | „Szukaj fiszek...” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/SearchInput.tsx |
| `flashcards.pagination.count.label_few` | wariant pluralny dla „fiszki” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/Pagination.tsx |
| `flashcards.empty.search.title` | „Brak wyników wyszukiwania” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/EmptyState.tsx |
| `flashcards.edit_modal.title.text` | „Edytuj fiszkę” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/flashcards/FlashcardEditModal.tsx |
| `study.start.title.text` | „Sesja nauki” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/study/StudyStartScreen.tsx |
| `study.answer.remembered.label` | „Pamiętam” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/study/AnswerButtons.tsx |
| `study.summary.completed.title` | „Sesja zakończona!” | /Users/marcinlubowicz/10xdevs2/10xcards/src/components/study/StudySummary.tsx |
| `errors.api.server_error.generic` | „Błąd serwera” | /Users/marcinlubowicz/10xdevs2/10xcards/src/pages/api/flashcards/index.ts |
| `validation.auth.email.invalid` | „Invalid email format” | /Users/marcinlubowicz/10xdevs2/10xcards/src/lib/schemas/auth.schema.ts |

## F. Glossary PL/EN + zasady stylu copy
Glossary v1 (MVP):
| PL | EN | uwaga terminologiczna |
|---|---|---|
| fiszka | flashcard | podstawowy byt domenowy |
| przód fiszki | flashcard front | nie używać „question side” w UI |
| tył fiszki | flashcard back | parzyste z „front” |
| sesja nauki | study session | stały termin dla `/study` |
| powtórka | review | nie mieszać z „revision” |
| nowa fiszka | new flashcard | dla kart `is_new=true` |
| generator fiszek | flashcard generator | nazwa modułu `/generator` |
| tekst źródłowy | source text | wejście do AI |
| propozycja fiszki | flashcard proposal | staging area |
| zapamiętane | remembered | wynik pozytywny oceny |
| nie pamiętam | don't remember | etykieta przycisku negatywnego |
| współczynnik łatwości | ease factor | termin SM-2 |
| interwał | interval | liczba dni |
| następna powtórka | next review | data planowanej nauki |
| wyloguj | log out | akcja sesji |
| usuń konto | delete account | akcja destrukcyjna |
| błąd serwera | server error | komunikat ogólny |

Zasady stylu copy (FR-076):
1. Język: prosty, instrukcyjny, bez żargonu technicznego.
2. CTA: czasownik w trybie rozkazującym, max 3 wyrazy (`Zapisz zmiany`, `Rozpocznij sesję`).
3. Komunikaty błędów: co się stało + co zrobić dalej, bez ujawniania detali infrastruktury.
4. Walidacja: komunikat przy polu, jednoznaczny, bez wykrzykników.
5. Spójność terminów: wyłącznie terminy z glossary; zakaz synonimów ad hoc.
6. Pluralizacja: tylko przez i18next (`count`), bez ręcznych warunków w komponentach.
7. A11y copy (`aria-*`, `sr-only`) podlega tym samym regułom językowym co UI.

Proces jakości copy (wymóg FR-076):
| krok | właściciel | kryterium zakończenia |
|---|---|---|
| Przegląd glossary v1 | Developer i18n | 0 konfliktów terminologicznych między `auth/generator/flashcards/study` |
| Przegląd kluczy P1 | Developer i18n | 100% kluczy P1 ma opis semantyczny i przypisany namespace |
| Review parytetu PL/EN | Developer i18n | brak brakujących odpowiedników dla kluczy ścieżek krytycznych |
| Finalny review copy | Developer i18n | checklista stylu 7/7 spełniona, brak blokera P1 |

## G. Ryzyka, luki informacyjne, pytania otwarte
| id | typ | opis | wpływ | właściciel | kryterium zamknięcia |
|---|---|---|---|---|---|
| R1 | ryzyko | API zwraca dziś free-text zamiast `error_code` (mix PL/EN) | wysoki: niestabilne mapowanie błędów w UI | Developer i18n | spisana i zatwierdzona lista kodów błędów dla endpointów auth/generator/flashcards/study |
| R2 | ryzyko | Ręczna pluralizacja w `study` i `flashcards` | wysoki: błędna gramatyka po EN | Developer i18n | wszystkie miejsca z `count` mają klucze pluralne `_one/_few/_many/_other` |
| R3 | ryzyko | Hardcoded `pl-PL` przy datach/liczbach | średni: EN pokaże format PL | Developer i18n | zidentyfikowane i przypisane wszystkie miejsca formatowania do kontraktu locale |
| R4 | ryzyko | Część testów hooków asercjuje literalne komunikaty | średni: duża fala fail po migracji | Developer i18n | lista testów zależnych od literalnych tekstów dodana do backlogu Kroku 2 |
| L1 | luka | Brak decyzji, czy prompt AI w `openrouter.service.ts` ma zostać po polsku | średni: możliwe niepotrzebne rozszerzenie scope | Developer i18n | decyzja: prompt AI poza MVP i18n UI, zapisana jako out-of-scope |
| L2 | luka | Brak dedykowanego DTO dla błędu (`error_code`, `details`) w `src/types.ts` | wysoki: kontrakt API niejednoznaczny | Developer i18n | doprecyzowany docelowy typ błędu w planie Kroku 2 |
| Q1 | pytanie | Czy copy motywacyjne w `study.summary` ma być dosłowne czy adaptacyjne kulturowo? | średni: jakość UX EN | Developer i18n | wybrana strategia i wpis do glossary/stylu |
| Q2 | pytanie | Czy komunikat o potwierdzeniu usunięcia konta (`USUŃ`) ma mieć stały token EN (`DELETE`) czy lokalny? | wysoki: ryzyko UX i bezpieczeństwa | Developer i18n | zatwierdzona reguła tokenu potwierdzającego per locale |

## H. Kryteria zamknięcia Kroku 1 + Definition of Ready dla Kroku 2
Kryteria zamknięcia Kroku 1 (mierzalne):
1. Dokument zawiera zatwierdzony kontrakt i18n: locale `pl/en`, fallback `en`, pluralizacja, interpolacja, zasady brakujących kluczy, priorytet źródeł preferencji.
2. Zdefiniowane i rozgraniczone jest 8 namespace (`common`, `landing`, `auth`, `generator`, `flashcards`, `study`, `errors`, `validation`) wraz z granicami odpowiedzialności.
3. Inwentaryzacja obejmuje wszystkie obszary wymagane: UI, API, hooki, schemy walidacyjne, serwisy błędów, DTO kontraktu.
4. Zamrożona konwencja kluczy spełnia FR-010 i zawiera min. 20 przykładów opartych o realne miejsca w repo (tu: 29).
5. Glossary i reguły stylu copy są kompletne i przypisane do procesu review (FR-076).
6. Pokrycie FR jest jawne:
   - FR-010: TAK (sekcja E + reguły kluczy),
   - FR-011: TAK (sekcja C + D),
   - FR-076: TAK (sekcja F + kryteria jakości).

Definition of Ready dla Kroku 2 (krótkie):
1. Brak otwartych ryzyk P1 z sekcji G.
2. Zatwierdzony słownik namespace i prefixów kluczy dla wszystkich wpisów P1.
3. Uzgodniony docelowy kontrakt błędu API (`error_code`) dla endpointów krytycznych.
4. Zatwierdzony glossary v1 i checklista copy (FR-076) do użycia przy implementacji.
5. Przygotowana lista plików P1 jako pierwsza partia migracji (bez rozszerzania scope o Krok 3+).
