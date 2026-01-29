import { useCallback } from "react";
import { Sparkles } from "lucide-react";
import type { FlashcardListItemDTO } from "@/types";
import { FLASHCARDS_CONFIG } from "./types";

interface FlashcardTableRowProps {
  flashcard: FlashcardListItemDTO;
  onClick: () => void;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function FlashcardTableRow({ flashcard, onClick }: FlashcardTableRowProps) {
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
    <tr
      className="border-b transition-colors hover:bg-muted/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Edytuj fiszkę: ${truncateText(flashcard.front, 50)}`}
    >
      <td className="py-4 px-4">
        <span className="line-clamp-2">
          {truncateText(flashcard.front, FLASHCARDS_CONFIG.MAX_PREVIEW_LENGTH)}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className="line-clamp-2">
          {truncateText(flashcard.back, FLASHCARDS_CONFIG.MAX_PREVIEW_LENGTH)}
        </span>
      </td>
      <td className="py-4 px-4">
        {flashcard.is_ai_generated && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            AI
          </span>
        )}
      </td>
    </tr>
  );
}
