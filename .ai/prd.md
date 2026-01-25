# Dokument wymagań produktu (PRD) - 10xCards

## 1. Przegląd produktu

Projekt 10xCards to aplikacja webowa typu MVP (Minimum Viable Product), której celem jest zautomatyzowanie procesu tworzenia fiszek edukacyjnych przy użyciu sztucznej inteligencji. Produkt adresuje główną barierę w stosowaniu metody powtórek w odstępach czasu (spaced repetition) – czasochłonność manualnego przygotowywania materiałów. Aplikacja wykorzystuje model GPT-4o-mini do generowania par pytanie-odpowiedź z tekstu dostarczonego przez użytkownika, a następnie zarządza procesem nauki w oparciu o sprawdzony algorytm SM-2. System opiera się na architekturze Supabase i oferuje uproszczony, binarny system oceniania postępów nauki.

## 2. Problem użytkownika

Użytkownicy chcący uczyć się efektywnie rezygnują z fiszek, ponieważ proces ich ręcznego tworzenia jest żmudny i nudny. Obecne rozwiązania wymagają od użytkownika samodzielnego redagowania treści, co odciąga go od samej nauki. Brak prostego narzędzia, które szybko przekształca surowy tekst (np. artykuł lub notatki) w gotowy do nauki zestaw, sprawia, że metoda spaced repetition jest porzucana na rzecz mniej efektywnych metod pasywnych.

## 3. Wymagania funkcjonalne

### 3.1. Moduł uwierzytelniania i kont

* System logowania i rejestracji oparty na e-mailu i haśle (Supabase Auth).
* Prywatność danych: użytkownik ma dostęp wyłącznie do swoich fiszek (zabezpieczenia RLS).
* Możliwość usunięcia konta i powiązanych fiszek na żądanie.

### 3.2. Generator fiszek AI

* Obsługa tekstu wejściowego o długości od 1000 do 10000 znaków.
* Integracja z modelem GPT-4o-mini.
* Staging Area: synchroniczne wyświetlanie wygenerowanych propozycji przed zapisem w bazie.
* Brak formatowania Markdown – czysty tekst w formacie Przód/Tył.

### 3.3. Moduł recenzji i zarządzania (CRUD)

* Możliwość akceptacji, edycji lub odrzucenia propozycji AI w obszarze staging.
* Masowe dodawanie zaakceptowanych propozycji do bazy danych.
* Manualne tworzenie pojedynczych fiszek (Przód/Tył) i wyświetlanie w ramach widoku listy "Mojej fiszki".
* Widok listy wszystkich fiszek z wyszukiwarką tekstową i paginacją.
* Możliwość edycji i usuwania istniejących fiszek przez interfejs modalny.

### 3.4. Moduł nauki (Spaced Repetition)

* Implementacja algorytmu SM-2 do planowania powtórek.
* Sesje nauki ograniczone do maksymalnie 20 nowych fiszek na sesję (plus powtórki).
* Binarny system oceniania: Pamiętam / Nie pamiętam.
* Responsywny interfejs (RWD) zoptymalizowany pod naukę na telefonie.
* Funkcja resetowania postępów nauki dla wybranych fiszek lub całej bazy.
* Brak dodatkowych metadanych i zaawansowanych funkcji powiadomień w MVP.

### 3.5. Analityka i logowanie

* Tabela generation_logs do śledzenia statystyk generowania (liczba propozycji vs liczba akceptacji).
* Flaga is_ai_generated dla każdej fiszki w celu monitorowania źródła danych.

## 4. Granice produktu

### 4.1. Co nie wchodzi w zakres MVP

* Obsługa formatów plików (PDF, DOCX, obrazy).
* Zaawansowane algorytmy (SuperMemo 17+, Anki FSRS).
* System tagów, folderów i kategoryzacji – obowiązuje płaska struktura.
* Współdzielenie talii między użytkownikami.
* Natywne aplikacje mobilne (dostęp tylko przez przeglądarkę).
* Formatowanie tekstu (pogrubienia, listy, wzory matematyczne).

### 4.2. Ograniczenia techniczne

* Model dostępu: zamknięta beta (dostęp dla osób z linkiem, brak otwartej promocji).
* Brak sprawdzania duplikatów przy dodawaniu nowych fiszek.
* Brak trybu offline.

## 5. Historyjki użytkowników

ID: US-001
Tytuł: Rejestracja i logowanie użytkownika
Opis: Jako nowy użytkownik chcę założyć konto przy użyciu adresu e-mail i hasła, aby moje fiszki były bezpiecznie przechowywane i dostępne tylko dla mnie.
Kryteria akceptacji:

* Użytkownik może utworzyć konto za pomocą unikalnego adresu e-mail.
* Użytkownik może zalogować się do istniejącego konta.
* Błędne dane logowania wyświetlają czytelny komunikat o błędzie.
* Sesja użytkownika jest zachowywana przy odświeżeniu strony (Supabase Auth).

ID: US-002
Tytuł: Generowanie fiszek z tekstu
Opis: Jako użytkownik chcę wkleić fragment tekstu, aby AI automatycznie przygotowało dla mnie propozycje pytań i odpowiedzi.
Kryteria akceptacji:

* Formularz akceptuje tekst o długości od 1000 do 10000 znaków.
* Próba wysłania tekstu krótszego lub dłuższego blokuje przycisk generowania lub wyświetla błąd.
* Podczas generowania wyświetlany jest stan ładowania (loading state).
* Po kliknięciu przycisku generowania aplikacja komunikuje się z API modelu LLM i wyświetla listę wygenerowanych propozycji fiszek do akceptacji przez użytkownika.
* Wyniki pojawiają się w Staging Area (pod formularzem) (nie są jeszcze zapisane w tabeli flashcards).
* W przypadku problemów z API lub braku odpowiedzi modelu użytkownik zobaczy stosowny komunikat o błędzie.

