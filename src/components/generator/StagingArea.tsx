import { useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BulkActions } from "./BulkActions";
import { ProposalCard } from "./ProposalCard";
import type { ProposalViewModel } from "./types";

interface StagingAreaProps {
  proposals: ProposalViewModel[];
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string) => void;
  onSave: () => void;
  isSaving: boolean;
  acceptedCount: number;
  pendingCount: number;
  focusOnMount?: boolean;
}

export function StagingArea({
  proposals,
  onAcceptAll,
  onRejectAll,
  onAccept,
  onReject,
  onEdit,
  onSave,
  isSaving,
  acceptedCount,
  pendingCount,
  focusOnMount = false,
}: StagingAreaProps) {
  const containerRef = useRef<HTMLElement>(null);

  // Focus on mount for accessibility
  useEffect(() => {
    if (focusOnMount && containerRef.current) {
      containerRef.current.focus();
    }
  }, [focusOnMount]);

  const handleAccept = useCallback((id: string) => () => onAccept(id), [onAccept]);

  const handleReject = useCallback((id: string) => () => onReject(id), [onReject]);

  const handleEdit = useCallback((id: string) => () => onEdit(id), [onEdit]);

  const hasAccepted = acceptedCount > 0;

  return (
    <section
      ref={containerRef}
      tabIndex={-1}
      aria-labelledby="staging-area-title"
      className="space-y-6 outline-none"
      data-testid="staging-area"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="staging-area-title" className="text-lg font-semibold">
            Propozycje fiszek
          </h2>
          <p className="text-sm text-muted-foreground">
            {proposals.length} propozycji • {acceptedCount} zaakceptowanych • {pendingCount} oczekujących
          </p>
        </div>
        <BulkActions
          onAcceptAll={onAcceptAll}
          onRejectAll={onRejectAll}
          disabled={isSaving}
          pendingCount={pendingCount}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onAccept={handleAccept(proposal.id)}
            onReject={handleReject(proposal.id)}
            onEdit={handleEdit(proposal.id)}
            disabled={isSaving}
          />
        ))}
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button
          onClick={onSave}
          disabled={!hasAccepted || isSaving}
          className="min-w-[200px]"
          data-testid="save-accepted-button"
        >
          {isSaving ? "Zapisywanie..." : `Zapisz zaakceptowane (${acceptedCount})`}
        </Button>
      </div>
    </section>
  );
}
