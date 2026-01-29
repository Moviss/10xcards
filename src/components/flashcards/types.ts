import type { FlashcardListItemDTO, PaginationDTO } from "@/types";

/**
 * Sort field options for flashcards list
 */
export type FlashcardsSortField = "created_at" | "updated_at" | "next_review_date";

/**
 * Sort order options
 */
export type SortOrder = "asc" | "desc";

/**
 * UI state for flashcards view
 */
export interface FlashcardsViewState {
  // Data
  flashcards: FlashcardListItemDTO[];
  pagination: PaginationDTO | null;

  // Filters and sorting
  searchQuery: string;
  sortField: FlashcardsSortField;
  sortOrder: SortOrder;
  currentPage: number;

  // Loading states
  isLoading: boolean;

  // Errors
  error: string | null;

  // Modal states
  editModalFlashcard: FlashcardListItemDTO | null;
  isEditModalOpen: boolean;
  isAddModalOpen: boolean;

  // Operation states
  isSaving: boolean;
  isDeleting: boolean;
  isResettingProgress: boolean;
}

/**
 * Form validation errors for flashcard modals
 */
export interface FlashcardFormErrors {
  front?: string;
  back?: string;
  general?: string;
}

/**
 * Form state for flashcard modal
 */
export interface FlashcardFormState {
  front: string;
  back: string;
  touched: {
    front: boolean;
    back: boolean;
  };
  errors: FlashcardFormErrors;
}

/**
 * Configuration constants for flashcards view
 */
export const FLASHCARDS_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  SEARCH_DEBOUNCE_MS: 300,
  MAX_PREVIEW_LENGTH: 100,
  DEFAULT_SORT_FIELD: "created_at" as FlashcardsSortField,
  DEFAULT_SORT_ORDER: "desc" as SortOrder,
} as const;