ID: US-003
Tytuł: Recenzja propozycji AI (Staging Area)
Opis: Jako użytkownik chcę przejrzeć wygenerowane fiszki przed ich zapisaniem, aby wyeliminować błędy lub niepotrzebne informacje.
Kryteria akceptacji:

* Każda propozycja ma przyciski: Akceptuj, Edytuj, Odrzuć.
* Użytkownik może edytować treść pytania lub odpowiedzi wewnątrz listy propozycji Za pomocą dedykowanego, otwieranego modalu.
* Użytkownik może użyć przycisku Zapisz, co spowoduje zapisanie wszystkich zaakceptowanych fiszek, natomiast te, które zostaną oznaczone jako odrzuć, nie zostaną zapisane w bazie.
* Dane w Staging Area są przechowywane w localStorage, aby zapobiec ich utracie po odświeżeniu strony przed zapisem.

ID: US-004
Tytuł: Manualne dodawanie fiszek
Opis: Jako użytkownik chcę mieć możliwość ręcznego dodania fiszki, gdy mam konkretną informację, której nie ma w tekście źródłowym.
Kryteria akceptacji:

* Dostępny jest prosty formularz z dwoma polami: Przód i Tył.
* Pola nie mogą być puste.
* Po zapisaniu fiszka trafia do ogólnej listy użytkownika z flagą is_ai_generated ustawioną na false.

ID: US-005
Tytuł: Zarządzanie listą fiszek (CRUD)
Opis: Jako użytkownik chcę widzieć listę wszystkich swoich fiszek, aby móc je przeszukiwać, poprawiać lub usuwać te nieaktualne.
Kryteria akceptacji:

* Wyświetlana jest lista wszystkich fiszek należących do zalogowanego użytkownika.
* Wyszukiwarka filtruje listę w czasie rzeczywistym po treści pytania i odpowiedzi.
* Edycja fiszki odbywa się w modalu i aktualizuje rekord w bazie Supabase.
* Usunięcie fiszki wymaga potwierdzenia i trwale usuwa rekord z bazy.

ID: US-006
Tytuł: Sesja nauki z algorytmem SM-2
Opis: Jako użytkownik chcę przeprowadzić sesję nauki, aby powtórzyć materiał w optymalnym momencie zgodnie z algorytmem.
Kryteria akceptacji:

* W widoku "Sesja nauki" algorytm przygotowuje dla mnie sesję nauki Fiszek.
* Sesja pokazuje tylko fiszki, które są zaplanowane do powtórzenia.
* Na start wyświetlany jest przód fiszki, poprzez interakcję użytkownik wyświetla jej tył.
* Użytkownik ocenia swoją wiedzę binarnie: Pamiętam lub Nie pamiętam.
* Wybór oceny aktualizuje parametry algorytmu SM-2 (interval, ease factor, repetition) w bazie danych.
* Kolejna fiszka ładuje się automatycznie po dokonaniu oceny poprzedniej.

ID: US-007
Tytuł: Limit nowych fiszek w sesji
Opis: Jako użytkownik chcę, aby system nie przytłaczał mnie zbyt dużą ilością nowej wiedzy w jednym dniu.
Kryteria akceptacji:

* System ogranicza liczbę nowych fiszek (takich, które nigdy nie były powtarzane) do 20 na jedną sesję.
* Jeśli użytkownik ma więcej zaplanowanych powtórek (starych kart), są one dodawane do kolejki sesji ponad limit nowych kart.
* Po zakończeniu wszystkich kart na dany dzień wyświetlane jest podsumowanie sesji.

ID: US-008
Tytuł: Resetowanie postępów nauki
Opis: Jako użytkownik chcę mieć możliwość zresetowania historii nauki dla danej fiszki, jeśli czuję, że muszę zacząć proces jej zapamiętywania od nowa.
Kryteria akceptacji:

* W widoku edycji lub listy dostępna jest opcja Resetuj postęp.
* Po potwierdzeniu, parametry SM-2 dla danej fiszki wracają do wartości początkowych.

ID: US-009
Tytuł: Logowanie skuteczności generowania
Opis: Jako system chcę zapisywać dane o procesie generowania, aby mierzyć realizację celów biznesowych.
Kryteria akceptacji:

* Każda sesja generowania tworzy wpis w tabeli generation_logs.
* Zapisywana jest liczba wygenerowanych propozycji oraz liczba propozycji ostatecznie zapisanych przez użytkownika bez zmian.
* Zapisywany jest identyfikator użytkownika i timestamp.

## 6. Metryki sukcesu

### 6.1. Wskaźnik akceptacji AI (AI Acceptance Rate)

* Definicja: Procent fiszek wygenerowanych przez AI, które użytkownik dodaje do swojej bazy bez wprowadzania żadnych edycji.
* Cel: Minimum 75%.
* Pomiar: Porównanie danych z tabeli generation_logs z rekordami w tabeli flashcards (is_ai_generated = true oraz brak zmian w treści).

### 6.2. Wskaźnik adopcji AI (AI Adoption Rate)

* Definicja: Udział fiszek pochodzących z generatora AI w stosunku do wszystkich fiszek w systemie.
* Cel: Minimum 75% wszystkich fiszek w bazie danych powinno posiadać flagę is_ai_generated = true.
* Pomiar: Prosty raport SQL z bazy danych Supabase zliczający stosunek fiszek AI do manualnych.
