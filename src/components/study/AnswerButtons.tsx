import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";
import type { AnswerButtonsProps } from "./types";

export function AnswerButtons({ onAnswer, isSubmitting }: AnswerButtonsProps) {
  const handleForgotten = useCallback(() => {
    onAnswer(false);
  }, [onAnswer]);

  const handleRemembered = useCallback(() => {
    onAnswer(true);
  }, [onAnswer]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full" role="group" aria-label="Przyciski oceny odpowiedzi">
      <Button
        variant="destructive"
        size="lg"
        className="flex-1 h-14 text-base"
        onClick={handleForgotten}
        disabled={isSubmitting}
        aria-describedby="forgotten-hint"
      >
        <X className="mr-2 h-5 w-5" aria-hidden="true" />
        Nie pamiętam
      </Button>
      <span id="forgotten-hint" className="sr-only">
        Naciśnij jeśli nie znasz odpowiedzi
      </span>

      <Button
        variant="default"
        size="lg"
        className="flex-1 h-14 text-base bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
        onClick={handleRemembered}
        disabled={isSubmitting}
        aria-describedby="remembered-hint"
      >
        <Check className="mr-2 h-5 w-5" aria-hidden="true" />
        Pamiętam
      </Button>
      <span id="remembered-hint" className="sr-only">
        Naciśnij jeśli znasz odpowiedź
      </span>
    </div>
  );
}
