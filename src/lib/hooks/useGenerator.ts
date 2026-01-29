import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  GenerateFlashcardsCommand,
  GenerationResponseDTO,
  CreateFlashcardsBatchCommand,
  FlashcardsBatchResponseDTO,
} from "@/types";
import type { ProposalViewModel, GeneratorState, GeneratorErrors } from "@/components/generator/types";
import { GENERATOR_CONFIG } from "@/components/generator/types";

interface UseGeneratorReturn {
  // Form state
  sourceText: string;
  setSourceText: (text: string) => void;

  // Generation state
  isGenerating: boolean;
  generationError: string | null;
  elapsedTime: number;

  // Staging Area state
  proposals: ProposalViewModel[];
  generationLogId: string | null;

  // Save state
  isSaving: boolean;
  saveError: string | null;

  // Edit modal state
  editingProposal: ProposalViewModel | null;

  // Generation actions
  generateFlashcards: () => Promise<void>;

  // Proposal actions
  acceptProposal: (id: string) => void;
  rejectProposal: (id: string) => void;
  acceptAllProposals: () => void;
  rejectAllProposals: () => void;

  // Edit actions
  openEditModal: (id: string) => void;
  closeEditModal: () => void;
  saveProposalEdit: (id: string, front: string, back: string) => void;

  // Save action
  saveAcceptedProposals: () => Promise<void>;

  // Helpers
  hasAcceptedProposals: boolean;
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  clearStagingArea: () => void;
  isSourceTextValid: boolean;
}

