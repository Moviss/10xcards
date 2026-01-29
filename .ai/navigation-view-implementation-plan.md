# Plan implementacji widoku Nawigacji

## 1. Przegląd

Widok nawigacji to globalny element interfejsu użytkownika odpowiedzialny za umożliwienie zalogowanym użytkownikom przemieszczania się między głównymi sekcjami aplikacji (Generator, Moje Fiszki, Nauka) oraz zarządzanie kontem (wylogowanie, usunięcie konta). Nawigacja składa się z dwóch wariantów: top-bar dla urządzeń desktopowych oraz hamburger menu dla urządzeń mobilnych. Dodatkowo zawiera dropdown menu konta użytkownika z opcjami wylogowania i usunięcia konta (z dialogiem potwierdzającym wymagającym wpisania słowa "USUŃ").

## 2. Routing widoku

Nawigacja nie jest osobnym widokiem routingu - jest komponentem osadzonym w układzie (layout) wszystkich chronionych stron:
- `/generator`
- `/flashcards`
- `/study`

Nawigacja powinna być widoczna tylko dla zalogowanych użytkowników. Dla niezalogowanych użytkowników (strony `/`, `/login`, `/register`) nawigacja nie jest wyświetlana.

## 3. Struktura komponentów

```
Layout.astro
└── AuthenticatedLayout.astro (nowy)
    └── Navigation (React, client:load)
        ├── TopNav (desktop, ukryty na mobile)
        │   ├── Logo
        │   ├── NavLinks
        │   │   ├── NavLink (Generator)
        │   │   ├── NavLink (Moje Fiszki)
        │   │   └── NavLink (Nauka)
        │   └── AccountDropdown
        │       ├── DropdownTrigger (email użytkownika)
        │       ├── DropdownMenuItem (Wyloguj)
        │       └── DropdownMenuItem (Usuń konto)
        │
        └── MobileNav (mobile, ukryty na desktop)
            ├── MobileNavHeader
            │   ├── Logo
            │   └── HamburgerButton
            └── MobileNavSheet
                ├── NavLink (Generator)
                ├── NavLink (Moje Fiszki)
                ├── NavLink (Nauka)
                ├── Separator
                ├── UserEmail (read-only)
                ├── LogoutButton
                └── DeleteAccountButton

DeleteAccountDialog (globalny, kontrolowany stanem)
    ├── AlertDialogContent
    │   ├── AlertDialogHeader (ostrzeżenie)
    │   ├── Input (do wpisania "USUŃ")
    │   └── AlertDialogFooter
    │       ├── Button (Anuluj)
    │       └── Button (Usuń konto, disabled do momentu wpisania "USUŃ")
```

## 4. Szczegóły komponentów

### Navigation

- **Opis**: Główny kontener nawigacji, który renderuje odpowiedni wariant w zależności od szerokości ekranu. Zarządza stanem użytkownika i przekazuje go do komponentów potomnych.
- **Główne elementy**: `TopNav`, `MobileNav`, `DeleteAccountDialog`
- **Obsługiwane interakcje**: Brak bezpośrednich - deleguje do komponentów potomnych
- **Obsługiwana walidacja**: Brak
- **Typy**: `NavigationProps`, `UserInfo`
- **Propsy**:
  - `userEmail: string` - adres email zalogowanego użytkownika
  - `currentPath: string` - aktualna ścieżka URL do podświetlenia aktywnego linku

### TopNav

- **Opis**: Nawigacja top-bar dla urządzeń desktopowych (widoczna od breakpointu md: 768px). Zawiera logo, linki nawigacyjne i dropdown konta.
- **Główne elementy**: `<nav>`, `<a>` (logo), `NavLinks`, `AccountDropdown`
- **Obsługiwane interakcje**: Kliknięcie logo (przekierowanie do `/generator`), kliknięcie linków nawigacyjnych
- **Obsługiwana walidacja**: Brak
- **Typy**: `TopNavProps`
- **Propsy**:
  - `userEmail: string`
  - `currentPath: string`
  - `onLogout: () => void`
  - `onDeleteAccountClick: () => void`

