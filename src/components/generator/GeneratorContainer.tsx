import { useState, useCallback, useEffect, useRef } from "react";
import { useGenerator } from "@/lib/hooks/useGenerator";
import { SourceTextForm } from "./SourceTextForm";
import { GenerationLoader } from "./GenerationLoader";
import { StagingArea } from "./StagingArea";
import { ProposalEditModal } from "./ProposalEditModal";
import { toast } from "sonner";

export function GeneratorContainer() {
  const {
    // Form state
    sourceText,
    setSourceText,
    isSourceTextValid,

    // Generation state
    isGenerating,
    generationError,
    elapsedTime,

    // Staging Area state
    proposals,

    // Save state
    isSaving,
    saveError,

    // Edit modal state
    editingProposal,

    // Generation actions
    generateFlashcards,

    // Proposal actions
    acceptProposal,
    rejectProposal,
    acceptAllProposals,
    rejectAllProposals,

    // Edit actions
    openEditModal,
    closeEditModal,
    saveProposalEdit,

    // Save action
    saveAcceptedProposals,

    // Helpers
    acceptedCount,
    pendingCount,
  } = useGenerator();

  // Track if staging area was just populated (for focus management)
  const [shouldFocusStagingArea, setShouldFocusStagingArea] = useState(false);
  const previousProposalsLengthRef = useRef(0);

  // Detect when proposals are freshly generated
  useEffect(() => {
    if (proposals.length > 0 && previousProposalsLengthRef.current === 0) {
      setShouldFocusStagingArea(true);
    }
    previousProposalsLengthRef.current = proposals.length;
  }, [proposals.length]);

  // Reset focus flag after staging area mounts and focuses
  useEffect(() => {
    if (shouldFocusStagingArea) {
      const timer = setTimeout(() => setShouldFocusStagingArea(false), 100);
      return () => clearTimeout(timer);
    }
  }, [shouldFocusStagingArea]);

  // Show error toasts
  useEffect(() => {
    if (generationError) {
      toast.error(generationError, {
        duration: 5000,
        action: {
          label: "Spróbuj ponownie",
          onClick: () => generateFlashcards(),
        },
      });
    }
  }, [generationError, generateFlashcards]);

  useEffect(() => {
    if (saveError) {
      toast.error(saveError, {
        duration: 5000,
      });
    }
  }, [saveError]);

  // Handle save with success toast
  const handleSave = useCallback(async () => {
    const countBefore = proposals.filter((p) => p.status === "accepted").length;
    await saveAcceptedProposals();
    // Show success toast only if there were accepted proposals (save was attempted)
    if (countBefore > 0) {
      toast.success(`Zapisano ${countBefore} fiszek pomyślnie!`, {
        duration: 3000,
      });
    }
  }, [saveAcceptedProposals, proposals]);

  const hasProposals = proposals.length > 0;
  const isEditModalOpen = editingProposal !== null;

  return (
    <div className="space-y-8">
      <section aria-labelledby="source-text-title">
        <h2 id="source-text-title" className="sr-only">
          Formularz tekstu źródłowego
        </h2>
        <SourceTextForm
          sourceText={sourceText}
          onSourceTextChange={setSourceText}
          onSubmit={generateFlashcards}
          isGenerating={isGenerating}
          error={generationError}
          isValid={isSourceTextValid}
        />
      </section>

      {isGenerating && <GenerationLoader elapsedTime={elapsedTime} />}

      {!isGenerating && hasProposals && (
        <StagingArea
          proposals={proposals}
          onAcceptAll={acceptAllProposals}
          onRejectAll={rejectAllProposals}
          onAccept={acceptProposal}
          onReject={rejectProposal}
          onEdit={openEditModal}
          onSave={handleSave}
          isSaving={isSaving}
          acceptedCount={acceptedCount}
          pendingCount={pendingCount}
          focusOnMount={shouldFocusStagingArea}
        />
      )}

      <ProposalEditModal
        proposal={editingProposal}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={saveProposalEdit}
      />
    </div>
  );
}
