import { useCallback, useId } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnswerButtons } from "./AnswerButtons";
import type { StudyFlashcardProps } from "./types";

export function StudyFlashcard({ card, isRevealed, onReveal, onAnswer, isSubmitting }: StudyFlashcardProps) {
  const cardId = useId();
  const frontId = `${cardId}-front`;
  const backId = `${cardId}-back`;

  const handleCardClick = useCallback(() => {
    if (!isRevealed) {
      onReveal();
    }
  }, [isRevealed, onReveal]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isRevealed && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        onReveal();
      }
    },
    [isRevealed, onReveal]
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div
        role={!isRevealed ? "button" : undefined}
        aria-labelledby={frontId}
        aria-describedby={isRevealed ? backId : undefined}
        className={cn(
          "relative min-h-[300px] rounded-xl border-2 bg-card shadow-lg transition-all duration-300",
          !isRevealed && "cursor-pointer hover:border-primary/50 hover:shadow-xl",
          isRevealed && "border-primary"
        )}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={!isRevealed ? 0 : -1}
      >
        {/* Front side */}
        <div className="p-6 sm:p-8">
          <div className="mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pytanie</span>
            {card.is_new && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Nowa
              </span>
            )}
          </div>
          <p id={frontId} className="text-lg sm:text-xl font-medium leading-relaxed">
            {card.front}
          </p>
        </div>

        {/* Reveal button or Back side */}
        {!isRevealed ? (
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onReveal();
              }}
              aria-label="Pokaż odpowiedź"
            >
              <Eye className="mr-2 h-5 w-5" aria-hidden="true" />
              Pokaż odpowiedź
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              "border-t border-border p-6 sm:p-8",
              "animate-in fade-in slide-in-from-bottom-4 duration-300",
              "motion-reduce:animate-none"
            )}
          >
            <div className="mb-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Odpowiedź</span>
            </div>
            <p id={backId} className="text-lg sm:text-xl leading-relaxed text-foreground/90">
              {card.back}
            </p>
          </div>
        )}
      </div>

      {/* Answer buttons - shown only when card is revealed */}
      {isRevealed && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none">
          <AnswerButtons onAnswer={onAnswer} isSubmitting={isSubmitting} />
        </div>
      )}

      {/* Screen reader announcement */}
      <div aria-live="polite" className="sr-only">
        {isRevealed ? "Odpowiedź została odsłonięta. Wybierz czy pamiętasz." : "Naciśnij aby zobaczyć odpowiedź."}
      </div>
    </div>
  );
}
