import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type {
  FlashcardListItemDTO,
  FlashcardsListResponseDTO,
  FlashcardsQueryParams,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  PaginationDTO,
  FlashcardCreateResponseDTO,
  FlashcardUpdateResponseDTO,
  FlashcardResetProgressResponseDTO,
  MessageResponseDTO,
} from "@/types";
import type { FlashcardsSortField, SortOrder } from "@/components/flashcards/types";
import { FLASHCARDS_CONFIG } from "@/components/flashcards/types";
import { authenticatedFetch } from "@/lib/auth.client";

export interface UseFlashcardsReturn {
  // Data
  flashcards: FlashcardListItemDTO[];
  pagination: PaginationDTO | null;

  // Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortField: FlashcardsSortField;
  sortOrder: SortOrder;
  setSorting: (field: FlashcardsSortField, order: SortOrder) => void;

  // Pagination
  currentPage: number;
  goToPage: (page: number) => void;

  // States
  isLoading: boolean;
  error: string | null;

  // Edit modal
  editingFlashcard: FlashcardListItemDTO | null;
  isEditModalOpen: boolean;
  openEditModal: (flashcard: FlashcardListItemDTO) => void;
  closeEditModal: () => void;

  // Add modal
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;

  // CRUD operations
  isSaving: boolean;
  isDeleting: boolean;
  isResettingProgress: boolean;
  createFlashcard: (data: CreateFlashcardCommand) => Promise<boolean>;
  updateFlashcard: (id: string, data: UpdateFlashcardCommand) => Promise<boolean>;
  deleteFlashcard: (id: string) => Promise<boolean>;
  resetProgress: (id: string) => Promise<boolean>;

  // Helpers
  hasFlashcards: boolean;
  hasSearchQuery: boolean;
  clearSearch: () => void;
  refetch: () => Promise<void>;
}

// API functions
async function fetchFlashcardsApi(params: FlashcardsQueryParams): Promise<FlashcardsListResponseDTO> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);

  const response = await authenticatedFetch(`/api/flashcards?${searchParams}`);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error("Nie udało się pobrać fiszek");
  }
  return response.json();
}

async function createFlashcardApi(data: CreateFlashcardCommand): Promise<FlashcardCreateResponseDTO> {
  const response = await authenticatedFetch("/api/flashcards", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Nie udało się utworzyć fiszki");
  }
  return response.json();
}

async function updateFlashcardApi(id: string, data: UpdateFlashcardCommand): Promise<FlashcardUpdateResponseDTO> {
  const response = await authenticatedFetch(`/api/flashcards/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 404) {
      throw new Error("Fiszka nie została znaleziona");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Nie udało się zaktualizować fiszki");
  }
  return response.json();
}

async function deleteFlashcardApi(id: string): Promise<MessageResponseDTO> {
  const response = await authenticatedFetch(`/api/flashcards/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 404) {
      throw new Error("Fiszka nie została znaleziona");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Nie udało się usunąć fiszki");
  }
  return response.json();
}

