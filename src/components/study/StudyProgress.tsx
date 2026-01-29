import { useId } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle } from "lucide-react";
import type { StudyProgressProps } from "./types";

export function StudyProgress({ currentIndex, totalCards, rememberedCount, forgottenCount }: StudyProgressProps) {
  const progressId = useId();
  const progressValue = totalCards > 0 ? Math.round((currentIndex / totalCards) * 100) : 0;

  return (
    <div className="w-full space-y-2" role="region" aria-label="Postęp sesji nauki">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Karta <span className="font-medium text-foreground">{Math.min(currentIndex + 1, totalCards)}</span> z{" "}
          <span className="font-medium text-foreground">{totalCards}</span>
        </span>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Zapamiętane: </span>
            {rememberedCount}
          </span>
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <XCircle className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Zapomniane: </span>
            {forgottenCount}
          </span>
        </div>
      </div>

      <Progress
        id={progressId}
        value={progressValue}
        aria-label={`Postęp: ${progressValue}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressValue}
      />
    </div>
  );
}
