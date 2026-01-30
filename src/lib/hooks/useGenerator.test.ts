import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useGenerator } from "./useGenerator";
import { GENERATOR_CONFIG } from "@/components/generator/types";
import type { GenerationResponseDTO } from "@/types";

// Mock authenticatedFetch
vi.mock("@/lib/auth.client", () => ({
  authenticatedFetch: vi.fn(),
}));

// Import mocked module
import { authenticatedFetch } from "@/lib/auth.client";
const mockAuthenticatedFetch = vi.mocked(authenticatedFetch);

// Mock crypto.randomUUID
const mockUUID = vi.fn(() => "test-uuid-123");
vi.stubGlobal("crypto", { randomUUID: mockUUID });

// Mock window.location
const mockLocation = { href: "" };
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Mock localStorage
const localStorageMock: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock[key];
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageMock).forEach((key) => delete localStorageMock[key]);
  }),
  key: vi.fn(),
  length: 0,
};
vi.stubGlobal("localStorage", mockLocalStorage);

describe("useGenerator", () => {
  // ==========================================================================
  // Setup & Teardown
  // ==========================================================================

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedFetch.mockReset();
    Object.keys(localStorageMock).forEach((key) => delete localStorageMock[key]);
    mockLocation.href = "";
    // Return unique UUIDs for each call
    let uuidCounter = 0;
    mockUUID.mockImplementation(() => `test-uuid-${++uuidCounter}`);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  const createValidSourceText = (length = GENERATOR_CONFIG.MIN_SOURCE_TEXT_LENGTH): string => {
    return "a".repeat(length);
  };

  const createMockGenerationResponse = (count = 3): GenerationResponseDTO => ({
    generation_log_id: "gen-log-123",
    proposals: Array.from({ length: count }, (_, i) => ({
      front: `Question ${i + 1}`,
      back: `Answer ${i + 1}`,
    })),
    model_used: "gpt-4",
    generated_count: count,
  });

  const mockSuccessfulGeneration = (response: GenerationResponseDTO = createMockGenerationResponse()) => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    } as Response);
  };

  // ==========================================================================
  // Source Text Validation
  // ==========================================================================

  describe("source text validation", () => {
    it("should mark text as invalid when below minimum length", () => {
      // Arrange & Act
      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.setSourceText("short text");
      });

      // Assert
      expect(result.current.isSourceTextValid).toBe(false);
    });

    it("should mark text as valid when at minimum length", () => {
      // Arrange & Act
      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.setSourceText(createValidSourceText(GENERATOR_CONFIG.MIN_SOURCE_TEXT_LENGTH));
      });

      // Assert
      expect(result.current.isSourceTextValid).toBe(true);
    });

    it("should mark text as valid when at maximum length", () => {
      // Arrange & Act
      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.setSourceText(createValidSourceText(GENERATOR_CONFIG.MAX_SOURCE_TEXT_LENGTH));
      });

      // Assert
      expect(result.current.isSourceTextValid).toBe(true);
    });

    it("should mark text as invalid when above maximum length", () => {
      // Arrange & Act
      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.setSourceText(createValidSourceText(GENERATOR_CONFIG.MAX_SOURCE_TEXT_LENGTH + 1));
      });

      // Assert
      expect(result.current.isSourceTextValid).toBe(false);
    });

    it("should mark empty text as invalid", () => {
      // Arrange & Act
      const { result } = renderHook(() => useGenerator());

      // Assert
      expect(result.current.isSourceTextValid).toBe(false);
      expect(result.current.sourceText).toBe("");
    });
  });

  // ==========================================================================
  // localStorage Persistence
  // ==========================================================================

  describe("localStorage persistence", () => {
    it("should save state to localStorage when source text changes", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      const testText = createValidSourceText();

      // Act
      act(() => {
        result.current.setSourceText(testText);
      });

      // Assert
      await waitFor(() => {
        const saved = localStorageMock[GENERATOR_CONFIG.LOCAL_STORAGE_KEY];
        expect(saved).not.toBeUndefined();
        const parsed = JSON.parse(saved);
        expect(parsed.sourceText).toBe(testText);
      });
    });

    it("should restore state from localStorage on mount", async () => {
      // Arrange
      const savedState = {
        sourceText: "saved source text",
        generationLogId: "saved-log-id",
        proposals: [
          {
            id: "proposal-1",
            front: "Q1",
            back: "A1",
            originalFront: "Q1",
            originalBack: "A1",
            status: "pending",
            isEdited: false,
          },
        ],
      };
      localStorageMock[GENERATOR_CONFIG.LOCAL_STORAGE_KEY] = JSON.stringify(savedState);

      // Act
      const { result } = renderHook(() => useGenerator());

      // Assert
      await waitFor(() => {
        expect(result.current.sourceText).toBe("saved source text");
        expect(result.current.generationLogId).toBe("saved-log-id");
        expect(result.current.proposals).toHaveLength(1);
      });
    });

    it("should handle corrupted localStorage gracefully", () => {
      // Arrange
      localStorageMock[GENERATOR_CONFIG.LOCAL_STORAGE_KEY] = "invalid json {{{";

      // Act & Assert - should not throw
      const { result } = renderHook(() => useGenerator());
      expect(result.current.sourceText).toBe("");
    });

    it("should save proposals to localStorage when they change", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      mockSuccessfulGeneration();

      // Act
      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      await waitFor(() => {
        const saved = localStorageMock[GENERATOR_CONFIG.LOCAL_STORAGE_KEY];
        expect(saved).not.toBeUndefined();
        const parsed = JSON.parse(saved);
        expect(parsed.proposals).toHaveLength(3);
      });
    });
  });

  // ==========================================================================
  // Proposal Status Management
  // ==========================================================================

  describe("proposal status management", () => {
    const setupWithProposals = async () => {
      const { result } = renderHook(() => useGenerator());
      mockSuccessfulGeneration(createMockGenerationResponse(3));

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      return result;
    };

    it("should initialize proposals with pending status", async () => {
      // Arrange & Act
      const result = await setupWithProposals();

      // Assert
      expect(result.current.proposals.every((p) => p.status === "pending")).toBe(true);
      expect(result.current.pendingCount).toBe(3);
      expect(result.current.acceptedCount).toBe(0);
      expect(result.current.rejectedCount).toBe(0);
    });

    it("should accept a single proposal", async () => {
      // Arrange
      const result = await setupWithProposals();
      const proposalId = result.current.proposals[0].id;

      // Act
      act(() => {
        result.current.acceptProposal(proposalId);
      });

      // Assert
      expect(result.current.proposals[0].status).toBe("accepted");
      expect(result.current.acceptedCount).toBe(1);
      expect(result.current.pendingCount).toBe(2);
    });

    it("should reject a single proposal", async () => {
      // Arrange
      const result = await setupWithProposals();
      const proposalId = result.current.proposals[0].id;

      // Act
      act(() => {
        result.current.rejectProposal(proposalId);
      });

      // Assert
      expect(result.current.proposals[0].status).toBe("rejected");
      expect(result.current.rejectedCount).toBe(1);
      expect(result.current.pendingCount).toBe(2);
    });

    it("should accept all pending proposals", async () => {
      // Arrange
      const result = await setupWithProposals();

      // Reject one first
      act(() => {
        result.current.rejectProposal(result.current.proposals[0].id);
      });

      // Act
      act(() => {
        result.current.acceptAllProposals();
      });

      // Assert
      expect(result.current.acceptedCount).toBe(2); // Only pending ones
      expect(result.current.rejectedCount).toBe(1); // Rejected stays rejected
      expect(result.current.pendingCount).toBe(0);
    });

    it("should reject all pending proposals", async () => {
      // Arrange
      const result = await setupWithProposals();

      // Accept one first
      act(() => {
        result.current.acceptProposal(result.current.proposals[0].id);
      });

      // Act
      act(() => {
        result.current.rejectAllProposals();
      });

      // Assert
      expect(result.current.rejectedCount).toBe(2); // Only pending ones
      expect(result.current.acceptedCount).toBe(1); // Accepted stays accepted
      expect(result.current.pendingCount).toBe(0);
    });

    it("should correctly track hasAcceptedProposals", async () => {
      // Arrange
      const result = await setupWithProposals();

      // Assert - initially no accepted
      expect(result.current.hasAcceptedProposals).toBe(false);

      // Act
      act(() => {
        result.current.acceptProposal(result.current.proposals[0].id);
      });

      // Assert
      expect(result.current.hasAcceptedProposals).toBe(true);
    });
  });

  // ==========================================================================
  // Proposal Editing
  // ==========================================================================

  describe("proposal editing", () => {
    const setupWithProposals = async () => {
      const { result } = renderHook(() => useGenerator());
      mockSuccessfulGeneration(createMockGenerationResponse(3));

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      return result;
    };

    it("should open edit modal with correct proposal", async () => {
      // Arrange
      const result = await setupWithProposals();
      const proposalId = result.current.proposals[1].id;

      // Act
      act(() => {
        result.current.openEditModal(proposalId);
      });

      // Assert
      expect(result.current.editingProposal).not.toBeNull();
      expect(result.current.editingProposal?.id).toBe(proposalId);
    });

    it("should close edit modal", async () => {
      // Arrange
      const result = await setupWithProposals();
      act(() => {
        result.current.openEditModal(result.current.proposals[0].id);
      });

      // Act
      act(() => {
        result.current.closeEditModal();
      });

      // Assert
      expect(result.current.editingProposal).toBeNull();
    });

    it("should save edited proposal and mark as edited", async () => {
      // Arrange
      const result = await setupWithProposals();
      const proposalId = result.current.proposals[0].id;
      act(() => {
        result.current.openEditModal(proposalId);
      });

      // Act
      act(() => {
        result.current.saveProposalEdit(proposalId, "New Question", "New Answer");
      });

      // Assert
      const editedProposal = result.current.proposals.find((p) => p.id === proposalId);
      expect(editedProposal?.front).toBe("New Question");
      expect(editedProposal?.back).toBe("New Answer");
      expect(editedProposal?.isEdited).toBe(true);
      expect(editedProposal?.status).toBe("accepted");
      expect(result.current.editingProposal).toBeNull();
    });

    it("should not mark as edited when content unchanged", async () => {
      // Arrange
      const result = await setupWithProposals();
      const proposal = result.current.proposals[0];
      act(() => {
        result.current.openEditModal(proposal.id);
      });

      // Act - save with original content
      act(() => {
        result.current.saveProposalEdit(proposal.id, proposal.originalFront, proposal.originalBack);
      });

      // Assert
      const savedProposal = result.current.proposals.find((p) => p.id === proposal.id);
      expect(savedProposal?.isEdited).toBe(false);
      expect(savedProposal?.status).toBe("accepted");
    });
  });

  // ==========================================================================
  // Generation
  // ==========================================================================

  describe("generation", () => {
    it("should not generate when source text is invalid", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.setSourceText("too short");
      });

      // Act
      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      expect(mockAuthenticatedFetch).not.toHaveBeenCalled();
    });

    it("should set isGenerating during generation", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      let resolvePromise: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });

      mockAuthenticatedFetch.mockReturnValueOnce(pendingPromise);

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      // Act
      let generatePromise: Promise<void>;
      act(() => {
        generatePromise = result.current.generateFlashcards();
      });

      // Assert - during generation
      expect(result.current.isGenerating).toBe(true);

      // Cleanup
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(createMockGenerationResponse()),
        } as Response);
        await generatePromise;
      });

      expect(result.current.isGenerating).toBe(false);
    });

    it("should map response to proposals correctly", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      const mockResponse = createMockGenerationResponse(2);
      mockSuccessfulGeneration(mockResponse);

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      // Act
      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      expect(result.current.proposals).toHaveLength(2);
      expect(result.current.proposals[0].front).toBe("Question 1");
      expect(result.current.proposals[0].back).toBe("Answer 1");
      expect(result.current.proposals[0].originalFront).toBe("Question 1");
      expect(result.current.proposals[0].originalBack).toBe("Answer 1");
      expect(result.current.generationLogId).toBe("gen-log-123");
    });

    it("should handle 401 by redirecting to login", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      // Act
      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      expect(mockLocation.href).toBe("/login");
    });

    it("should handle 400 with source text error", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Invalid source text" }),
      } as unknown as Response);

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      // Act
      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      expect(result.current.generationError).toBeNull();
      // sourceText error is handled separately (not exposed as generationError)
    });

    it("should handle 502 service unavailable", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
      } as Response);

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      // Act
      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      expect(result.current.generationError).toBe("Usługa AI jest chwilowo niedostępna. Spróbuj ponownie.");
    });

    it("should handle 503 rate limit", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      // Act
      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      expect(result.current.generationError).toBe("Przekroczono limit zapytań. Spróbuj ponownie za chwilę.");
    });

    it("should handle network error", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      mockAuthenticatedFetch.mockRejectedValueOnce(new Error("Network error"));

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      // Act
      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      expect(result.current.generationError).toBe("Nie można połączyć z serwerem. Sprawdź połączenie internetowe.");
    });
  });

  // ==========================================================================
  // Saving Proposals
  // ==========================================================================

  describe("saving proposals", () => {
    it("should return false when no accepted proposals", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      mockSuccessfulGeneration();

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      // All proposals still pending

      // Act
      let success: boolean;
      await act(async () => {
        success = await result.current.saveAcceptedProposals();
      });

      // Assert
      expect(success!).toBe(false);
    });

    it("should send correct batch command", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      mockSuccessfulGeneration(createMockGenerationResponse(3));

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      await waitFor(() => {
        expect(result.current.proposals.length).toBe(3);
      });

      // Accept some proposals
      act(() => {
        result.current.acceptProposal(result.current.proposals[0].id);
        result.current.acceptProposal(result.current.proposals[1].id);
        result.current.rejectProposal(result.current.proposals[2].id);
      });

      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ created_count: 2, flashcards: [] }),
      } as Response);

      // Act
      await act(async () => {
        await result.current.saveAcceptedProposals();
      });

      // Assert
      expect(mockAuthenticatedFetch).toHaveBeenLastCalledWith(
        "/api/flashcards/batch",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"rejected_count":1'),
        })
      );
    });

    it("should clear state after successful save", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      mockSuccessfulGeneration(createMockGenerationResponse(3));

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      await waitFor(() => {
        expect(result.current.proposals.length).toBe(3);
      });

      // Verify proposals exist before accepting
      expect(result.current.proposals).toHaveLength(3);
      const proposal0Id = result.current.proposals[0].id;
      const proposal1Id = result.current.proposals[1].id;
      const proposal2Id = result.current.proposals[2].id;

      // Accept some proposals - one at a time for debugging
      act(() => {
        result.current.acceptProposal(proposal0Id);
      });

      // Check after first accept
      expect(result.current.proposals[0].status).toBe("accepted");

      act(() => {
        result.current.acceptProposal(proposal1Id);
      });

      act(() => {
        result.current.rejectProposal(proposal2Id);
      });

      // Verify preconditions
      expect(result.current.acceptedCount).toBe(2);
      expect(result.current.generationLogId).not.toBeNull();

      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ created_count: 2, flashcards: [] }),
      } as Response);

      // Act
      let success: boolean;
      await act(async () => {
        success = await result.current.saveAcceptedProposals();
      });

      // Assert
      expect(success!).toBe(true);
      expect(result.current.sourceText).toBe("");
      expect(result.current.proposals).toHaveLength(0);
      expect(result.current.generationLogId).toBeNull();
      // localStorage should be cleared (removeItem is called, so key should not exist)
      // Note: The hook calls clearLocalStorage which uses removeItem, but useEffect also syncs state
      // After clearing, the useEffect will save the empty state back
      const savedState = localStorageMock[GENERATOR_CONFIG.LOCAL_STORAGE_KEY];
      if (savedState) {
        const parsed = JSON.parse(savedState);
        expect(parsed.sourceText).toBe("");
        expect(parsed.proposals).toHaveLength(0);
      }
    });

    it("should handle 404 generation expired", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      mockSuccessfulGeneration(createMockGenerationResponse(3));

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      await waitFor(() => {
        expect(result.current.proposals.length).toBe(3);
      });

      // Accept some proposals
      act(() => {
        result.current.acceptProposal(result.current.proposals[0].id);
      });

      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      // Act
      let success: boolean;
      await act(async () => {
        success = await result.current.saveAcceptedProposals();
      });

      // Assert
      expect(success!).toBe(false);
      expect(result.current.saveError).toBe("Sesja generowania wygasła. Wygeneruj fiszki ponownie.");
    });

    it("should set isSaving during save operation", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      mockSuccessfulGeneration(createMockGenerationResponse(3));

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      await waitFor(() => {
        expect(result.current.proposals.length).toBe(3);
      });

      // Accept some proposals
      act(() => {
        result.current.acceptProposal(result.current.proposals[0].id);
      });

      let resolvePromise: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });

      mockAuthenticatedFetch.mockReturnValueOnce(pendingPromise);

      // Act
      let savePromise: Promise<boolean>;
      act(() => {
        savePromise = result.current.saveAcceptedProposals();
      });

      // Assert - during save
      expect(result.current.isSaving).toBe(true);

      // Cleanup
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve({ created_count: 2, flashcards: [] }),
        } as Response);
        await savePromise;
      });

      expect(result.current.isSaving).toBe(false);
    });
  });

  // ==========================================================================
  // Clear Staging Area
  // ==========================================================================

  describe("clearStagingArea", () => {
    it("should clear proposals and generationLogId", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      mockSuccessfulGeneration(createMockGenerationResponse(3));

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      expect(result.current.proposals.length).toBeGreaterThan(0);
      expect(result.current.generationLogId).not.toBeNull();

      // Act
      act(() => {
        result.current.clearStagingArea();
      });

      // Assert
      expect(result.current.proposals).toHaveLength(0);
      expect(result.current.generationLogId).toBeNull();
      // sourceText should remain
      expect(result.current.sourceText).not.toBe("");
    });
  });

  // ==========================================================================
  // Elapsed Time Counter
  // ==========================================================================

  describe("elapsed time counter", () => {
    it("should increment elapsed time during generation", async () => {
      // Arrange
      vi.useFakeTimers();
      const { result } = renderHook(() => useGenerator());
      let resolvePromise: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });

      mockAuthenticatedFetch.mockReturnValueOnce(pendingPromise);

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      // Act - start generation
      let generatePromise: Promise<void>;
      act(() => {
        generatePromise = result.current.generateFlashcards();
      });

      // Advance timers
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Assert
      expect(result.current.elapsedTime).toBe(3);

      // Cleanup
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(createMockGenerationResponse()),
        } as Response);
        await generatePromise;
      });
    });

    it("should reset elapsed time after generation completes", async () => {
      // Arrange
      vi.useFakeTimers();
      const { result } = renderHook(() => useGenerator());

      let resolvePromise: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockAuthenticatedFetch.mockReturnValueOnce(pendingPromise);

      act(() => {
        result.current.setSourceText(createValidSourceText());
      });

      // Act - start generation
      let generatePromise: Promise<void>;
      act(() => {
        generatePromise = result.current.generateFlashcards();
      });

      // Advance time to accumulate elapsed time
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.elapsedTime).toBe(2);

      // Complete the generation
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(createMockGenerationResponse()),
        } as Response);
        await generatePromise;
      });

      // Assert - after completion, elapsedTime resets
      expect(result.current.elapsedTime).toBe(0);
    });
  });
});
