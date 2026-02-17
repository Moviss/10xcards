# Szczegółowy plan implementacji - Krok 2 (feature flag i18n + safe mode)

## 1. **Streszczenie techniczne (1 ekran)**
W Kroku 2 wdrażamy wyłącznie mechanizm bezpiecznego przełączania i18n przez centralną flagę `feature.i18n_mvp`, tak aby:
- `OFF` zachowywał 1:1 obecne działanie PL-only (bez regresji),
- `ON` aktywował ścieżkę runtime i18n (bootstrap + punkty kontrolne pod switcher), bez migracji danych.

Zakres Kroku 2:
- centralny kontrakt i parser flagi,
- jednolity odczyt flagi po stronie SSR i klienta,
- przekazanie snapshotu flagi z layoutu do runtime klienta,
- globalny bootstrap i18n aktywowany tylko przy `ON`,
- punkty kontrolne pod switcher w nawigacji desktop/mobile,
- testy OFF/ON + pipeline + runbook rollout/rollback.

Out-of-scope Kroku 2:
- instalacja i konfiguracja `i18next`/`react-i18next` (Krok 4),
- persystencja preferencji języka w DB/profilu (Krok 3/6),
- tłumaczenie UI modułów (`/`, `/login`, `/register`, `/generator`, `/flashcards`, `/study`) (Kroki 9-12),
- standaryzacja `error_code` API (Krok 8),
- lokalizacja formatów dat/liczb/walut (Krok 13).

Założenie (jawne): flaga jest sterowana env i rolloutem deploymentu (bez migracji danych), zgodnie z obecnym wzorcem env w repo.

## 2. **Decyzje architektoniczne (tabela)**

| Decyzja | Opcje odrzucone | Uzasadnienie osadzone w aktualnym repo | Wpływ na ryzyko |
|---|---|---|---|
| Jedno źródło prawdy flagi: `FEATURE_I18N_MVP` mapowane na `feature.i18n_mvp` | Rozproszone `if (import.meta.env...)` w komponentach | Brak istniejącej infrastruktury feature-flag; obecny kod ma odczyt env punktowo i bez centralizacji. | Silnie obniża ryzyko niespójnego OFF/ON między plikami. |
| Parser fail-closed: wszystko poza `1/true/on` => `false` | Parser fail-open | Wymóg "safe mode" i FR-082: bezpieczny powrót do PL-only; domyślnie OFF minimalizuje regresje. | Redukuje ryzyko przypadkowego ON na produkcji. |
| Snapshot flagi wstrzykiwany z `/Users/marcinlubowicz/10xdevs2/10xcards/src/layouts/Layout.astro` do `window.__10XCARDS_FEATURE_FLAGS__` | Odczyt klienta z `PUBLIC_*` env albo duplikacja logiki w React | W repo nie ma runtime config endpointu; layout jest wspólnym punktem wejścia wszystkich stron. | Redukuje ryzyko driftu SSR vs klient. |
| Punkt inicjalizacji i18n jako globalny bootstrap komponentu | Bezpośrednie odpalanie i18n w `Navigation` lub losowych hookach | `Layout.astro` to globalny shell; bootstrap powinien być poza modułami biznesowymi. | Ogranicza ryzyko side-effectów i łatwiejszy rollback. |
| Punkty kontrolne switchera jako sloty w nawigacji (desktop/mobile), bez pełnego UI switchera | Pełna implementacja switchera już teraz | Zgodnie z planem głównym switcher to osobny Krok 7; teraz tylko bramkowanie runtime. | Ogranicza scope creep i ryzyko regresji UX. |
| OFF pełny regression E2E, ON dedykowany smoke E2E | Pełna macierz wszystkich E2E dla ON od razu | Obecny pipeline ma pojedynczy e2e job; pełna macierz od razu znacząco podniesie koszt i flakiness. | Balans: wykrywa krytyczne błędy flagi, nie blokuje iteracji. |
| Utrzymanie `/Users/marcinlubowicz/10xdevs2/10xcards/src/pages/index.astro` bez zmian funkcjonalnych w Kroku 2 | Przebudowa routingu i prerenderingu w Kroku 2 | Celem Kroku 2 jest flaga i safe mode, nie przebudowa renderingu strony głównej. | Minimalizuje ryzyko wydajnościowych/regresyjnych efektów ubocznych. |

