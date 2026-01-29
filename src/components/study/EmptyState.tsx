import { CheckCircle, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmptyStateProps } from "./types";

export function EmptyState({ hasAnyFlashcards }: EmptyStateProps) {
  if (hasAnyFlashcards) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium mb-2">Wszystko powtórzone!</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Świetna robota! Nie masz już fiszek do powtórki na dziś. Wróć później lub wygeneruj nowe fiszki.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <a href="/generator">
              <Sparkles className="mr-2 h-4 w-4" />
              Wygeneruj nowe fiszki
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/flashcards">
              <BookOpen className="mr-2 h-4 w-4" />
              Przeglądaj fiszki
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <BookOpen className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
      <h3 className="text-lg font-medium mb-2">Brak fiszek do nauki</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Nie masz jeszcze żadnych fiszek. Zacznij od wygenerowania fiszek z tekstu za pomocą AI.
      </p>
      <Button asChild>
        <a href="/generator">
          <Sparkles className="mr-2 h-4 w-4" />
          Wygeneruj fiszki z AI
        </a>
      </Button>
    </div>
  );
}
