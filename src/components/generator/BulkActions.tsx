import { memo } from "react";
import { Button } from "@/components/ui/button";

interface BulkActionsProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  disabled?: boolean;
  pendingCount: number;
}

export const BulkActions = memo(function BulkActions({
  onAcceptAll,
  onRejectAll,
  disabled = false,
  pendingCount,
}: BulkActionsProps) {
  const hasNoPending = pendingCount === 0;

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Akcje masowe">
      <Button
        variant="outline"
        size="sm"
        onClick={onAcceptAll}
        disabled={disabled || hasNoPending}
        aria-label={`Akceptuj wszystkie oczekujące propozycje (${pendingCount})`}
        className="border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300"
        data-testid="accept-all-button"
      >
        Akceptuj wszystkie ({pendingCount})
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onRejectAll}
        disabled={disabled || hasNoPending}
        aria-label={`Odrzuć wszystkie oczekujące propozycje (${pendingCount})`}
        className="border-destructive text-destructive hover:bg-destructive/10"
      >
        Odrzuć wszystkie ({pendingCount})
      </Button>
    </div>
  );
});