## 3. **Plan zmian plik-po-pliku (najważniejsza sekcja)**

| Ścieżka absolutna | Typ zmiany | Dokładny zakres zmian | Zależności | Ryzyko regresji | Testy, które trzeba zaktualizować/dodać |
|---|---|---|---|---|---|
| `/Users/marcinlubowicz/10xdevs2/10xcards/.env.example` | update | Dodać `FEATURE_I18N_MVP=0` z opisem wartości dozwolonych i domyślnego OFF. | Brak | Niskie | Smoke: start aplikacji bez ustawionej flagi. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/.env.test` | update | Wymusić `FEATURE_I18N_MVP=0`, aby istniejące E2E działały w trybie legacy. | `.github/workflows/pull-request.yml` | Średnie (niestabilne testy, jeśli pominięte) | `npm run test:e2e` (regresja OFF). |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/env.d.ts` | update | Dodać typ `ImportMetaEnv.FEATURE_I18N_MVP`; dodać typ globalny `Window.__10XCARDS_FEATURE_FLAGS__`. | `src/lib/i18n/feature-flags.ts` | Niskie | `npm run lint`, `npm run test`. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/lib/i18n/contracts.ts` | update | Dodać stałą klucza flagi `feature.i18n_mvp` jako część kontraktu Kroku 2. | Step1 contracts | Niskie | Rozszerzyć `src/lib/i18n/contracts.test.ts`. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/lib/i18n/contracts.test.ts` | update | Asercja stałej klucza flagi oraz domyślnego zachowania safe mode. | `contracts.ts` | Niskie | Test unit kontraktu. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/lib/i18n/feature-flags.ts` | create | Centralny helper: parse env -> snapshot flag, SSR getter, klient getter z `window`, helper `isI18nMvpEnabled`. | `contracts.ts`, `env.d.ts` | Wysokie (centralny punkt decyzji OFF/ON) | Nowy `feature-flags.test.ts`. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/lib/i18n/feature-flags.test.ts` | create | Testy parsera (`undefined`, `0`, `1`, `true`, invalid), testy odczytu z `window` i fallback OFF. | `feature-flags.ts` | Niskie | Plik testowy nowy. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/lib/i18n/index.ts` | update | Re-export helperów flagi, żeby konsumenci nie importowali z wielu miejsc. | `feature-flags.ts` | Niskie | Kompilacja + lint. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/layouts/Layout.astro` | update | Obliczyć snapshot flagi po stronie SSR; dodać `data-feature-i18n-mvp` na `<html>`; wstrzyknąć snapshot do `window.__10XCARDS_FEATURE_FLAGS__`; podpiąć globalny bootstrap i18n (client-only). | `feature-flags.ts`, `GlobalI18nBootstrap.tsx` | Wysokie (globalny layout) | E2E OFF/ON, manual smoke `/`, `/login`, `/generator`. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/components/GlobalI18nBootstrap.tsx` | create | Komponent bootstrap: przy `OFF` no-op; przy `ON` ustawia marker runtime i emituje zdarzenie startu ścieżki i18n (bez ładowania tłumaczeń). | `feature-flags.ts` | Średnie (side-effect globalny) | Nowy test komponentu. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/components/GlobalI18nBootstrap.test.tsx` | create | Testy: brak side-effect przy OFF, pojedyncza inicjalizacja przy ON, idempotencja. | `GlobalI18nBootstrap.tsx` | Niskie | Plik testowy nowy. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/Navigation.tsx` | update | Odczyt snapshotu flagi po stronie klienta i przekazanie `isI18nMvpEnabled` do `TopNav` i `MobileNav`. | `feature-flags.ts` | Średnie | `Navigation.feature-flag.test.tsx`. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/TopNav.tsx` | update | Dodać punkt kontrolny switchera (desktop) renderowany wyłącznie gdy `isI18nMvpEnabled=true`. | `LanguageSwitcherSlot.tsx` | Średnie (layout header) | `Navigation.feature-flag.test.tsx`, manual desktop smoke. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/MobileNav.tsx` | update | Dodać punkt kontrolny switchera (mobile sheet) za flagą ON, bez zmiany istniejących akcji konta. | `LanguageSwitcherSlot.tsx` | Średnie (responsive/mobile) | `Navigation.feature-flag.test.tsx`, manual mobile smoke. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/LanguageSwitcherSlot.tsx` | create | Komponent-placeholder pod krok 7: OFF => `null`, ON => stabilny punkt montowania (test-id), bez logiki tłumaczeń. | `TopNav.tsx`, `MobileNav.tsx` | Niskie | `Navigation.feature-flag.test.tsx`. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/Navigation.feature-flag.test.tsx` | create | Testy integracyjne komponentów nawigacji: OFF brak slotu, ON obecny slot, brak regresji istniejących linków/test-id. | `Navigation.tsx`, `TopNav.tsx`, `MobileNav.tsx` | Niskie | Nowy zestaw testów RTL. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/e2e/page-objects/FeatureFlagPage.ts` | create | POM do odczytu markerów runtime flagi z DOM (`data-feature-i18n-mvp`, marker bootstrap). | `e2e/i18n-feature-flag.spec.ts` | Niskie | Nowy test E2E. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/e2e/page-objects/index.ts` | update | Export nowego `FeatureFlagPage`. | `FeatureFlagPage.ts` | Niskie | Kompilacja testów E2E. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/e2e/i18n-feature-flag.spec.ts` | create | Scenariusze OFF i ON: walidacja markerów flagi i braku regresji bazowego renderu; bez wejścia w pełny scope tłumaczeń. | Layout + bootstrap + POM | Średnie (flakiness przy złym env) | Uruchamiany osobno dla ON smoke. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/.github/workflows/pull-request.yml` | update | Dodać jawne `FEATURE_I18N_MVP=0` do obecnego E2E; dodać osobny job smoke z `FEATURE_I18N_MVP=1` dla `e2e/i18n-feature-flag.spec.ts`. | E2E spec, `.env.test` | Średnie (czas pipeline) | PR CI green dla obu trybów. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/README.md` | update | Uzupełnić sekcję env o `FEATURE_I18N_MVP`; opisać OFF/ON i komendy smoke testów flagi. | `.env.example` | Niskie | Review dokumentacji. |
| `/Users/marcinlubowicz/10xdevs2/10xcards/docs/i18n/step2-feature-flag-implementation.md` | create | Dokument decyzji Kroku 2, checklista rollout i szczegółowy rollback techniczny. | Cały Krok 2 | Niskie | Review architektoniczny + QA sign-off. |

