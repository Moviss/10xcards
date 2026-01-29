import { useCallback } from "react";
import { Sparkles } from "lucide-react";
import type { FlashcardListItemDTO } from "@/types";
import { FLASHCARDS_CONFIG } from "./types";

interface FlashcardCardProps {
  flashcard: FlashcardListItemDTO;
  onClick: () => void;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function FlashcardCard({ flashcard, onClick }: FlashcardCardProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <article
      className="p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Edytuj fiszkę: ${truncateText(flashcard.front, 50)}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase">Przód</span>
        {flashcard.is_ai_generated && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            AI
          </span>
        )}
      </div>
      <p className="line-clamp-2 mb-3">
        {truncateText(flashcard.front, FLASHCARDS_CONFIG.MAX_PREVIEW_LENGTH)}
      </p>
      <div className="pt-3 border-t">
        <span className="text-xs font-medium text-muted-foreground uppercase block mb-1">Tył</span>
        <p className="line-clamp-2 text-muted-foreground">
          {truncateText(flashcard.back, FLASHCARDS_CONFIG.MAX_PREVIEW_LENGTH)}
        </p>
      </div>
    </article>
  );
}