### NavLinks

- **Opis**: Grupa linków nawigacyjnych do głównych sekcji aplikacji.
- **Główne elementy**: `NavLink` x3
- **Obsługiwane interakcje**: Kliknięcie linków
- **Obsługiwana walidacja**: Brak
- **Typy**: `NavLinksProps`
- **Propsy**:
  - `currentPath: string`
  - `orientation?: "horizontal" | "vertical"` (domyślnie "horizontal")

### NavLink

- **Opis**: Pojedynczy link nawigacyjny z podświetleniem gdy jest aktywny.
- **Główne elementy**: `<a>` z odpowiednimi klasami Tailwind
- **Obsługiwane interakcje**: Kliknięcie (nawigacja)
- **Obsługiwana walidacja**: Brak
- **Typy**: `NavLinkProps`
- **Propsy**:
  - `href: string`
  - `label: string`
  - `isActive: boolean`

### AccountDropdown

- **Opis**: Dropdown menu z opcjami konta użytkownika (email, wyloguj, usuń konto). Wykorzystuje Shadcn/ui `DropdownMenu`.
- **Główne elementy**: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`
- **Obsługiwane interakcje**: 
  - Kliknięcie triggera (otwarcie dropdown)
  - Kliknięcie "Wyloguj" (wywołanie `onLogout`)
  - Kliknięcie "Usuń konto" (wywołanie `onDeleteAccountClick`)
- **Obsługiwana walidacja**: Brak
- **Typy**: `AccountDropdownProps`
- **Propsy**:
  - `userEmail: string`
  - `onLogout: () => void`
  - `onDeleteAccountClick: () => void`

### MobileNav

- **Opis**: Nawigacja mobilna z hamburger menu. Wykorzystuje Shadcn/ui `Sheet`.
- **Główne elementy**: `MobileNavHeader`, `Sheet`, `SheetContent`
- **Obsługiwane interakcje**: 
  - Kliknięcie hamburger button (otwarcie sheet)
  - Kliknięcie linków nawigacyjnych (nawigacja + zamknięcie sheet)
  - Kliknięcie "Wyloguj" (wywołanie `onLogout`)
  - Kliknięcie "Usuń konto" (wywołanie `onDeleteAccountClick`)
- **Obsługiwana walidacja**: Brak
- **Typy**: `MobileNavProps`
- **Propsy**:
  - `userEmail: string`
  - `currentPath: string`
  - `onLogout: () => void`
  - `onDeleteAccountClick: () => void`

### MobileNavHeader

- **Opis**: Nagłówek mobilnej nawigacji z logo i przyciskiem hamburger.
- **Główne elementy**: `<header>`, `<a>` (logo), `Button` (hamburger icon)
- **Obsługiwane interakcje**: 
  - Kliknięcie logo (nawigacja do `/generator`)
  - Kliknięcie hamburger button (otwarcie menu)
- **Obsługiwana walidacja**: Brak
- **Typy**: `MobileNavHeaderProps`
- **Propsy**:
  - `onMenuToggle: () => void`
  - `isMenuOpen: boolean`

### DeleteAccountDialog

- **Opis**: Modal AlertDialog do potwierdzenia nieodwracalnej operacji usunięcia konta. Wymaga wpisania słowa "USUŃ" aby aktywować przycisk potwierdzający.
- **Główne elementy**: `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `Input`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction`
- **Obsługiwane interakcje**:
  - Wpisywanie tekstu w input
  - Kliknięcie "Anuluj" (zamknięcie dialogu)
  - Kliknięcie "Usuń konto" (wywołanie API + przekierowanie)
- **Obsługiwana walidacja**:
  - Przycisk "Usuń konto" jest `disabled` dopóki wartość inputa nie jest dokładnie równa "USUŃ"
- **Typy**: `DeleteAccountDialogProps`
- **Propsy**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onConfirm: () => Promise<void>`
  - `isLoading: boolean`

## 5. Typy

### UserInfo