## 4. **Projekt feature flagi `feature.i18n_mvp`**

Źródło flagi:
- `env/config`: `FEATURE_I18N_MVP` (domyślnie `0`).
- Mapowanie logiczne: `FEATURE_I18N_MVP -> feature.i18n_mvp`.
- Parser: fail-closed (`1/true/on` => `true`, reszta => `false`).

API helpera do odczytu flagi (SSR + klient):
```ts
type FeatureFlagsSnapshot = { "feature.i18n_mvp": boolean };

getServerFeatureFlags(env?: ImportMetaEnv): FeatureFlagsSnapshot;
getClientFeatureFlags(win?: Window): FeatureFlagsSnapshot;
isI18nMvpEnabled(snapshot: FeatureFlagsSnapshot): boolean;
```

Punkty kontrolne w layoutach i komponentach globalnych:
- SSR snapshot + serializacja: `/Users/marcinlubowicz/10xdevs2/10xcards/src/layouts/Layout.astro`.
- Globalny bootstrap ścieżki i18n: `/Users/marcinlubowicz/10xdevs2/10xcards/src/components/GlobalI18nBootstrap.tsx`.
- Kontrola switchera desktop: `/Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/TopNav.tsx`.
- Kontrola switchera mobile: `/Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/MobileNav.tsx`.
- Wspólny slot switchera: `/Users/marcinlubowicz/10xdevs2/10xcards/src/components/navigation/LanguageSwitcherSlot.tsx`.

Zachowanie OFF vs ON (jawna tabela stanów):

