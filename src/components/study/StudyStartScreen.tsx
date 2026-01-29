import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, RefreshCw, Play } from "lucide-react";
import type { StudyStartScreenProps } from "./types";

const MAX_NEW_CARDS_PER_SESSION = 20;

export function StudyStartScreen({ statistics, onStartSession, isLoading }: StudyStartScreenProps) {
  const { total_cards, new_cards, review_cards } = statistics;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold">Sesja nauki</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Masz {total_cards} {total_cards === 1 ? "fiszkę" : total_cards < 5 ? "fiszki" : "fiszek"} do przejrzenia
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div
            className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-900/20 px-4 py-3"
            role="listitem"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span className="text-sm font-medium">Nowe fiszki</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">{new_cards}</span>
              <span className="text-sm text-muted-foreground">/{MAX_NEW_CARDS_PER_SESSION}</span>
            </div>
          </div>

          <div
            className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-900/20 px-4 py-3"
            role="listitem"
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span className="text-sm font-medium">Powtórki</span>
            </div>
            <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">{review_cards}</span>
          </div>
        </div>

        {new_cards >= MAX_NEW_CARDS_PER_SESSION && (
          <p className="text-xs text-muted-foreground text-center mb-4">
            Dzienny limit nowych fiszek wynosi {MAX_NEW_CARDS_PER_SESSION}. Pozostałe nowe fiszki pojawią się jutro.
          </p>
        )}

        <Button className="w-full h-12 text-base" size="lg" onClick={onStartSession} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Ładowanie...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" aria-hidden="true" />
              Rozpocznij sesję
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