```typescript
interface UserInfo {
  email: string;
}
```

### NavigationProps

```typescript
interface NavigationProps {
  userEmail: string;
  currentPath: string;
}
```

### TopNavProps

```typescript
interface TopNavProps {
  userEmail: string;
  currentPath: string;
  onLogout: () => void;
  onDeleteAccountClick: () => void;
}
```

### NavLinksProps

```typescript
interface NavLinksProps {
  currentPath: string;
  orientation?: "horizontal" | "vertical";
  onLinkClick?: () => void; // opcjonalne - używane w mobile do zamknięcia sheet
}
```

### NavLinkProps

```typescript
interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}
```

### AccountDropdownProps

```typescript
interface AccountDropdownProps {
  userEmail: string;
  onLogout: () => void;
  onDeleteAccountClick: () => void;
}
```

### MobileNavProps

```typescript
interface MobileNavProps {
  userEmail: string;
  currentPath: string;
  onLogout: () => void;
  onDeleteAccountClick: () => void;
}
```

### MobileNavHeaderProps

```typescript
interface MobileNavHeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}
```

### DeleteAccountDialogProps

```typescript
interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}
```

### NavItem (typ pomocniczy)

```typescript
interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/generator", label: "Generator" },
  { href: "/flashcards", label: "Moje Fiszki" },
  { href: "/study", label: "Nauka" },
];
```

## 6. Zarządzanie stanem

### Stan lokalny w komponencie Navigation

```typescript
// Stan dialogu usunięcia konta
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

// Stan mobilnego menu (sheet)
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
```

### Niestandardowy hook: useNavigation

Hook `useNavigation` enkapsuluje logikę wylogowania i usunięcia konta:

```typescript
interface UseNavigationResult {
  isLoggingOut: boolean;
  isDeleting: boolean;
  isDeleteDialogOpen: boolean;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  handleLogout: () => Promise<void>;
  handleDeleteAccount: () => Promise<void>;
}

function useNavigation(): UseNavigationResult {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await authenticatedFetch("/api/auth/logout", {
        method: "POST",
      });
      
      if (response.ok) {
        clearAuthToken();
        window.location.href = "/login";
      } else {
        toast.error("Nie udało się wylogować. Spróbuj ponownie.");
      }
    } catch {
      toast.error("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await authenticatedFetch("/api/auth/account", {
        method: "DELETE",
      });
      
      if (response.ok) {
        clearAuthToken();
        window.location.href = "/";
      } else {
        const data = await response.json();
        toast.error(data.error || "Nie udało się usunąć konta.");
      }
    } catch {
      toast.error("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return {
    isLoggingOut,
    isDeleting,
    isDeleteDialogOpen,
    openDeleteDialog: () => setIsDeleteDialogOpen(true),
    closeDeleteDialog: () => setIsDeleteDialogOpen(false),
    handleLogout,
    handleDeleteAccount,
  };
}
```

## 7. Integracja API

### POST /api/auth/logout

- **Cel**: Wylogowanie użytkownika
- **Metoda**: POST
- **Nagłówki**: `Authorization: Bearer <access_token>`
- **Typ żądania**: Brak body
- **Typ odpowiedzi**: `MessageResponseDTO`
  ```typescript
  interface MessageResponseDTO {
    message: string;
  }
  ```
- **Kody odpowiedzi**:
  - `200 OK`: Pomyślne wylogowanie
  - `401 Unauthorized`: Brak ważnej sesji

### DELETE /api/auth/account

- **Cel**: Trwałe usunięcie konta użytkownika i wszystkich powiązanych danych
- **Metoda**: DELETE
- **Nagłówki**: `Authorization: Bearer <access_token>`
- **Typ żądania**: Brak body
- **Typ odpowiedzi**: `MessageResponseDTO`
  ```typescript
  interface MessageResponseDTO {
    message: string;
  }
  ```
- **Kody odpowiedzi**:
  - `200 OK`: Pomyślne usunięcie konta
  - `401 Unauthorized`: Użytkownik nie jest zalogowany

