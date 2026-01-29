import { Button } from "@/components/ui/button";
import { Trophy, CheckCircle, XCircle, Sparkles, RefreshCw, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudySummaryProps } from "./types";

export function StudySummary({ summary, isInterrupted, onFinish }: StudySummaryProps) {
  const { totalReviewed, newCardsReviewed, reviewCardsReviewed, rememberedCount, forgottenCount, successRate } = summary;

  const getSuccessMessage = () => {
    if (totalReviewed === 0) {
      return "Nie przejrzałeś żadnych fiszek.";
    }
    if (successRate >= 90) {
      return "Doskonale! Świetna pamięć!";
    }
    if (successRate >= 70) {
      return "Bardzo dobrze! Tak trzymaj!";
    }
    if (successRate >= 50) {
      return "Nieźle! Praktyka czyni mistrza.";
    }
    return "Nie poddawaj się! Każda powtórka to krok naprzód.";
  };

  const getSuccessColor = () => {
    if (successRate >= 70) return "text-green-600 dark:text-green-400";
    if (successRate >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div
            className={cn(
              "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full",
              isInterrupted ? "bg-amber-100 dark:bg-amber-900/30" : "bg-green-100 dark:bg-green-900/30"
            )}
          >
            <Trophy
              className={cn("h-6 w-6", isInterrupted ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400")}
              aria-hidden="true"
            />
          </div>
          <h2 className="text-xl font-semibold">{isInterrupted ? "Sesja przerwana" : "Sesja zakończona!"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{getSuccessMessage()}</p>
        </div>

        {/* Success Rate */}
        {totalReviewed > 0 && (
          <div className="mb-6 text-center">
            <div className={cn("text-4xl font-bold", getSuccessColor())}>{successRate}%</div>
            <p className="text-sm text-muted-foreground">skuteczność</p>
          </div>
        )}

        {/* Statistics */}
        <div className="space-y-3 mb-6" role="list" aria-label="Statystyki sesji">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3" role="listitem">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm">Przejrzane fiszki</span>
            </div>
            <span className="text-lg font-semibold">{totalReviewed}</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-green-50 dark:bg-green-900/20 px-4 py-3" role="listitem">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
              <span className="text-sm">Zapamiętane</span>
            </div>
            <span className="text-lg font-semibold text-green-600 dark:text-green-400">{rememberedCount}</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3" role="listitem">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              <span className="text-sm">Zapomniane</span>
            </div>
            <span className="text-lg font-semibold text-red-600 dark:text-red-400">{forgottenCount}</span>
          </div>

          {(newCardsReviewed > 0 || reviewCardsReviewed > 0) && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between px-4 py-2" role="listitem">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">Nowe fiszki</span>
                </div>
                <span className="text-sm font-medium">{newCardsReviewed}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2" role="listitem">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">Powtórki</span>
                </div>
                <span className="text-sm font-medium">{reviewCardsReviewed}</span>
              </div>
            </div>
          )}
        </div>

        <Button className="w-full h-12 text-base" size="lg" onClick={onFinish}>
          <BookOpen className="mr-2 h-5 w-5" aria-hidden="true" />
          Przejdź do fiszek
        </Button>
      </div>
    </div>
  );
}