async function resetProgressApi(id: string): Promise<FlashcardResetProgressResponseDTO> {
  const response = await authenticatedFetch(`/api/flashcards/${id}/reset-progress`, {
    method: "POST",
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 404) {
      throw new Error("Fiszka nie została znaleziona");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Nie udało się zresetować postępu");
  }
  return response.json();
}

function handleUnauthorized(): void {
  sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
  window.location.href = "/login";
}

export function useFlashcards(): UseFlashcardsReturn {
  // Data state
  const [flashcards, setFlashcards] = useState<FlashcardListItemDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationDTO | null>(null);

  // Filter state
  const [searchQuery, setSearchQueryState] = useState("");
  const [sortField, setSortField] = useState<FlashcardsSortField>(FLASHCARDS_CONFIG.DEFAULT_SORT_FIELD);
  const [sortOrder, setSortOrder] = useState<SortOrder>(FLASHCARDS_CONFIG.DEFAULT_SORT_ORDER);
  const [currentPage, setCurrentPage] = useState(1);

  // Loading and error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Operation states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingProgress, setIsResettingProgress] = useState(false);

  // Modal states
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardListItemDTO | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Debounce ref for search
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Fetch flashcards
  const fetchFlashcards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: FlashcardsQueryParams = {
        page: currentPage,
        limit: FLASHCARDS_CONFIG.DEFAULT_PAGE_SIZE,
        sort: sortField,
        order: sortOrder,
      };
      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }

      const response = await fetchFlashcardsApi(params);
      setFlashcards(response.data);
      setPagination(response.pagination);
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        handleUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, sortField, sortOrder, debouncedSearchQuery]);

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Debounce search query
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, FLASHCARDS_CONFIG.SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  // Set search query
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  // Set sorting
  const setSorting = useCallback((field: FlashcardsSortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page on sort change
  }, []);

  // Go to page
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQueryState("");
    setDebouncedSearchQuery("");
    setCurrentPage(1);
  }, []);

  // Open edit modal
  const openEditModal = useCallback((flashcard: FlashcardListItemDTO) => {
    setEditingFlashcard(flashcard);
    setIsEditModalOpen(true);
  }, []);

  // Close edit modal
  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingFlashcard(null);
  }, []);

  // Open add modal
  const openAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  // Close add modal
  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  // Create flashcard
  const createFlashcard = useCallback(
    async (data: CreateFlashcardCommand): Promise<boolean> => {
      setIsSaving(true);
      try {
        await createFlashcardApi(data);
        closeAddModal();
        await fetchFlashcards();
        return true;
      } catch (err) {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          handleUnauthorized();
          return false;
        }
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [closeAddModal, fetchFlashcards]
  );

  // Update flashcard
  const updateFlashcard = useCallback(
    async (id: string, data: UpdateFlashcardCommand): Promise<boolean> => {
      setIsSaving(true);
      try {
        const updatedFlashcard = await updateFlashcardApi(id, data);
        // Optimistic update
        setFlashcards((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  front: updatedFlashcard.front,
                  back: updatedFlashcard.back,
                  updated_at: updatedFlashcard.updated_at,
                }
              : f
          )
        );
        closeEditModal();
        return true;
      } catch (err) {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          handleUnauthorized();
          return false;
        }
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [closeEditModal]
  );

  // Delete flashcard
  const deleteFlashcard = useCallback(
    async (id: string): Promise<boolean> => {
      const previousFlashcards = flashcards;
      setIsDeleting(true);

      // Optimistic update
      setFlashcards((prev) => prev.filter((f) => f.id !== id));
      closeEditModal();

      try {
        await deleteFlashcardApi(id);
        await fetchFlashcards(); // Refetch to get correct pagination
        return true;
      } catch (err) {
        // Rollback on error
        setFlashcards(previousFlashcards);
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          handleUnauthorized();
          return false;
        }
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [flashcards, closeEditModal, fetchFlashcards]
  );

  // Reset progress
  const resetProgress = useCallback(
    async (id: string): Promise<boolean> => {
      setIsResettingProgress(true);
      try {
        const result = await resetProgressApi(id);
        // Update flashcard in state with reset values
        setFlashcards((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  interval: result.interval,
                  ease_factor: result.ease_factor,
                  repetitions: result.repetitions,
                  next_review_date: result.next_review_date,
                  last_reviewed_at: result.last_reviewed_at,
                }
              : f
          )
        );
        // Also update editing flashcard if it's the same
        setEditingFlashcard((prev) =>
          prev && prev.id === id
            ? {
                ...prev,
                interval: result.interval,
                ease_factor: result.ease_factor,
                repetitions: result.repetitions,
                next_review_date: result.next_review_date,
                last_reviewed_at: result.last_reviewed_at,
              }
            : prev
        );
        return true;
      } catch (err) {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          handleUnauthorized();
          return false;
        }
        throw err;
      } finally {
        setIsResettingProgress(false);
      }
    },
    []
  );

  // Refetch
  const refetch = useCallback(async () => {
    await fetchFlashcards();
  }, [fetchFlashcards]);

  // Computed values
  const hasFlashcards = flashcards.length > 0;
  const hasSearchQuery = useMemo(() => searchQuery.trim().length > 0, [searchQuery]);

  return {
    // Data
    flashcards,
    pagination,

    // Filters
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    setSorting,

    // Pagination
    currentPage,
    goToPage,

    // States
    isLoading,
    error,

    // Edit modal
    editingFlashcard,
    isEditModalOpen,
    openEditModal,
    closeEditModal,

    // Add modal
    isAddModalOpen,
    openAddModal,
    closeAddModal,

    // CRUD operations
    isSaving,
    isDeleting,
    isResettingProgress,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    resetProgress,

    // Helpers
    hasFlashcards,
    hasSearchQuery,
    clearSearch,
    refetch,
  };
}