## 8. Interakcje użytkownika

### Nawigacja między sekcjami

1. Użytkownik klika link w nawigacji (Generator/Moje Fiszki/Nauka)
2. Przeglądarka nawiguje do odpowiedniej ścieżki
3. Aktywny link jest podświetlony (wizualne wskazanie bieżącej lokalizacji)

### Wylogowanie

1. Użytkownik klika dropdown menu konta (desktop) lub rozwija hamburger menu (mobile)
2. Użytkownik klika "Wyloguj"
3. System wysyła żądanie POST do `/api/auth/logout`
4. Token autoryzacji jest usuwany z localStorage
5. Użytkownik jest przekierowywany do `/login`

### Usunięcie konta

1. Użytkownik klika dropdown menu konta (desktop) lub rozwija hamburger menu (mobile)
2. Użytkownik klika "Usuń konto" (opcja oznaczona jako destructive)
3. Otwiera się AlertDialog z ostrzeżeniem o nieodwracalności
4. Użytkownik musi wpisać dokładnie słowo "USUŃ" w polu tekstowym
5. Przycisk "Usuń konto" staje się aktywny po wpisaniu poprawnego słowa
6. Użytkownik klika "Usuń konto"
7. System wysyła żądanie DELETE do `/api/auth/account`
8. Token autoryzacji jest usuwany z localStorage
9. Użytkownik jest przekierowywany do landing page (`/`)

### Nawigacja mobilna

1. Użytkownik klika ikonę hamburger menu
2. Otwiera się Sheet z linkami i opcjami konta
3. Użytkownik klika dowolny link lub opcję
4. Dla linków: nawigacja + automatyczne zamknięcie Sheet
5. Dla akcji (wyloguj/usuń): wykonanie akcji + zamknięcie Sheet

## 9. Warunki i walidacja

### Walidacja wpisania słowa "USUŃ" w DeleteAccountDialog

- **Komponent**: `DeleteAccountDialog`
- **Warunek**: Wartość pola input musi być dokładnie równa `"USUŃ"` (case-sensitive)
- **Wpływ na stan interfejsu**:
  - Gdy warunek nie jest spełniony: przycisk "Usuń konto" ma atrybut `disabled`
  - Gdy warunek jest spełniony: przycisk "Usuń konto" jest aktywny
- **Implementacja**:
  ```typescript
  const [confirmText, setConfirmText] = useState("");
  const isConfirmValid = confirmText === "USUŃ";
  
  // W JSX:
  <AlertDialogAction 
    disabled={!isConfirmValid || isLoading}
    onClick={onConfirm}
  >
    {isLoading ? "Usuwanie..." : "Usuń konto"}
  </AlertDialogAction>
  ```

### Walidacja sesji użytkownika

- **Komponent**: Wszystkie endpointy API (`/api/auth/logout`, `/api/auth/account`)
- **Warunek**: Token autoryzacji w nagłówku `Authorization` musi być ważny
- **Wpływ na stan interfejsu**:
  - Gdy sesja wygasła (401 Unauthorized): wyświetlenie komunikatu błędu i ewentualne przekierowanie do `/login`

## 10. Obsługa błędów

### Błąd wylogowania

- **Scenariusz**: Żądanie POST `/api/auth/logout` zwraca błąd
- **Obsługa**: 
  - Wyświetlenie toast z komunikatem "Nie udało się wylogować. Spróbuj ponownie."
  - Użytkownik pozostaje zalogowany
  - Możliwość ponownej próby

### Błąd usunięcia konta

- **Scenariusz**: Żądanie DELETE `/api/auth/account` zwraca błąd
- **Obsługa**:
  - Wyświetlenie toast z komunikatem błędu z API lub domyślnym "Nie udało się usunąć konta."
  - Dialog pozostaje otwarty
  - Użytkownik może anulować lub spróbować ponownie

### Błąd 401 Unauthorized

