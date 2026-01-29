import { useCallback } from "react";
import type { FlashcardListItemDTO } from "@/types";
import { FlashcardTableRow } from "./FlashcardTableRow";

interface FlashcardsTableProps {
  flashcards: FlashcardListItemDTO[];
  onFlashcardClick: (flashcard: FlashcardListItemDTO) => void;
}

export function FlashcardsTable({ flashcards, onFlashcardClick }: FlashcardsTableProps) {
  const handleRowClick = useCallback(
    (flashcard: FlashcardListItemDTO) => {
      onFlashcardClick(flashcard);
    },
    [onFlashcardClick]
  );

  return (
    <div className="hidden md:block border rounded-lg overflow-hidden">
      <table className="w-full" role="grid">
        <thead className="bg-muted/50">
          <tr>
            <th scope="col" className="text-left py-3 px-4 font-medium text-sm">
              Przód
            </th>
            <th scope="col" className="text-left py-3 px-4 font-medium text-sm">
              Tył
            </th>
            <th scope="col" className="text-left py-3 px-4 font-medium text-sm w-[100px]">
              Źródło
            </th>
          </tr>
        </thead>
        <tbody>
          {flashcards.map((flashcard) => (
            <FlashcardTableRow
              key={flashcard.id}
              flashcard={flashcard}
              onClick={() => handleRowClick(flashcard)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
