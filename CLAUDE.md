# AI Rules for 10xcards

Projekt 10xCards to aplikacja webowa typu MVP (Minimum Viable Product), której celem jest zautomatyzowanie procesu tworzenia fiszek edukacyjnych przy użyciu sztucznej inteligencji. Produkt adresuje główną barierę w stosowaniu metody powtórek w odstępach czasu (spaced repetition) – czasochłonność manualnego przygotowywania materiałów. Aplikacja wykorzystuje model GPT-4o-mini do generowania par pytanie-odpowiedź z tekstu dostarczonego przez użytkownika, a następnie zarządza procesem nauki w oparciu o sprawdzony algorytm SM-2. System opiera się na architekturze Supabase i oferuje uproszczony, binarny system oceniania postępów nauki.

## Tech Stack

- Astro 5
- TypeScript 5
- React 19
- Tailwind 4

## Project Structure

When introducing changes to the project, always follow the directory structure below:

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/components` - client-side components written in Astro (static) and React (dynamic)
- `./src/assets` - static internal assets
- `./public` - public assets

When modifying the directory structure, always update this section.

## Coding practices

### Guidelines for clean code

- Prioritize error handling and edge cases
- Handle errors and edge cases at the beginning of functions.
- Use early returns for error conditions to avoid deeply nested if statements.
- Place the happy path last in the function for improved readability.
- Avoid unnecessary else statements; use if-return pattern instead.
- Use guard clauses to handle preconditions and invalid states early.
- Implement proper error logging and user-friendly error messages.
- Consider using custom error types or error factories for consistent error handling.
