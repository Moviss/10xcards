import { useCallback } from "react";
import type { FlashcardListItemDTO } from "@/types";
import { FlashcardCard } from "./FlashcardCard";

interface FlashcardCardListProps {
  flashcards: FlashcardListItemDTO[];
  onFlashcardClick: (flashcard: FlashcardListItemDTO) => void;
}

export function FlashcardCardList({ flashcards, onFlashcardClick }: FlashcardCardListProps) {
  const handleCardClick = useCallback(
    (flashcard: FlashcardListItemDTO) => {
      onFlashcardClick(flashcard);
    },
    [onFlashcardClick]
  );

  return (
    <div className="md:hidden space-y-4">
      {flashcards.map((flashcard) => (
        <FlashcardCard
          key={flashcard.id}
          flashcard={flashcard}
          onClick={() => handleCardClick(flashcard)}
        />
      ))}
    </div>
  );
}
