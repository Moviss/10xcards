import { useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FlashcardsSortField, SortOrder } from "./types";

interface SortSelectProps {
  sort: FlashcardsSortField;
  order: SortOrder;
  onSortChange: (sort: FlashcardsSortField, order: SortOrder) => void;
}

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Najnowsze" },
  { value: "created_at:asc", label: "Najstarsze" },
  { value: "updated_at:desc", label: "Ostatnio zmienione" },
  { value: "next_review_date:asc", label: "Do powtórki (najbliższe)" },
  { value: "next_review_date:desc", label: "Do powtórki (najdalsze)" },
] as const;

export function SortSelect({ sort, order, onSortChange }: SortSelectProps) {
  const currentValue = `${sort}:${order}`;

  const handleValueChange = useCallback(
    (value: string) => {
      const [newSort, newOrder] = value.split(":") as [FlashcardsSortField, SortOrder];
      onSortChange(newSort, newOrder);
    },
    [onSortChange]
  );

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[200px]" aria-label="Sortowanie">
        <SelectValue placeholder="Sortuj według..." />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
