# Plan implementacji widoku Landing Page

## 1. Przegląd

Landing Page jest stroną główną aplikacji 10xCards, służącą jako punkt wejścia dla niezalogowanych użytkowników. Głównym celem widoku jest przedstawienie wartości produktu (automatyczne tworzenie fiszek z AI) oraz zachęcenie odwiedzających do rejestracji lub logowania. Strona ma charakter statyczny (SSG) dla zapewnienia szybkiego ładowania i optymalnego SEO.

Landing Page składa się z dwóch głównych sekcji:
- **Hero Section** - główny baner z nagłówkiem, opisem korzyści i przyciskami CTA
- **Sekcja Korzyści** - 3-4 punkty prezentujące kluczowe funkcje aplikacji

## 2. Routing widoku

- **Ścieżka**: `/`
- **Plik**: `src/pages/index.astro`
- **Tryb renderowania**: Statyczny (SSG) - `export const prerender = true`
- **Przekierowanie zalogowanych**: Użytkownik z aktywną sesją powinien zostać przekierowany do `/generator`

## 3. Struktura komponentów

```
index.astro (strona)
└── Layout.astro (wrapper)
    └── LandingPage.astro (główny komponent widoku)
        ├── HeroSection.astro
        │   ├── h1 (nagłówek główny)
        │   ├── p (opis)
        │   └── CTAButtons.tsx (React - client:load)
        │       ├── Button "Zaloguj się" (link do /login)
        │       └── Button "Zarejestruj się" (link do /register)
        └── FeaturesSection.astro
            └── FeatureCard.astro (×3-4)
                ├── ikona/ilustracja
                ├── h3 (tytuł korzyści)
                └── p (opis korzyści)
```

## 4. Szczegóły komponentów

### LandingPage.astro

- **Opis**: Główny komponent strony Landing Page, który organizuje układ sekcji Hero i Features. Pełni rolę kontenera dla całego widoku i zapewnia spójne stylowanie.
- **Główne elementy**:
  - Element `<main>` z klasami Tailwind dla układu
  - Komponenty `<HeroSection />` i `<FeaturesSection />`
- **Obsługiwane interakcje**: Brak (komponent statyczny)
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak (komponent Astro bez propsów)
- **Propsy**: Brak

### HeroSection.astro

- **Opis**: Sekcja hero zawierająca główny przekaz marketingowy aplikacji. Wyświetla nagłówek z główną korzyścią (automatyczne tworzenie fiszek z AI), krótki opis działania oraz przyciski nawigacyjne do logowania i rejestracji.
- **Główne elementy**:
  - `<section>` jako kontener z odpowiednimi klasami
  - `<h1>` - główny nagłówek strony (np. "Twórz fiszki w kilka sekund dzięki AI")
  - `<p>` - krótki opis produktu (2-3 zdania)
  - `<CTAButtons />` - komponent React z przyciskami
  - Opcjonalnie: ilustracja/grafika dekoracyjna
- **Obsługiwane interakcje**: Brak (interakcje delegowane do CTAButtons)
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: Brak

### CTAButtons.tsx

- **Opis**: Komponent React zawierający przyciski Call-to-Action nawigujące do stron logowania i rejestracji. Używa komponentu Button z Shadcn/ui z odpowiednimi wariantami stylistycznymi.
- **Główne elementy**:
  - `<div>` jako kontener z flexbox dla układu przycisków
  - `<Button asChild variant="default">` z `<a href="/login">` - przycisk "Zaloguj się"
  - `<Button asChild variant="outline">` z `<a href="/register">` - przycisk "Zarejestruj się"
- **Obsługiwane interakcje**:
  - Kliknięcie "Zaloguj się" → nawigacja do `/login`
  - Kliknięcie "Zarejestruj się" → nawigacja do `/register`
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak (nie przyjmuje propsów)
- **Propsy**: Brak

### FeaturesSection.astro

- **Opis**: Sekcja prezentująca 3-4 kluczowe korzyści/funkcje aplikacji w formie kart. Każda korzyść zawiera ikonę, tytuł i krótki opis.
- **Główne elementy**:
  - `<section>` jako kontener
  - `<h2>` - nagłówek sekcji (np. "Dlaczego 10xCards?")
  - `<div>` - grid/flex kontener dla kart korzyści
  - `<FeatureCard />` × 3-4 instancje
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: Brak