| Obszar | OFF (`feature.i18n_mvp=false`) | ON (`feature.i18n_mvp=true`) |
|---|---|---|
| Snapshot flagi | `{"feature.i18n_mvp": false}` | `{"feature.i18n_mvp": true}` |
| `<html data-feature-i18n-mvp>` | `off` | `on` |
| `window.__10XCARDS_FEATURE_FLAGS__` | obecne, wartość `false` | obecne, wartość `true` |
| Global bootstrap i18n | nie wykonuje side-effectów | aktywuje marker runtime i event startowy |
| Punkty montowania switchera | brak renderu | render slotów kontrolnych desktop/mobile |
| Treść aplikacji | obecny PL-only, bez zmian | nadal obecny tekst (Krok 2 nie migruje copy), ale uruchomiona ścieżka i18n runtime |
| Rollback | n/a | wyłączenie flagi wraca do zachowania OFF, bez migracji danych |

## 5. **Sekwencja wdrożenia (kroki wykonawcze)**

Kolejność commitów:
1. `chore(i18n): add feature flag contract and env typing`
2. `feat(i18n): add SSR/client feature-flag helpers + layout snapshot injection`
3. `feat(i18n): add global i18n bootstrap safe mode`
4. `feat(i18n): add navigation switcher control points (desktop/mobile)`
5. `test(i18n): add unit/component/e2e tests for OFF/ON`
6. `ci/docs(i18n): add PR jobs for OFF regression + ON smoke, update docs`

Plan migracji bez downtime:
1. Wdrożyć kod Kroku 2 z `FEATURE_I18N_MVP=0` na dev/test/prod.
2. Potwierdzić smoke OFF (`/`, `/login`, `/register`, `/generator`, `/flashcards`, `/study`) i brak regresji E2E.
3. Włączyć flagę na dev (`FEATURE_I18N_MVP=1`) i wykonać smoke ON.
4. Włączyć flagę na test i powtórzyć smoke ON + E2E smoke.
5. Włączyć flagę na produkcji etapowo (zamknięta beta), monitorując błędy klienta.

Rollback krok po kroku (technicznie, nie ogólniki):
1. Ustawić `FEATURE_I18N_MVP=0` w sekretach/zmiennych środowiska docelowego.
2. Wykonać rolling deploy (bez zmian DB, bez migracji SQL).
3. Zweryfikować `data-feature-i18n-mvp="off"` w HTML na `/` i `/login`.
4. Zweryfikować brak markeru runtime i18n oraz przejście smoke OFF.
5. Jeśli problem utrzymuje się, wrócić do poprzedniego release tagu (również bez migracji danych).

## 6. **Strategia testów**

| Typ testów | Scenariusze OFF | Scenariusze ON | Kryteria pass/fail |
|---|---|---|---|
| unit | Parser zwraca `false` dla `undefined`, `0`, `false`, invalid. | Parser zwraca `true` dla `1`, `true`, `on`. | PASS: 100% testów helpera zielone; FAIL: dowolny błąd mapowania OFF/ON. |
| integration | `Navigation` nie renderuje slotów switchera. | `Navigation` renderuje slot desktop/mobile; linki nav nadal działają. | PASS: brak zmian istniejących test-id i linków; FAIL: znikające linki/akcje konta. |
| e2e | Tryb OFF: marker `data-feature-i18n-mvp=off`; istniejący happy path bez zmian. | Tryb ON: marker `data-feature-i18n-mvp=on`; aktywny marker bootstrap; bazowy render stabilny. | PASS: OFF i ON przechodzą dedykowane specy; FAIL: brak markerów lub regresja flow. |
| manual smoke | Wejście i autoryzacja działają jak przed zmianą. | Aplikacja uruchamia ścieżkę i18n runtime bez crasha/hydration error. | PASS: brak błędów runtime/console P0/P1; FAIL: crash, hydration mismatch, blokada nawigacji. |

Minimalny zestaw testów blokujących merge:
1. `npm run lint`
2. `npx vitest src/lib/i18n/contracts.test.ts src/lib/i18n/feature-flags.test.ts src/components/GlobalI18nBootstrap.test.tsx src/components/navigation/Navigation.feature-flag.test.tsx`
3. `FEATURE_I18N_MVP=0 npx playwright test e2e/happy-path.spec.ts`
4. `FEATURE_I18N_MVP=1 npx playwright test e2e/i18n-feature-flag.spec.ts`

## 7. **Ryzyka i mitigacje (tabela)**

