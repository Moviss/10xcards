import { FileQuestion, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  hasSearchQuery: boolean;
  onClearSearch: () => void;
  onAddClick: () => void;
}

export function EmptyState({ hasSearchQuery, onClearSearch, onAddClick }: EmptyStateProps) {
  if (hasSearchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium mb-2">Brak wyników wyszukiwania</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Nie znaleziono fiszek pasujących do podanego zapytania. Spróbuj zmienić kryteria wyszukiwania.
        </p>
        <Button variant="outline" onClick={onClearSearch}>
          Wyczyść filtr
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
      <h3 className="text-lg font-medium mb-2">Nie masz jeszcze żadnych fiszek</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Zacznij od wygenerowania fiszek z tekstu za pomocą AI lub dodaj pierwszą fiszkę ręcznie.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild>
          <a href="/generator">
            <Sparkles className="mr-2 h-4 w-4" />
            Wygeneruj fiszki z AI
          </a>
        </Button>
        <Button variant="outline" onClick={onAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj fiszkę ręcznie
        </Button>
      </div>
    </div>
  );
}
