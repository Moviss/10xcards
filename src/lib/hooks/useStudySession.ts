import { useState, useCallback, useEffect, useRef } from "react";
import type { StudyCardDTO, StudySessionStatisticsDTO, StudySessionResponseDTO, SubmitReviewCommand } from "@/types";
import type {
  StudySessionStatus,
  SessionProgress,
  SessionSummary,
  AnswerRecord,
  UseStudySessionReturn,
} from "@/components/study/types";
import { errorMessages } from "@/components/study/types";
import { authenticatedFetch } from "@/lib/auth.client";

// =============================================================================
// API Functions
// =============================================================================

async function fetchStudySessionApi(): Promise<StudySessionResponseDTO> {
  const response = await authenticatedFetch("/api/study/session");

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(errorMessages.serverError);
  }

  return response.json();
}

async function submitReviewApi(command: SubmitReviewCommand): Promise<void> {
  const response = await authenticatedFetch("/api/study/review", {
    method: "POST",
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 404) {
      throw new Error(errorMessages.flashcardNotFound);
    }
    if (response.status === 400) {
      throw new Error(errorMessages.invalidReview);
    }
    throw new Error(errorMessages.serverError);
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function handleUnauthorized(): void {
  sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
  window.location.href = "/login";
}

function createInitialProgress(): SessionProgress {
  return {
    currentIndex: 0,
    totalCards: 0,
    answeredCount: 0,
    rememberedCount: 0,
    forgottenCount: 0,
  };
}

function calculateSummary(answerRecords: AnswerRecord[]): SessionSummary {
  const totalReviewed = answerRecords.length;
  const newCardsReviewed = answerRecords.filter((r) => r.isNew).length;
  const reviewCardsReviewed = totalReviewed - newCardsReviewed;
  const rememberedCount = answerRecords.filter((r) => r.remembered).length;
  const forgottenCount = totalReviewed - rememberedCount;
  const successRate = totalReviewed > 0 ? Math.round((rememberedCount / totalReviewed) * 100) : 0;

  return {
    totalReviewed,
    newCardsReviewed,
    reviewCardsReviewed,
    rememberedCount,
    forgottenCount,
    successRate,
  };
}

// =============================================================================
// Hook
// =============================================================================

export function useStudySession(): UseStudySessionReturn {
  // Session state
  const [status, setStatus] = useState<StudySessionStatus>("idle");
  const [cards, setCards] = useState<StudyCardDTO[]>([]);
  const [statistics, setStatistics] = useState<StudySessionStatisticsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Display state
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Progress tracking
  const [progress, setProgress] = useState<SessionProgress>(createInitialProgress());
  const answerRecordsRef = useRef<AnswerRecord[]>([]);

  // Summary state
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  // Computed current card
  const currentCard =
    status === "studying" && progress.currentIndex < cards.length ? cards[progress.currentIndex] : null;

  // Fetch session from API
  const fetchSession = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const response = await fetchStudySessionApi();

      setCards(response.cards);
      setStatistics(response.statistics);

      if (response.cards.length === 0) {
        setStatus("empty");
      } else {
        setStatus("ready");
        setProgress({
          ...createInitialProgress(),
          totalCards: response.cards.length,
        });
      }
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        handleUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : errorMessages.networkError);
      setStatus("idle");
    }
  }, []);

  // Start session
  const startSession = useCallback(() => {
    if (status !== "ready" || cards.length === 0) {
      return;
    }

    setStatus("studying");
    setIsRevealed(false);
    answerRecordsRef.current = [];
  }, [status, cards.length]);

  // Reveal card
  const revealCard = useCallback(() => {
    if (!isRevealed && status === "studying") {
      setIsRevealed(true);
    }
  }, [isRevealed, status]);

  // Submit answer
  const submitAnswer = useCallback(
    async (remembered: boolean) => {
      if (!currentCard || isSubmitting || status !== "studying") {
        return;
      }

      setIsSubmitting(true);

      // Record the answer immediately (optimistic)
      const record: AnswerRecord = {
        flashcardId: currentCard.id,
        isNew: currentCard.is_new,
        remembered,
        timestamp: new Date(),
      };
      answerRecordsRef.current.push(record);

      // Update progress
      const newAnsweredCount = progress.answeredCount + 1;
      const newRememberedCount = remembered ? progress.rememberedCount + 1 : progress.rememberedCount;
      const newForgottenCount = remembered ? progress.forgottenCount : progress.forgottenCount + 1;
      const newIndex = progress.currentIndex + 1;
      const isLastCard = newIndex >= cards.length;

      setProgress({
        ...progress,
        currentIndex: newIndex,
        answeredCount: newAnsweredCount,
        rememberedCount: newRememberedCount,
        forgottenCount: newForgottenCount,
      });

      // Reset reveal state for next card
      setIsRevealed(false);

      // Send to API in background
      try {
        await submitReviewApi({
          flashcard_id: currentCard.id,
          remembered,
        });
      } catch (err) {
        // Don't block the flow - API call is fire-and-forget
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          handleUnauthorized();
          return;
        }
        // Continue despite error - the answer is already recorded locally
      } finally {
        setIsSubmitting(false);
      }

      // Check if session is complete
      if (isLastCard) {
        const sessionSummary = calculateSummary(answerRecordsRef.current);
        setSummary(sessionSummary);
        setStatus("completed");
      }
    },
    [currentCard, isSubmitting, status, progress, cards.length]
  );

  // Interrupt session
  const interruptSession = useCallback(() => {
    if (status !== "studying") {
      return;
    }

    const sessionSummary = calculateSummary(answerRecordsRef.current);
    setSummary(sessionSummary);
    setStatus("interrupted");
  }, [status]);

  // Finish session (navigate away)
  const finishSession = useCallback(() => {
    window.location.href = "/flashcards";
  }, []);

  // Fetch session on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    // Stan
    status,
    statistics,
    currentCard,
    progress,
    isRevealed,
    isSubmitting,
    summary,
    error,

    // Akcje
    fetchSession,
    startSession,
    revealCard,
    submitAnswer,
    interruptSession,
    finishSession,
  };
}