- **Scenariusz**: Sesja użytkownika wygasła podczas próby akcji
- **Obsługa**:
  - Usunięcie tokena z localStorage
  - Wyświetlenie toast z informacją o wygaśnięciu sesji
  - Przekierowanie do `/login`

### Błąd sieci

- **Scenariusz**: Brak połączenia z serwerem
- **Obsługa**:
  - Wyświetlenie toast z komunikatem "Błąd połączenia. Spróbuj ponownie."
  - Stan ładowania jest resetowany
  - Użytkownik może spróbować ponownie

## 11. Kroki implementacji

1. **Instalacja brakujących komponentów Shadcn/ui**
   - Zainstalować `DropdownMenu`: `npx shadcn@latest add dropdown-menu`
   - Zainstalować `Sheet`: `npx shadcn@latest add sheet`
   - Zainstalować `Separator`: `npx shadcn@latest add separator`

2. **Utworzenie struktury plików**
   ```
   src/
   ├── components/
   │   └── navigation/
   │       ├── index.ts
   │       ├── Navigation.tsx
   │       ├── TopNav.tsx
   │       ├── NavLinks.tsx
   │       ├── NavLink.tsx
   │       ├── AccountDropdown.tsx
   │       ├── MobileNav.tsx
   │       ├── MobileNavHeader.tsx
   │       └── DeleteAccountDialog.tsx
   └── lib/
       └── hooks/
           └── useNavigation.ts
   ```

3. **Implementacja hooka useNavigation**
   - Utworzyć plik `src/lib/hooks/useNavigation.ts`
   - Zaimplementować logikę wylogowania i usunięcia konta
   - Wykorzystać istniejące funkcje z `src/lib/auth.client.ts`

4. **Implementacja komponentów atomowych**
   - `NavLink` - pojedynczy link z obsługą aktywnego stanu
   - `NavLinks` - grupa linków z konfiguracją orientacji
   - `DeleteAccountDialog` - dialog potwierdzający z walidacją inputa

5. **Implementacja AccountDropdown**
   - Wykorzystać `DropdownMenu` z Shadcn/ui
   - Wyświetlić email użytkownika i opcje
   - Podłączyć handlery `onLogout` i `onDeleteAccountClick`

6. **Implementacja MobileNavHeader i MobileNav**
   - Utworzyć nagłówek z logo i hamburger button
   - Wykorzystać `Sheet` z Shadcn/ui dla mobilnego menu
   - Zaimplementować zamykanie menu po kliknięciu linku

7. **Implementacja TopNav**
   - Połączyć logo, `NavLinks` i `AccountDropdown`
   - Dodać responsywne klasy (ukrycie na mobile)

8. **Implementacja głównego komponentu Navigation**
   - Połączyć `TopNav`, `MobileNav` i `DeleteAccountDialog`
   - Zintegrować hook `useNavigation`
   - Zarządzać stanem mobilnego menu

9. **Utworzenie AuthenticatedLayout.astro**
   - Utworzyć nowy layout dla stron chronionych
   - Osadzić komponent `Navigation` z `client:load`
   - Przekazać email użytkownika i bieżącą ścieżkę

10. **Aktualizacja stron chronionych**
    - Zmienić import layoutu w `/generator`, `/flashcards`, `/study`
    - Użyć `AuthenticatedLayout` zamiast podstawowego `Layout`

11. **Implementacja przekazywania danych użytkownika**
    - Pobrać email użytkownika z sesji w Astro (middleware lub strona)
    - Przekazać jako prop do komponentu `Navigation`

12. **Testy manualne**
    - Przetestować nawigację desktop i mobile
    - Przetestować wylogowanie
    - Przetestować usunięcie konta z walidacją
    - Przetestować obsługę błędów

13. **Dostępność (a11y)**
    - Dodać atrybuty `aria-current="page"` dla aktywnego linku
    - Dodać `aria-label` dla hamburger button
    - Dodać `aria-expanded` i `aria-controls` dla hamburger menu
    - Zapewnić nawigację klawiaturą (Tab, Enter, Space, Escape)
    - Dodać skip link "Przejdź do treści głównej"
