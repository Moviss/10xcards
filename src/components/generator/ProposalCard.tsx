import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProposalViewModel } from "./types";

interface ProposalCardProps {
  proposal: ProposalViewModel;
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
  disabled?: boolean;
}

export const ProposalCard = memo(function ProposalCard({
  proposal,
  onAccept,
  onReject,
  onEdit,
  disabled = false,
}: ProposalCardProps) {
  const { front, back, status, isEdited } = proposal;

  const borderColorClass = {
    pending: "border-border",
    accepted: "border-green-500 dark:border-green-600",
    rejected: "border-destructive",
  }[status];

  const statusBadge = {
    pending: null,
    accepted: (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Zaakceptowana
        {isEdited && " (edytowana)"}
      </span>
    ),
    rejected: (
      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        Odrzucona
      </span>
    ),
  }[status];

  const statusLabel = {
    pending: "oczekująca",
    accepted: isEdited ? "zaakceptowana (edytowana)" : "zaakceptowana",
    rejected: "odrzucona",
  }[status];

  return (
    <article
      className={cn("rounded-lg border-2 bg-card p-4 shadow-sm transition-colors", borderColorClass)}
      aria-label={`Propozycja fiszki - ${statusLabel}`}
      data-testid="proposal-card"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Propozycja fiszki</h3>
          {statusBadge}
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Przód</p>
            <p className="mt-1 text-sm">{front}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tył</p>
            <p className="mt-1 text-sm">{back}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2" role="group" aria-label="Akcje propozycji">
          {status !== "accepted" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAccept}
              disabled={disabled}
              aria-label="Akceptuj tę propozycję"
              className="border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300"
            >
              Akceptuj
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onEdit} disabled={disabled} aria-label="Edytuj tę propozycję">
            Edytuj
          </Button>
          {status !== "rejected" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              disabled={disabled}
              aria-label="Odrzuć tę propozycję"
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              Odrzuć
            </Button>
          )}
        </div>
      </div>
    </article>
  );
});
