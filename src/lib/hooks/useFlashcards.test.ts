import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFlashcards } from "./useFlashcards";
import { FLASHCARDS_CONFIG } from "@/components/flashcards/types";
import type { FlashcardsListResponseDTO, FlashcardListItemDTO } from "@/types";

// Mock authenticatedFetch
vi.mock("@/lib/auth.client", () => ({
  authenticatedFetch: vi.fn(),
}));

import { authenticatedFetch } from "@/lib/auth.client";
const mockAuthenticatedFetch = vi.mocked(authenticatedFetch);

// Mock window.location
const mockLocation = { href: "", pathname: "/flashcards" };
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Mock sessionStorage
let mockSessionStorage: Record<string, string> = {};
vi.stubGlobal("sessionStorage", {
  getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    const { [key]: _removed, ...rest } = mockSessionStorage;
    void _removed;
    mockSessionStorage = rest;
  }),
  clear: vi.fn(() => {
    mockSessionStorage = {};
  }),
});

describe("useFlashcards", () => {
  // ==========================================================================
  // Setup & Teardown
  // ==========================================================================

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedFetch.mockReset();
    mockLocation.href = "";
    mockSessionStorage = {};
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  const createMockFlashcard = (overrides: Partial<FlashcardListItemDTO> = {}): FlashcardListItemDTO => ({
    id: `flashcard-${Math.random().toString(36).substr(2, 9)}`,
    front: "Test Question",
    back: "Test Answer",
    is_ai_generated: false,
    interval: 1,
    ease_factor: 2.5,
    repetitions: 0,
    next_review_date: new Date().toISOString(),
    last_reviewed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  const createMockListResponse = (count = 5, page = 1, totalPages = 1): FlashcardsListResponseDTO => ({
    data: Array.from({ length: count }, (_, i) =>
      createMockFlashcard({ id: `flashcard-${i + 1}`, front: `Question ${i + 1}` })
    ),
    pagination: {
      page,
      limit: FLASHCARDS_CONFIG.DEFAULT_PAGE_SIZE,
      total: count * totalPages,
      total_pages: totalPages,
    },
  });

  const mockSuccessfulFetch = (response: FlashcardsListResponseDTO = createMockListResponse()) => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    } as Response);
  };

  const renderAndWaitForFetch = async () => {
    mockSuccessfulFetch();
    const { result } = renderHook(() => useFlashcards());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    return result;
  };

  // ==========================================================================
  // Initial Fetch
  // ==========================================================================

  describe("initial fetch", () => {
    it("should fetch flashcards on mount", async () => {
      // Arrange
      mockSuccessfulFetch();

      // Act
      renderHook(() => useFlashcards());

      // Assert
      await waitFor(() => {
        expect(mockAuthenticatedFetch).toHaveBeenCalledWith(expect.stringContaining("/api/flashcards?"));
      });
    });

    it("should set isLoading during fetch", async () => {
      // Arrange
      const promiseControls = {
        resolve: (value: Response) => {
          void value;
        },
      };
      const pendingPromise = new Promise<Response>((resolve) => {
        promiseControls.resolve = resolve;
      });
      mockAuthenticatedFetch.mockReturnValueOnce(pendingPromise);

      // Act
      const { result } = renderHook(() => useFlashcards());

      // Assert
      expect(result.current.isLoading).toBe(true);

      // Cleanup
      await act(async () => {
        promiseControls.resolve({
          ok: true,
          json: () => Promise.resolve(createMockListResponse()),
        } as Response);
      });
    });

    it("should populate flashcards and pagination on success", async () => {
      // Arrange
      const mockResponse = createMockListResponse(3, 1, 2);
      mockSuccessfulFetch(mockResponse);

      // Act
      const { result } = renderHook(() => useFlashcards());

      // Assert
      await waitFor(() => {
        expect(result.current.flashcards).toHaveLength(3);
        expect(result.current.pagination?.total_pages).toBe(2);
      });
    });

    it("should handle fetch error", async () => {
      // Arrange
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      // Act
      const { result } = renderHook(() => useFlashcards());

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe("Nie udało się pobrać fiszek");
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should redirect on 401", async () => {
      // Arrange
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      // Act
      renderHook(() => useFlashcards());

      // Assert
      await waitFor(() => {
        expect(mockLocation.href).toBe("/login");
        expect(mockSessionStorage["redirectAfterLogin"]).toBe("/flashcards");
      });
    });
  });

  // ==========================================================================
  // Search Debouncing
  // ==========================================================================

  describe("search debouncing", () => {
    it("should debounce search query by 300ms", async () => {
      // Arrange
      vi.useFakeTimers();
      mockSuccessfulFetch(); // For initial fetch
      const { result } = renderHook(() => useFlashcards());

      // Wait for initial load using fake timers
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      mockAuthenticatedFetch.mockClear();

      // Act - type search query
      act(() => {
        result.current.setSearchQuery("test");
      });

      // Assert - should not fetch immediately
      expect(mockAuthenticatedFetch).not.toHaveBeenCalled();

      // Advance 200ms - still should not fetch
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(mockAuthenticatedFetch).not.toHaveBeenCalled();

      // Advance to 300ms - should fetch now
      mockSuccessfulFetch();
      await act(async () => {
        vi.advanceTimersByTime(100);
        await vi.runAllTimersAsync();
      });

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(expect.stringContaining("search=test"));
    });

    it("should reset debounce timer on new input", async () => {
      // Arrange
      vi.useFakeTimers();
      mockSuccessfulFetch();
      const { result } = renderHook(() => useFlashcards());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      mockAuthenticatedFetch.mockClear();

      // Act - type first query
      act(() => {
        result.current.setSearchQuery("te");
      });

      // Advance 200ms
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // Type more - should reset timer
      act(() => {
        result.current.setSearchQuery("test");
      });

      // Advance 200ms - should not have fetched yet (only 200ms since last change)
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(mockAuthenticatedFetch).not.toHaveBeenCalled();

      // Complete the 300ms from last change
      mockSuccessfulFetch();
      await act(async () => {
        vi.advanceTimersByTime(100);
        await vi.runAllTimersAsync();
      });

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(expect.stringContaining("search=test"));
    });

    it("should reset page to 1 when search query changes", async () => {
      // Arrange
      vi.useFakeTimers();
      mockSuccessfulFetch();
      const { result } = renderHook(() => useFlashcards());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Go to page 2 first
      mockSuccessfulFetch(createMockListResponse(5, 2, 3));
      act(() => {
        result.current.goToPage(2);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.currentPage).toBe(2);

      // Act - set search query
      mockSuccessfulFetch();
      act(() => {
        result.current.setSearchQuery("test");
      });

      await act(async () => {
        vi.advanceTimersByTime(FLASHCARDS_CONFIG.SEARCH_DEBOUNCE_MS);
        await vi.runAllTimersAsync();
      });

      // Assert
      expect(result.current.currentPage).toBe(1);
    });

    it("should track hasSearchQuery correctly", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();

      // Assert - initially no search
      expect(result.current.hasSearchQuery).toBe(false);

      // Act
      act(() => {
        result.current.setSearchQuery("test");
      });

      // Assert
      expect(result.current.hasSearchQuery).toBe(true);

      // Clear search
      act(() => {
        result.current.setSearchQuery("   ");
      });

      expect(result.current.hasSearchQuery).toBe(false);
    });

    it("should clear search correctly", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();

      act(() => {
        result.current.setSearchQuery("test");
      });

      // Act
      mockSuccessfulFetch();
      act(() => {
        result.current.clearSearch();
      });

      // Assert
      expect(result.current.searchQuery).toBe("");
      expect(result.current.hasSearchQuery).toBe(false);
    });
  });

  // ==========================================================================
  // Pagination
  // ==========================================================================

  describe("pagination", () => {
    it("should go to specified page", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();
      mockSuccessfulFetch(createMockListResponse(5, 2, 3));

      // Act
      act(() => {
        result.current.goToPage(2);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.currentPage).toBe(2);
        expect(mockAuthenticatedFetch).toHaveBeenLastCalledWith(expect.stringContaining("page=2"));
      });
    });

    it("should include page size in query", async () => {
      // Arrange & Act
      await renderAndWaitForFetch();

      // Assert
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        expect.stringContaining(`limit=${FLASHCARDS_CONFIG.DEFAULT_PAGE_SIZE}`)
      );
    });
  });

  // ==========================================================================
  // Sorting
  // ==========================================================================

  describe("sorting", () => {
    it("should use default sort settings initially", async () => {
      // Arrange & Act
      await renderAndWaitForFetch();

      // Assert
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        expect.stringContaining(`sort=${FLASHCARDS_CONFIG.DEFAULT_SORT_FIELD}`)
      );
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        expect.stringContaining(`order=${FLASHCARDS_CONFIG.DEFAULT_SORT_ORDER}`)
      );
    });

    it("should update sort field and order", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();
      mockSuccessfulFetch();

      // Act
      act(() => {
        result.current.setSorting("updated_at", "asc");
      });

      // Assert
      await waitFor(() => {
        expect(result.current.sortField).toBe("updated_at");
        expect(result.current.sortOrder).toBe("asc");
        expect(mockAuthenticatedFetch).toHaveBeenLastCalledWith(expect.stringContaining("sort=updated_at"));
        expect(mockAuthenticatedFetch).toHaveBeenLastCalledWith(expect.stringContaining("order=asc"));
      });
    });

    it("should reset page to 1 when sorting changes", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();

      // Go to page 2
      mockSuccessfulFetch(createMockListResponse(5, 2, 3));
      act(() => {
        result.current.goToPage(2);
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(2);
      });

      // Act - change sorting
      mockSuccessfulFetch();
      act(() => {
        result.current.setSorting("next_review_date", "asc");
      });

      // Assert
      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
      });
    });
  });

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  describe("CRUD operations", () => {
    describe("createFlashcard", () => {
      it("should create flashcard and refetch list", async () => {
        // Arrange
        const result = await renderAndWaitForFetch();

        mockAuthenticatedFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockFlashcard({ id: "new-card" })),
        } as Response);
        mockSuccessfulFetch(); // For refetch

        // Act
        let success = false;
        await act(async () => {
          success = await result.current.createFlashcard({ front: "New Q", back: "New A" });
        });

        // Assert
        expect(success).toBe(true);
        expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
          "/api/flashcards",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ front: "New Q", back: "New A" }),
          })
        );
      });

      it("should close add modal after successful create", async () => {
        // Arrange
        const result = await renderAndWaitForFetch();

        act(() => {
          result.current.openAddModal();
        });
        expect(result.current.isAddModalOpen).toBe(true);

        mockAuthenticatedFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockFlashcard()),
        } as Response);
        mockSuccessfulFetch();

        // Act
        await act(async () => {
          await result.current.createFlashcard({ front: "Q", back: "A" });
        });

        // Assert
        expect(result.current.isAddModalOpen).toBe(false);
      });

      it("should set isSaving during create", async () => {
        // Arrange
        const result = await renderAndWaitForFetch();
        const promiseControls = {
          resolve: (value: Response) => {
            void value;
          },
        };
        const pendingPromise = new Promise<Response>((resolve) => {
          promiseControls.resolve = resolve;
        });
        mockAuthenticatedFetch.mockReturnValueOnce(pendingPromise);

        // Act
        let createPromise: Promise<boolean>;
        act(() => {
          createPromise = result.current.createFlashcard({ front: "Q", back: "A" });
        });

        // Assert
        expect(result.current.isSaving).toBe(true);

        // Cleanup
        mockSuccessfulFetch();
        await act(async () => {
          promiseControls.resolve({
            ok: true,
            json: () => Promise.resolve(createMockFlashcard()),
          } as Response);
          await createPromise;
        });

        expect(result.current.isSaving).toBe(false);
      });
    });

    describe("updateFlashcard", () => {
      it("should update flashcard optimistically", async () => {
        // Arrange
        const result = await renderAndWaitForFetch();
        const cardId = result.current.flashcards[0].id;

        mockAuthenticatedFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: cardId,
              front: "Updated Q",
              back: "Updated A",
              is_ai_generated: false,
              updated_at: new Date().toISOString(),
            }),
        } as Response);

        // Act
        await act(async () => {
          await result.current.updateFlashcard(cardId, { front: "Updated Q", back: "Updated A" });
        });

        // Assert
        expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
          `/api/flashcards/${cardId}`,
          expect.objectContaining({ method: "PUT" })
        );
        expect(result.current.flashcards[0].front).toBe("Updated Q");
      });

      it("should close edit modal after successful update", async () => {
        // Arrange
        const result = await renderAndWaitForFetch();
        const card = result.current.flashcards[0];

        act(() => {
          result.current.openEditModal(card);
        });
        expect(result.current.isEditModalOpen).toBe(true);

        mockAuthenticatedFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: card.id,
              front: "Updated",
              back: "Answer",
              is_ai_generated: false,
              updated_at: new Date().toISOString(),
            }),
        } as Response);

        // Act
        await act(async () => {
          await result.current.updateFlashcard(card.id, { front: "Updated" });
        });

        // Assert
        expect(result.current.isEditModalOpen).toBe(false);
        expect(result.current.editingFlashcard).toBeNull();
      });
    });

    describe("deleteFlashcard", () => {
      it("should delete flashcard with optimistic update", async () => {
        // Arrange
        const result = await renderAndWaitForFetch();
        const initialCount = result.current.flashcards.length;
        const cardId = result.current.flashcards[0].id;

        mockAuthenticatedFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: "Deleted" }),
        } as Response);
        mockSuccessfulFetch(createMockListResponse(initialCount - 1));

        // Act
        await act(async () => {
          await result.current.deleteFlashcard(cardId);
        });

        // Assert
        expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
          `/api/flashcards/${cardId}`,
          expect.objectContaining({ method: "DELETE" })
        );
      });

      it("should rollback on delete error", async () => {
        // Arrange
        const result = await renderAndWaitForFetch();
        const initialFlashcards = [...result.current.flashcards];
        const cardId = result.current.flashcards[0].id;

        mockAuthenticatedFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: "Server error" }),
        } as Response);

        // Act & Assert
        await expect(
          act(async () => {
            await result.current.deleteFlashcard(cardId);
          })
        ).rejects.toThrow();

        expect(result.current.flashcards).toHaveLength(initialFlashcards.length);
      });

      it("should set isDeleting during delete", async () => {
        // Arrange
        const result = await renderAndWaitForFetch();
        const promiseControls = {
          resolve: (value: Response) => {
            void value;
          },
        };
        const pendingPromise = new Promise<Response>((resolve) => {
          promiseControls.resolve = resolve;
        });
        mockAuthenticatedFetch.mockReturnValueOnce(pendingPromise);

        const cardId = result.current.flashcards[0].id;

        // Act
        let deletePromise: Promise<boolean>;
        act(() => {
          deletePromise = result.current.deleteFlashcard(cardId);
        });

        // Assert
        expect(result.current.isDeleting).toBe(true);

        // Cleanup
        mockSuccessfulFetch();
        await act(async () => {
          promiseControls.resolve({
            ok: true,
            json: () => Promise.resolve({ message: "Deleted" }),
          } as Response);
          await deletePromise;
        });

        expect(result.current.isDeleting).toBe(false);
      });
    });

    describe("resetProgress", () => {
      it("should reset flashcard progress", async () => {
        // Arrange
        const result = await renderAndWaitForFetch();
        const cardId = result.current.flashcards[0].id;

        const resetResponse = {
          id: cardId,
          interval: 0,
          ease_factor: 2.5,
          repetitions: 0,
          next_review_date: new Date().toISOString(),
          last_reviewed_at: null,
        };

        mockAuthenticatedFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(resetResponse),
        } as Response);

        // Act
        let success = false;
        await act(async () => {
          success = await result.current.resetProgress(cardId);
        });

        // Assert
        expect(success).toBe(true);
        expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
          `/api/flashcards/${cardId}/reset-progress`,
          expect.objectContaining({ method: "POST" })
        );
        expect(result.current.flashcards[0].repetitions).toBe(0);
      });

      it("should update editingFlashcard if it matches", async () => {
        // Arrange
        const result = await renderAndWaitForFetch();
        const card = result.current.flashcards[0];

        act(() => {
          result.current.openEditModal(card);
        });

        const resetResponse = {
          id: card.id,
          interval: 0,
          ease_factor: 2.5,
          repetitions: 0,
          next_review_date: new Date().toISOString(),
          last_reviewed_at: null,
        };

        mockAuthenticatedFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(resetResponse),
        } as Response);

        // Act
        await act(async () => {
          await result.current.resetProgress(card.id);
        });

        // Assert
        expect(result.current.editingFlashcard?.repetitions).toBe(0);
      });
    });
  });

  // ==========================================================================
  // Modal State
  // ==========================================================================

  describe("modal state", () => {
    it("should open and close edit modal", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();
      const card = result.current.flashcards[0];

      // Act & Assert - open
      act(() => {
        result.current.openEditModal(card);
      });
      expect(result.current.isEditModalOpen).toBe(true);
      expect(result.current.editingFlashcard).toEqual(card);

      // Act & Assert - close
      act(() => {
        result.current.closeEditModal();
      });
      expect(result.current.isEditModalOpen).toBe(false);
      expect(result.current.editingFlashcard).toBeNull();
    });

    it("should open and close add modal", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();

      // Act & Assert - open
      act(() => {
        result.current.openAddModal();
      });
      expect(result.current.isAddModalOpen).toBe(true);

      // Act & Assert - close
      act(() => {
        result.current.closeAddModal();
      });
      expect(result.current.isAddModalOpen).toBe(false);
    });
  });

  // ==========================================================================
  // Helper Properties
  // ==========================================================================

  describe("helper properties", () => {
    it("should track hasFlashcards correctly", async () => {
      // Arrange - with flashcards
      const result = await renderAndWaitForFetch();

      // Assert
      expect(result.current.hasFlashcards).toBe(true);
    });

    it("should track hasFlashcards as false when empty", async () => {
      // Arrange
      mockSuccessfulFetch({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
      });

      const { result } = renderHook(() => useFlashcards());

      // Assert
      await waitFor(() => {
        expect(result.current.hasFlashcards).toBe(false);
      });
    });

    it("should allow manual refetch", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();
      mockAuthenticatedFetch.mockClear();
      mockSuccessfulFetch();

      // Act
      await act(async () => {
        await result.current.refetch();
      });

      // Assert
      expect(mockAuthenticatedFetch).toHaveBeenCalled();
    });
  });
});
