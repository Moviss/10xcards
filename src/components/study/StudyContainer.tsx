import { useEffect, useCallback } from "react";
import { useStudySession } from "@/lib/hooks/useStudySession";
import { StudyStartScreen } from "./StudyStartScreen";
import { StudyFlashcard } from "./StudyFlashcard";
import { StudyProgress } from "./StudyProgress";
import { StudySummary } from "./StudySummary";
import { InterruptButton } from "./InterruptButton";
import { EmptyState } from "./EmptyState";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingState() {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function StudyContainer() {
  const {
    status,
    statistics,
    currentCard,
    progress,
    isRevealed,
    isSubmitting,
    summary,
    error,
    hasAnyFlashcards,
    startSession,
    revealCard,
    submitAnswer,
    interruptSession,
    finishSession,
  } = useStudySession();

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error, { duration: 5000 });
    }
  }, [error]);

  // Keyboard shortcuts
  useEffect(() => {
    if (status !== "studying") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case " ": // Space - reveal card
          if (!isRevealed) {
            event.preventDefault();
            revealCard();
          }
          break;
        case "Enter": // Enter - remembered
          if (isRevealed && !isSubmitting) {
            event.preventDefault();
            submitAnswer(true);
          }
          break;
        case "Backspace": // Backspace - forgotten
          if (isRevealed && !isSubmitting) {
            event.preventDefault();
            submitAnswer(false);
          }
          break;
        case "Escape": // Escape - interrupt session
          event.preventDefault();
          interruptSession();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, isRevealed, isSubmitting, revealCard, submitAnswer, interruptSession]);

  // Memoized handlers
  const handleAnswer = useCallback(
    async (remembered: boolean) => {
      await submitAnswer(remembered);
    },
    [submitAnswer]
  );

  // Render based on status
  const renderContent = () => {
    switch (status) {
      case "idle":
      case "loading":
        return <LoadingState />;

      case "empty":
        return <EmptyState hasAnyFlashcards={hasAnyFlashcards} />;

      case "ready":
        if (!statistics) return <LoadingState />;
        return <StudyStartScreen statistics={statistics} onStartSession={startSession} isLoading={false} />;

      case "studying":
        if (!currentCard) return <LoadingState />;
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <StudyProgress
                currentIndex={progress.currentIndex}
                totalCards={progress.totalCards}
                rememberedCount={progress.rememberedCount}
                forgottenCount={progress.forgottenCount}
              />
              <InterruptButton onInterrupt={interruptSession} isSubmitting={isSubmitting} />
            </div>

            <StudyFlashcard
              card={currentCard}
              isRevealed={isRevealed}
              onReveal={revealCard}
              onAnswer={handleAnswer}
              isSubmitting={isSubmitting}
            />

            {/* Keyboard shortcuts hint */}
            <div className="text-center text-xs text-muted-foreground hidden sm:block">
              <span className="inline-flex items-center gap-4">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Spacja</kbd> pokaż odpowiedź
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Enter</kbd> pamiętam
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Backspace</kbd> nie pamiętam
                </span>
              </span>
            </div>
          </div>
        );

      case "completed":
      case "interrupted":
        if (!summary) return <LoadingState />;
        return <StudySummary summary={summary} isInterrupted={status === "interrupted"} onFinish={finishSession} />;

      default:
        return <LoadingState />;
    }
  };

  return (
    <section aria-labelledby="study-title" className="w-full">
      <h1 id="study-title" className="sr-only">
        Sesja nauki fiszek
      </h1>

      <div className="flex flex-col items-center justify-center min-h-[60vh] py-8">{renderContent()}</div>
    </section>
  );
}