| Ryzyko | Prawdopodobieństwo/impact | Sygnały wczesnego wykrycia | Plan awaryjny |
|---|---|---|---|
| Niespójność OFF/ON między SSR i klientem | M/H | `data-feature-i18n-mvp` != `window.__10XCARDS_FEATURE_FLAGS__` | Traktować layout snapshot jako jedyne źródło klienta; blokować merge przy failu E2E markerów. |
| Przypadkowe włączenie flagi przez zły parsing | L/H | ON w env typu `yesplease` lub puste stringi | Parser fail-closed + testy parsera + jawne `FEATURE_I18N_MVP=0` w CI. |
| Regresja nawigacji po dodaniu slotów switchera | M/M | Zmiany spacing/header overflow na mobile | Snapshot test integracyjny + manual responsive smoke; szybkie wyłączenie flagi. |
| Side-effect bootstrap uruchamiany wielokrotnie | M/M | Wielokrotne eventy i niestabilność po nawigacji | Idempotencja w bootstrapie + test jednostkowy "run once". |
| Wzrost czasu CI po dodaniu ON smoke | M/M | PR pipeline przekracza SLA | Ograniczyć ON do jednego speca smoke, pełna regresja tylko OFF. |
| Brak gotowości operacyjnej rollbacku | L/H | Brak checklisty i niejasne kroki przy incydencie | Utrzymać runbook w `docs/i18n/step2-feature-flag-implementation.md` i przećwiczyć rollback na test. |
| Ograniczenia CSP dla inline snapshot script | L/M | Blokada skryptu w przeglądarce, brak `window.__10XCARDS_FEATURE_FLAGS__` | Fallback: data-attribute + (jeśli wymagane) nonce/CSP update jako hotfix. |

## 8. **Definition of Done Kroku 2 (mierzalne)**

| Checklista binarna (TAK/NIE) | Mapowanie na FR-080, FR-082, US-019 |
|---|---|
| Istnieje centralny helper flagi i wszystkie punkty decyzji OFF/ON korzystają z niego (bez rozproszonych warunków). | FR-080 |
| Domyślna konfiguracja środowiskowa ustawia `FEATURE_I18N_MVP=0`. | FR-080, US-019 |
| W trybie OFF aplikacja przechodzi dotychczasowy happy-path bez zmian zachowania. | FR-082, US-019 (scenariusz podstawowy) |
| W trybie ON aktywuje się ścieżka i18n runtime (bootstrap + markery + sloty kontrolne). | FR-080, US-019 (scenariusz alternatywny) |
| Rollback przez wyłączenie flagi nie wymaga żadnej migracji danych ani zmian schematu DB. | FR-082, US-019 (scenariusz skrajny) |
| Pipeline PR zawiera automatyczną walidację OFF i ON (co najmniej ON smoke). | FR-080, FR-082 |
| Istnieje dokumentowany i przetestowany runbook rollout/rollback dla Kroku 2. | FR-082, US-019 |

## 9. **Otwarte pytania do decyzji (max 7)**

| Pytanie blokujące implementację | Rekomendowana odpowiedź |
|---|---|
| Czy akceptujemy rollout/rollback flagi przez deployment env (a nie dynamiczny remote toggle)? | Tak, w Kroku 2 rollout przez env + rolling deploy jest wystarczający i zgodny z obecnym repo. |
| Czy przy ON w Kroku 2 switcher ma być widoczny dla użytkownika końcowego? | Nie, tylko punkty kontrolne/sloty techniczne; pełny UI switchera dopiero w Kroku 7. |
| Czy ON smoke ma być obowiązkowy w każdym PR już od Kroku 2? | Tak, ale jako lekki pojedynczy spec E2E, nie pełna macierz wszystkich testów. |
| Czy wymagamy twardego warunku `FEATURE_I18N_MVP=0` w istniejącym jobie E2E? | Tak, aby gwarantować brak regresji legacy PL-only. |
| Czy projekt ma aktywne CSP blokujące inline script w layoutach? | Założenie: nie; jeśli tak, trzeba od razu zaplanować nonce dla snapshot script. |
| Czy uruchamiamy ON na produkcji od razu po Kroku 2? | Nie, tylko zamknięta beta i monitorowany rollout etapowy. |
| Czy dokumentacja operacyjna Kroku 2 ma być wymagana przed merge? | Tak, runbook rollout/rollback jest elementem DoD dla FR-082/US-019. |
