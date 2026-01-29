import type { FlashcardListItemDTO } from "@/types";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { FlashcardsTable } from "./FlashcardsTable";
import { FlashcardCardList } from "./FlashcardCardList";

interface FlashcardsContentProps {
  flashcards: FlashcardListItemDTO[];
  isLoading: boolean;
  hasSearchQuery: boolean;
  onFlashcardClick: (flashcard: FlashcardListItemDTO) => void;
  onClearSearch: () => void;
  onAddClick: () => void;
}

export function FlashcardsContent({
  flashcards,
  isLoading,
  hasSearchQuery,
  onFlashcardClick,
  onClearSearch,
  onAddClick,
}: FlashcardsContentProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (flashcards.length === 0) {
    return <EmptyState hasSearchQuery={hasSearchQuery} onClearSearch={onClearSearch} onAddClick={onAddClick} />;
  }

  return (
    <>
      <FlashcardsTable flashcards={flashcards} onFlashcardClick={onFlashcardClick} />
      <FlashcardCardList flashcards={flashcards} onFlashcardClick={onFlashcardClick} />
    </>
  );
}