### FeatureCard.astro

- **Opis**: Pojedyncza karta prezentująca jedną korzyść/funkcję aplikacji. Zawiera ikonę wizualną, tytuł korzyści i krótki opis.
- **Główne elementy**:
  - `<article>` lub `<div>` jako kontener karty
  - Element z ikoną (SVG inline lub komponent ikony z Lucide)
  - `<h3>` - tytuł korzyści
  - `<p>` - opis korzyści (1-2 zdania)
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Brak
- **Typy**: `FeatureCardProps`
- **Propsy**:
  - `icon: string` - nazwa ikony lub komponent SVG
  - `title: string` - tytuł korzyści
  - `description: string` - opis korzyści

## 5. Typy

### FeatureCardProps

Interfejs definiujący propsy dla komponentu FeatureCard:

```typescript
interface FeatureCardProps {
  icon: string;        // Nazwa ikony Lucide lub identyfikator SVG
  title: string;       // Tytuł korzyści (np. "Generowanie AI")
  description: string; // Krótki opis korzyści (1-2 zdania)
}
```

### Feature (dane statyczne)

Typ dla tablicy danych o korzyściach:

```typescript
interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: "sparkles",
    title: "Automatyczne generowanie fiszek",
    description: "Wklej tekst, a AI stworzy dla Ciebie gotowe fiszki w kilka sekund."
  },
  {
    icon: "brain",
    title: "Nauka z algorytmem SM-2",
    description: "Powtórki w optymalnych odstępach czasu dla maksymalnej efektywności."
  },
  {
    icon: "edit",
    title: "Pełna kontrola nad treścią",
    description: "Edytuj, akceptuj lub odrzucaj propozycje AI według własnych potrzeb."
  },
  {
    icon: "smartphone",
    title: "Dostępność na każdym urządzeniu",
    description: "Responsywny interfejs zoptymalizowany pod naukę na telefonie."
  }
];
```

## 6. Zarządzanie stanem

Landing Page jest stroną w pełni statyczną i nie wymaga zarządzania stanem po stronie klienta. Wszystkie dane (teksty, korzyści) są zdefiniowane statycznie w komponentach.

**Brak potrzeby customowych hooków** - strona nie zawiera formularzy ani interaktywnych elementów wymagających stanu React.

**Sprawdzenie sesji użytkownika**: Opcjonalnie, dla przekierowania zalogowanych użytkowników do `/generator`, można wykorzystać middleware Astro lub sprawdzenie po stronie klienta:

```typescript
// Opcja 1: W middleware (src/middleware/index.ts)
// Dodanie logiki przekierowania dla ścieżki "/"

// Opcja 2: Komponent React z useEffect (mniej preferowane dla SSG)
```

## 7. Integracja API

Landing Page nie wymaga integracji z API backendowym. Jest to strona czysto prezentacyjna bez pobierania danych.

**Opcjonalne sprawdzenie sesji**:
- Jeśli zdecydujemy się na przekierowanie zalogowanych użytkowników, można wykorzystać Supabase Auth do sprawdzenia sesji
- Typ sprawdzenia: `supabase.auth.getSession()`
- W przypadku aktywnej sesji: przekierowanie do `/generator`

## 8. Interakcje użytkownika

| Interakcja | Element | Rezultat |
|------------|---------|----------|
| Kliknięcie "Zaloguj się" | Button w HeroSection | Nawigacja do `/login` |
| Kliknięcie "Zarejestruj się" | Button w HeroSection | Nawigacja do `/register` |
| Scroll strony | Cała strona | Płynne przewijanie między sekcjami |
| Focus na przyciskach (Tab) | Przyciski CTA | Widoczny focus ring (accessibility) |
| Enter/Space na przyciskach | Przyciski CTA | Aktywacja linku (nawigacja) |

## 9. Warunki i walidacja

Landing Page nie posiada formularzy ani pól wymagających walidacji. Jedyny warunek logiczny dotyczy opcjonalnego przekierowania:

| Warunek | Źródło sprawdzenia | Akcja |
|---------|-------------------|-------|
| Użytkownik zalogowany | Supabase Auth session | Przekierowanie do `/generator` |
| Użytkownik niezalogowany | Brak sesji | Wyświetlenie Landing Page |

