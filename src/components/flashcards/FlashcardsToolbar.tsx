import { SearchInput } from "./SearchInput";
import { SortSelect } from "./SortSelect";
import type { FlashcardsSortField, SortOrder } from "./types";

interface FlashcardsToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortValue: FlashcardsSortField;
  sortOrder: SortOrder;
  onSortChange: (sort: FlashcardsSortField, order: SortOrder) => void;
}

export function FlashcardsToolbar({
  searchValue,
  onSearchChange,
  sortValue,
  sortOrder,
  onSortChange,
}: FlashcardsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <SearchInput value={searchValue} onChange={onSearchChange} />
      <SortSelect sort={sortValue} order={sortOrder} onSortChange={onSortChange} />
    </div>
  );
}
