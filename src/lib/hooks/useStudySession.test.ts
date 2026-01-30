import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useStudySession } from "./useStudySession";
import { errorMessages } from "@/components/study/types";
import type { StudySessionResponseDTO, StudyCardDTO } from "@/types";

// Mock authenticatedFetch
vi.mock("@/lib/auth.client", () => ({
  authenticatedFetch: vi.fn(),
}));

import { authenticatedFetch } from "@/lib/auth.client";
const mockAuthenticatedFetch = vi.mocked(authenticatedFetch);

// Mock window.location
const mockLocation = { href: "", pathname: "/study" };
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {};
vi.stubGlobal("sessionStorage", {
  getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  }),
});

describe("useStudySession", () => {
  // ==========================================================================
  // Setup & Teardown
  // ==========================================================================

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  const createMockCard = (overrides: Partial<StudyCardDTO> = {}): StudyCardDTO => ({
    id: `card-${Math.random().toString(36).substr(2, 9)}`,
    front: "Test Question",
    back: "Test Answer",
    is_new: false,
    ...overrides,
  });

  const createMockSessionResponse = (cardCount = 3, newCardsCount = 1): StudySessionResponseDTO => {
    const cards = Array.from({ length: cardCount }, (_, i) =>
      createMockCard({
        id: `card-${i + 1}`,
        front: `Question ${i + 1}`,
        back: `Answer ${i + 1}`,
        is_new: i < newCardsCount,
      })
    );

    return {
      cards,
      statistics: {
        total_cards: cardCount,
        new_cards: newCardsCount,
        review_cards: cardCount - newCardsCount,
      },
      has_any_flashcards: true,
    };
  };

  const mockSuccessfulFetch = (response: StudySessionResponseDTO = createMockSessionResponse()) => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    } as Response);
  };

  const mockSuccessfulReview = () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
  };

  const renderAndWaitForFetch = async (response?: StudySessionResponseDTO) => {
    mockSuccessfulFetch(response);
    const { result } = renderHook(() => useStudySession());

    await waitFor(() => {
      expect(result.current.status).not.toBe("loading");
    });

    return result;
  };

  // ==========================================================================
  // State Machine Transitions
  // ==========================================================================

  describe("state machine transitions", () => {
    it("should start in idle state", () => {
      // Arrange - prevent auto-fetch
      mockAuthenticatedFetch.mockImplementation(() => new Promise(() => {}));

      // Act
      const { result } = renderHook(() => useStudySession());

      // Assert - briefly in idle before loading
      expect(["idle", "loading"]).toContain(result.current.status);
    });

    it("should transition from idle to loading on mount", async () => {
      // Arrange
      let resolvePromise: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockAuthenticatedFetch.mockReturnValueOnce(pendingPromise);

      // Act
      const { result } = renderHook(() => useStudySession());

      // Assert
      await waitFor(() => {
        expect(result.current.status).toBe("loading");
      });

      // Cleanup
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(createMockSessionResponse()),
        } as Response);
      });
    });

    it("should transition to ready when cards available", async () => {
      // Arrange & Act
      const result = await renderAndWaitForFetch(createMockSessionResponse(5));

      // Assert
      expect(result.current.status).toBe("ready");
    });

    it("should transition to empty when no cards to study", async () => {
      // Arrange
      const emptyResponse: StudySessionResponseDTO = {
        cards: [],
        statistics: { total_cards: 0, new_cards: 0, review_cards: 0 },
        has_any_flashcards: true,
      };

      // Act
      const result = await renderAndWaitForFetch(emptyResponse);

      // Assert
      expect(result.current.status).toBe("empty");
    });

    it("should transition from ready to studying on startSession", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();

      // Act
      act(() => {
        result.current.startSession();
      });

      // Assert
      expect(result.current.status).toBe("studying");
    });

    it("should not start session when not in ready state", async () => {
      // Arrange - empty session
      const emptyResponse: StudySessionResponseDTO = {
        cards: [],
        statistics: { total_cards: 0, new_cards: 0, review_cards: 0 },
        has_any_flashcards: true,
      };
      const result = await renderAndWaitForFetch(emptyResponse);
      expect(result.current.status).toBe("empty");

      // Act
      act(() => {
        result.current.startSession();
      });

      // Assert - should stay in empty
      expect(result.current.status).toBe("empty");
    });

    it("should transition to completed after last card", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(2));

      act(() => {
        result.current.startSession();
      });

      // Act - answer all cards
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(false);
      });

      // Assert
      expect(result.current.status).toBe("completed");
    });

    it("should transition to interrupted on interruptSession", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(5));

      act(() => {
        result.current.startSession();
      });

      // Answer one card
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      // Act
      act(() => {
        result.current.interruptSession();
      });

      // Assert
      expect(result.current.status).toBe("interrupted");
    });

    it("should not interrupt when not studying", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();

      // Act - try to interrupt in ready state
      act(() => {
        result.current.interruptSession();
      });

      // Assert - should stay in ready
      expect(result.current.status).toBe("ready");
    });
  });

  // ==========================================================================
  // Session Progress
  // ==========================================================================

  describe("session progress", () => {
    it("should initialize progress correctly", async () => {
      // Arrange & Act
      const result = await renderAndWaitForFetch(createMockSessionResponse(5));

      // Assert
      expect(result.current.progress).toEqual({
        currentIndex: 0,
        totalCards: 5,
        answeredCount: 0,
        rememberedCount: 0,
        forgottenCount: 0,
      });
    });

    it("should update progress on remembered answer", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(5));

      act(() => {
        result.current.startSession();
      });

      // Act
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      // Assert
      expect(result.current.progress).toEqual({
        currentIndex: 1,
        totalCards: 5,
        answeredCount: 1,
        rememberedCount: 1,
        forgottenCount: 0,
      });
    });

    it("should update progress on forgotten answer", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(5));

      act(() => {
        result.current.startSession();
      });

      // Act
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(false);
      });

      // Assert
      expect(result.current.progress).toEqual({
        currentIndex: 1,
        totalCards: 5,
        answeredCount: 1,
        rememberedCount: 0,
        forgottenCount: 1,
      });
    });

    it("should track mixed answers correctly", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(4));

      act(() => {
        result.current.startSession();
      });

      // Act - remember, forget, remember, forget
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      });
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(false);
      });
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      });
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(false);
      });

      // Assert
      expect(result.current.progress).toEqual({
        currentIndex: 4,
        totalCards: 4,
        answeredCount: 4,
        rememberedCount: 2,
        forgottenCount: 2,
      });
    });
  });

  // ==========================================================================
  // Session Summary Calculation
  // ==========================================================================

  describe("session summary calculation", () => {
    it("should calculate summary on completion", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(4, 2));

      act(() => {
        result.current.startSession();
      });

      // Act - 3 remembered, 1 forgotten
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      }); // new
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      }); // new
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      }); // review
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(false);
      }); // review

      // Assert
      expect(result.current.summary).toEqual({
        totalReviewed: 4,
        newCardsReviewed: 2,
        reviewCardsReviewed: 2,
        rememberedCount: 3,
        forgottenCount: 1,
        successRate: 75,
      });
    });

    it("should calculate summary on interruption", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(5, 2));

      act(() => {
        result.current.startSession();
      });

      // Act - answer 2 cards then interrupt
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      }); // new - remembered
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(false);
      }); // new - forgotten

      act(() => {
        result.current.interruptSession();
      });

      // Assert
      expect(result.current.summary).toEqual({
        totalReviewed: 2,
        newCardsReviewed: 2,
        reviewCardsReviewed: 0,
        rememberedCount: 1,
        forgottenCount: 1,
        successRate: 50,
      });
    });

    it("should calculate 100% success rate when all remembered", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(3, 0));

      act(() => {
        result.current.startSession();
      });

      // Act - all remembered
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      });
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      });
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      // Assert
      expect(result.current.summary?.successRate).toBe(100);
    });

    it("should calculate 0% success rate when all forgotten", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(2, 0));

      act(() => {
        result.current.startSession();
      });

      // Act - all forgotten
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(false);
      });
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(false);
      });

      // Assert
      expect(result.current.summary?.successRate).toBe(0);
    });

    it("should handle summary with no cards reviewed (empty interrupt)", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(5));

      act(() => {
        result.current.startSession();
      });

      // Act - interrupt immediately without answering
      act(() => {
        result.current.interruptSession();
      });

      // Assert
      expect(result.current.summary).toEqual({
        totalReviewed: 0,
        newCardsReviewed: 0,
        reviewCardsReviewed: 0,
        rememberedCount: 0,
        forgottenCount: 0,
        successRate: 0,
      });
    });
  });

  // ==========================================================================
  // Card Navigation
  // ==========================================================================

  describe("card navigation", () => {
    it("should show first card when session starts", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(3));

      // Act
      act(() => {
        result.current.startSession();
      });

      // Assert
      expect(result.current.currentCard?.id).toBe("card-1");
      expect(result.current.currentCard?.front).toBe("Question 1");
    });

    it("should advance to next card after answer", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(3));

      act(() => {
        result.current.startSession();
      });

      // Act
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      // Assert
      expect(result.current.currentCard?.id).toBe("card-2");
    });

    it("should have no currentCard after session completes", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(1));

      act(() => {
        result.current.startSession();
      });

      // Act
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      // Assert
      expect(result.current.status).toBe("completed");
      expect(result.current.currentCard).toBeNull();
    });

    it("should have no currentCard when not studying", async () => {
      // Arrange & Act
      const result = await renderAndWaitForFetch();

      // Assert - in ready state
      expect(result.current.currentCard).toBeNull();
    });
  });

  // ==========================================================================
  // Card Reveal
  // ==========================================================================

  describe("card reveal", () => {
    it("should start with card not revealed", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();

      act(() => {
        result.current.startSession();
      });

      // Assert
      expect(result.current.isRevealed).toBe(false);
    });

    it("should reveal card on revealCard", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();

      act(() => {
        result.current.startSession();
      });

      // Act
      act(() => {
        result.current.revealCard();
      });

      // Assert
      expect(result.current.isRevealed).toBe(true);
    });

    it("should not reveal when already revealed", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();

      act(() => {
        result.current.startSession();
        result.current.revealCard();
      });

      // Act - try to reveal again
      act(() => {
        result.current.revealCard();
      });

      // Assert - should still be revealed (no error)
      expect(result.current.isRevealed).toBe(true);
    });

    it("should reset reveal state after answer", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(3));

      act(() => {
        result.current.startSession();
      });

      act(() => {
        result.current.revealCard();
      });

      expect(result.current.isRevealed).toBe(true);

      // Act
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      // Assert - should be hidden for next card
      expect(result.current.isRevealed).toBe(false);
    });

    it("should not reveal when not studying", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();

      // Act - try to reveal in ready state
      act(() => {
        result.current.revealCard();
      });

      // Assert
      expect(result.current.isRevealed).toBe(false);
    });
  });

  // ==========================================================================
  // Answer Submission
  // ==========================================================================

  describe("answer submission", () => {
    it("should set isSubmitting during API call", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(3));

      act(() => {
        result.current.startSession();
      });

      let resolvePromise: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockAuthenticatedFetch.mockReturnValueOnce(pendingPromise);

      // Act
      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.submitAnswer(true);
      });

      // Assert - during submission
      expect(result.current.isSubmitting).toBe(true);

      // Cleanup
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response);
        await submitPromise;
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it("should continue even if API fails (fire-and-forget)", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(3));

      act(() => {
        result.current.startSession();
      });

      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      // Act
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      // Assert - should have advanced despite error
      expect(result.current.progress.currentIndex).toBe(1);
      expect(result.current.currentCard?.id).toBe("card-2");
    });

    it("should not submit when not studying", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();

      // Act - try to submit in ready state
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      // Assert - nothing should happen
      expect(mockAuthenticatedFetch).toHaveBeenCalledTimes(1); // Only initial fetch
    });

    it("should not submit when no currentCard", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(1));

      act(() => {
        result.current.startSession();
      });

      // Complete the session
      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      expect(result.current.status).toBe("completed");
      mockAuthenticatedFetch.mockClear();

      // Act - try to submit again
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      // Assert
      expect(mockAuthenticatedFetch).not.toHaveBeenCalled();
    });

    it("should send correct review command", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(3));

      act(() => {
        result.current.startSession();
      });

      mockSuccessfulReview();

      // Act
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      // Assert
      expect(mockAuthenticatedFetch).toHaveBeenLastCalledWith(
        "/api/study/review",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            flashcard_id: "card-1",
            remembered: true,
          }),
        })
      );
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe("error handling", () => {
    it("should set error on fetch failure", async () => {
      // Arrange
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      // Act
      const { result } = renderHook(() => useStudySession());

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe(errorMessages.serverError);
        expect(result.current.status).toBe("idle");
      });
    });

    it("should redirect on 401", async () => {
      // Arrange
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      // Act
      renderHook(() => useStudySession());

      // Assert
      await waitFor(() => {
        expect(mockLocation.href).toBe("/login");
        expect(mockSessionStorage["redirectAfterLogin"]).toBe("/study");
      });
    });

    it("should redirect on 401 during review", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();

      act(() => {
        result.current.startSession();
      });

      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      // Act
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      // Assert
      expect(mockLocation.href).toBe("/login");
    });
  });

  // ==========================================================================
  // Finish Session
  // ==========================================================================

  describe("finishSession", () => {
    it("should navigate to flashcards page", async () => {
      // Arrange
      const result = await renderAndWaitForFetch(createMockSessionResponse(1));

      act(() => {
        result.current.startSession();
      });

      mockSuccessfulReview();
      await act(async () => {
        await result.current.submitAnswer(true);
      });

      // Act
      act(() => {
        result.current.finishSession();
      });

      // Assert
      expect(mockLocation.href).toBe("/flashcards");
    });
  });

  // ==========================================================================
  // Statistics & hasAnyFlashcards
  // ==========================================================================

  describe("statistics and hasAnyFlashcards", () => {
    it("should expose statistics from response", async () => {
      // Arrange & Act
      const result = await renderAndWaitForFetch(createMockSessionResponse(10, 3));

      // Assert
      expect(result.current.statistics).toEqual({
        total_cards: 10,
        new_cards: 3,
        review_cards: 7,
      });
    });

    it("should expose hasAnyFlashcards from response", async () => {
      // Arrange & Act
      const result = await renderAndWaitForFetch();

      // Assert
      expect(result.current.hasAnyFlashcards).toBe(true);
    });

    it("should track hasAnyFlashcards as false when no flashcards exist", async () => {
      // Arrange
      const emptyResponse: StudySessionResponseDTO = {
        cards: [],
        statistics: { total_cards: 0, new_cards: 0, review_cards: 0 },
        has_any_flashcards: false,
      };

      // Act
      const result = await renderAndWaitForFetch(emptyResponse);

      // Assert
      expect(result.current.hasAnyFlashcards).toBe(false);
    });
  });

  // ==========================================================================
  // Refetch
  // ==========================================================================

  describe("fetchSession", () => {
    it("should allow manual refetch", async () => {
      // Arrange
      const result = await renderAndWaitForFetch();
      mockAuthenticatedFetch.mockClear();
      mockSuccessfulFetch(createMockSessionResponse(10));

      // Act
      await act(async () => {
        await result.current.fetchSession();
      });

      // Assert
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith("/api/study/session");
      expect(result.current.progress.totalCards).toBe(10);
    });
  });
});