## 10. Obsługa błędów

Ze względu na statyczny charakter strony, obsługa błędów jest minimalna:

| Scenariusz | Obsługa |
|------------|---------|
| Brak połączenia z internetem | Strona statyczna - działa offline po pierwszym załadowaniu |
| Błąd ładowania CSS/JS | Graceful degradation - treść HTML pozostaje czytelna |
| Błąd sprawdzenia sesji | Wyświetlenie Landing Page (brak przekierowania) |
| Brak wsparcia dla JavaScript | Strona renderuje się poprawnie (Astro SSG), przyciski działają jako standardowe linki |

**Strategia fallback**: Wszystkie przyciski używają natywnych elementów `<a>` (dzięki `asChild` w Button), więc nawigacja działa nawet bez JavaScript.

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

Utworzenie następujących plików:
- `src/components/landing/LandingPage.astro`
- `src/components/landing/HeroSection.astro`
- `src/components/landing/FeaturesSection.astro`
- `src/components/landing/FeatureCard.astro`
- `src/components/landing/CTAButtons.tsx`

### Krok 2: Implementacja FeatureCard.astro

1. Utworzyć interfejs Props w frontmatter
2. Zaimplementować strukturę HTML karty
3. Dodać stylowanie Tailwind (padding, border-radius, shadow)
4. Zintegrować ikonę Lucide (opcjonalnie jako SVG inline)

### Krok 3: Implementacja FeaturesSection.astro

1. Zdefiniować tablicę features z danymi korzyści
2. Utworzyć kontener sekcji z nagłówkiem h2
3. Zaimplementować grid/flex layout dla kart
4. Zmapować dane do komponentów FeatureCard
5. Dodać responsywne breakpointy (1 kolumna mobile, 2-4 desktop)

### Krok 4: Implementacja CTAButtons.tsx

1. Zaimportować Button z `@/components/ui/button`
2. Utworzyć komponent funkcyjny
3. Dodać dwa przyciski z odpowiednimi wariantami
4. Zastosować układ flexbox z gap

### Krok 5: Implementacja HeroSection.astro

1. Utworzyć strukturę sekcji hero
2. Dodać nagłówek h1 z głównym przekazem
3. Dodać paragraf z opisem produktu
4. Zintegrować CTAButtons z dyrektywą `client:load`
5. Opcjonalnie dodać ilustrację/grafikę
6. Zastosować centrowanie i odpowiednie marginesy

### Krok 6: Implementacja LandingPage.astro

1. Zaimportować HeroSection i FeaturesSection
2. Utworzyć element main jako kontener
3. Dodać obie sekcje w odpowiedniej kolejności
4. Zastosować spacing między sekcjami

### Krok 7: Aktualizacja index.astro

1. Usunąć lub zastąpić komponent Welcome
2. Zaimportować Layout i LandingPage
3. Ustawić odpowiedni tytuł strony
4. Dodać `export const prerender = true` dla SSG

### Krok 8: Stylowanie i dostępność

1. Zapewnić kontrast WCAG AA dla wszystkich tekstów
2. Dodać semantyczne znaczniki HTML (main, section, article)
3. Sprawdzić hierarchię nagłówków (h1 → h2 → h3)
4. Dodać focus-visible dla elementów interaktywnych
5. Przetestować nawigację klawiaturą

### Krok 9: Responsywność

1. Przetestować układ na breakpointach mobile (<768px) i desktop (≥768px)
2. Dostosować rozmiary czcionek dla różnych urządzeń
3. Zweryfikować czytelność na małych ekranach

### Krok 10: Opcjonalne przekierowanie zalogowanych

1. Rozważyć dodanie logiki sprawdzenia sesji w middleware
2. Alternatywnie: dodać sprawdzenie po stronie klienta w CTAButtons
3. Przetestować przepływ dla zalogowanych i niezalogowanych użytkowników

### Krok 11: Testy i finalizacja

1. Przetestować wszystkie linki nawigacyjne
2. Sprawdzić poprawność renderowania SSG (`npm run build`)
3. Zweryfikować Lighthouse score (Performance, Accessibility, SEO)
4. Upewnić się, że strona ładuje się szybko (<3s LCP)