function loadStateFromLocalStorage(): GeneratorState | null {
  try {
    const saved = localStorage.getItem(GENERATOR_CONFIG.LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as GeneratorState;
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

function saveStateToLocalStorage(state: GeneratorState): void {
  try {
    localStorage.setItem(GENERATOR_CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage errors
  }
}

function clearLocalStorage(): void {
  try {
    localStorage.removeItem(GENERATOR_CONFIG.LOCAL_STORAGE_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

export function useGenerator(): UseGeneratorReturn {
  // Form state
  const [sourceText, setSourceTextState] = useState("");
  const [generationLogId, setGenerationLogId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<ProposalViewModel[]>([]);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Error state
  const [errors, setErrors] = useState<GeneratorErrors>({});

  // Save state
  const [isSaving, setIsSaving] = useState(false);

  // Edit modal state
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const saved = loadStateFromLocalStorage();
    if (saved) {
      setSourceTextState(saved.sourceText);
      setGenerationLogId(saved.generationLogId);
      setProposals(saved.proposals);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    const state: GeneratorState = {
      sourceText,
      generationLogId,
      proposals,
    };
    saveStateToLocalStorage(state);
  }, [sourceText, generationLogId, proposals]);

  // Timer for elapsedTime during generation
  useEffect(() => {
    if (!isGenerating) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Source text validation
  const isSourceTextValid = useMemo(() => {
    const length = sourceText.length;
    return length >= GENERATOR_CONFIG.MIN_SOURCE_TEXT_LENGTH && length <= GENERATOR_CONFIG.MAX_SOURCE_TEXT_LENGTH;
  }, [sourceText]);

  // Set source text and clear error
  const setSourceText = useCallback((text: string) => {
    setSourceTextState(text);
    setErrors((prev) => ({ ...prev, sourceText: undefined }));
  }, []);

  // Generate flashcards
  const generateFlashcards = useCallback(async () => {
    if (!isSourceTextValid) {
      return;
    }

    setIsGenerating(true);
    setErrors({});

    try {
      const command: GenerateFlashcardsCommand = {
        source_text: sourceText,
      };

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 400) {
          const errorData = await response.json();
          setErrors({ sourceText: errorData.error || "Tekst źródłowy jest nieprawidłowy" });
          return;
        }

        if (response.status === 502) {
          setErrors({ generation: "Usługa AI jest chwilowo niedostępna. Spróbuj ponownie." });
          return;
        }

        if (response.status === 503) {
          setErrors({ generation: "Przekroczono limit zapytań. Spróbuj ponownie za chwilę." });
          return;
        }

        setErrors({ generation: "Wystąpił błąd podczas generowania. Spróbuj ponownie." });
        return;
      }

      const data: GenerationResponseDTO = await response.json();

      // Map response to ProposalViewModel
      const newProposals: ProposalViewModel[] = data.proposals.map((proposal) => ({
        id: crypto.randomUUID(),
        front: proposal.front,
        back: proposal.back,
        originalFront: proposal.front,
        originalBack: proposal.back,
        status: "pending" as const,
        isEdited: false,
      }));

      setGenerationLogId(data.generation_log_id);
      setProposals(newProposals);
    } catch {
      setErrors({ generation: "Nie można połączyć z serwerem. Sprawdź połączenie internetowe." });
    } finally {
      setIsGenerating(false);
    }
  }, [sourceText, isSourceTextValid]);

  // Proposal actions
  const acceptProposal = useCallback((id: string) => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status: "accepted" as const } : p)));
  }, []);

  const rejectProposal = useCallback((id: string) => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status: "rejected" as const } : p)));
  }, []);

  const acceptAllProposals = useCallback(() => {
    setProposals((prev) => prev.map((p) => (p.status === "pending" ? { ...p, status: "accepted" as const } : p)));
  }, []);

  const rejectAllProposals = useCallback(() => {
    setProposals((prev) => prev.map((p) => (p.status === "pending" ? { ...p, status: "rejected" as const } : p)));
  }, []);

  // Edit modal
  const editingProposal = useMemo(() => {
    if (!editingProposalId) return null;
    return proposals.find((p) => p.id === editingProposalId) || null;
  }, [editingProposalId, proposals]);

  const openEditModal = useCallback((id: string) => {
    setEditingProposalId(id);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingProposalId(null);
  }, []);

  const saveProposalEdit = useCallback((id: string, front: string, back: string) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const isEdited = front !== p.originalFront || back !== p.originalBack;
        return {
          ...p,
          front,
          back,
          status: "accepted" as const,
          isEdited,
        };
      })
    );
    setEditingProposalId(null);
  }, []);

  // Save accepted proposals
  const saveAcceptedProposals = useCallback(async () => {
    const acceptedProposals = proposals.filter((p) => p.status === "accepted");

    if (acceptedProposals.length === 0 || !generationLogId) {
      return;
    }

    setIsSaving(true);
    setErrors((prev) => ({ ...prev, save: undefined }));

    try {
      const command: CreateFlashcardsBatchCommand = {
        generation_log_id: generationLogId,
        flashcards: acceptedProposals.map((p) => ({
          front: p.front,
          back: p.back,
          original_front: p.originalFront,
          original_back: p.originalBack,
          is_edited: p.isEdited,
        })),
        rejected_count: proposals.filter((p) => p.status === "rejected").length,
      };

      const response = await fetch("/api/flashcards/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 404) {
          setErrors({ save: "Sesja generowania wygasła. Wygeneruj fiszki ponownie." });
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        setErrors({ save: errorData.error || "Wystąpił błąd serwera. Spróbuj ponownie." });
        return;
      }

      const _result: FlashcardsBatchResponseDTO = await response.json();

      // Clear state after success
      setSourceTextState("");
      setGenerationLogId(null);
      setProposals([]);
      clearLocalStorage();

      return;
    } catch {
      setErrors({ save: "Nie można połączyć z serwerem. Sprawdź połączenie internetowe." });
    } finally {
      setIsSaving(false);
    }
  }, [proposals, generationLogId]);

  // Helper calculations
  const acceptedCount = useMemo(() => proposals.filter((p) => p.status === "accepted").length, [proposals]);

  const rejectedCount = useMemo(() => proposals.filter((p) => p.status === "rejected").length, [proposals]);

  const pendingCount = useMemo(() => proposals.filter((p) => p.status === "pending").length, [proposals]);

  const hasAcceptedProposals = acceptedCount > 0;

  // Clear Staging Area
  const clearStagingArea = useCallback(() => {
    setGenerationLogId(null);
    setProposals([]);
  }, []);

  return {
    // Form state
    sourceText,
    setSourceText,

    // Generation state
    isGenerating,
    generationError: errors.generation || null,
    elapsedTime,

    // Staging Area state
    proposals,
    generationLogId,

    // Save state
    isSaving,
    saveError: errors.save || null,

    // Edit modal state
    editingProposal,

    // Generation actions
    generateFlashcards,

    // Proposal actions
    acceptProposal,
    rejectProposal,
    acceptAllProposals,
    rejectAllProposals,

    // Edit actions
    openEditModal,
    closeEditModal,
    saveProposalEdit,

    // Save action
    saveAcceptedProposals,

    // Helpers
    hasAcceptedProposals,
    acceptedCount,
    rejectedCount,
    pendingCount,
    clearStagingArea,
    isSourceTextValid,
  };
}
