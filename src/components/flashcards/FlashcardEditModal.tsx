import { useState, useCallback, useEffect, useId } from "react";
import { Sparkles, RotateCcw, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "./ConfirmDialog";
import type { FlashcardListItemDTO, UpdateFlashcardCommand } from "@/types";

interface FlashcardEditModalProps {
  flashcard: FlashcardListItemDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: UpdateFlashcardCommand) => Promise<boolean>;
  onResetProgress: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  isSaving: boolean;
  isDeleting: boolean;
  isResettingProgress: boolean;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Brak danych";
  return new Date(dateString).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FlashcardEditModal({
  flashcard,
  isOpen,
  onClose,
  onSave,
  onResetProgress,
  onDelete,
  isSaving,
  isDeleting,
  isResettingProgress,
}: FlashcardEditModalProps) {
  const frontId = useId();
  const backId = useId();
  const frontErrorId = useId();
  const backErrorId = useId();

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [touched, setTouched] = useState({ front: false, back: false });
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Confirm dialogs state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync local state with flashcard when modal opens
  useEffect(() => {
    if (flashcard && isOpen) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      setTouched({ front: false, back: false });
      setSubmitError(null);
      setShowResetConfirm(false);
      setShowDeleteConfirm(false);
    }
  }, [flashcard, isOpen]);

  const frontError = touched.front && front.trim() === "" ? "Pole Przód nie może być puste" : null;
  const backError = touched.back && back.trim() === "" ? "Pole Tył nie może być puste" : null;

  const isValid = front.trim() !== "" && back.trim() !== "";
  const hasChanges = flashcard && (front.trim() !== flashcard.front || back.trim() !== flashcard.back);
  const isAnyOperationInProgress = isSaving || isDeleting || isResettingProgress;

  const handleFrontChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFront(e.target.value);
    setSubmitError(null);
  }, []);

  const handleBackChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBack(e.target.value);
    setSubmitError(null);
  }, []);

  const handleFrontBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, front: true }));
  }, []);

  const handleBackBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, back: true }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!flashcard || !isValid || isAnyOperationInProgress) return;

    setTouched({ front: true, back: true });
    setSubmitError(null);

    try {
      await onSave(flashcard.id, {
        front: front.trim(),
        back: back.trim(),
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Nie udało się zapisać zmian");
    }
  }, [flashcard, front, back, isValid, isAnyOperationInProgress, onSave]);

  const handleResetProgress = useCallback(async () => {
    if (!flashcard || isAnyOperationInProgress) return;

    try {
      await onResetProgress(flashcard.id);
      setShowResetConfirm(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Nie udało się zresetować postępu");
      setShowResetConfirm(false);
    }
  }, [flashcard, isAnyOperationInProgress, onResetProgress]);

  const handleDelete = useCallback(async () => {
    if (!flashcard || isAnyOperationInProgress) return;

    try {
      await onDelete(flashcard.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Nie udało się usunąć fiszki");
      setShowDeleteConfirm(false);
    }
  }, [flashcard, isAnyOperationInProgress, onDelete]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isAnyOperationInProgress) {
        onClose();
      }
    },
    [onClose, isAnyOperationInProgress]
  );

  if (!flashcard) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl" aria-describedby="edit-modal-description">
          <DialogHeader>
            <DialogTitle>Edytuj fiszkę</DialogTitle>
            <DialogDescription id="edit-modal-description">
              Zmodyfikuj treść fiszki, zresetuj postęp nauki lub usuń fiszkę.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Form fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={frontId}>Przód fiszki</Label>
                  <span className="text-xs text-muted-foreground">{front.length} znaków</span>
                </div>
                <Textarea
                  id={frontId}
                  value={front}
                  onChange={handleFrontChange}
                  onBlur={handleFrontBlur}
                  placeholder="Wpisz pytanie lub pojęcie..."
                  className="min-h-[100px] resize-y"
                  aria-invalid={!!frontError}
                  aria-describedby={frontError ? frontErrorId : undefined}
                  disabled={isAnyOperationInProgress}
                />
                {frontError && (
                  <p id={frontErrorId} className="text-sm text-destructive" role="alert">
                    {frontError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={backId}>Tył fiszki</Label>
                  <span className="text-xs text-muted-foreground">{back.length} znaków</span>
                </div>
                <Textarea
                  id={backId}
                  value={back}
                  onChange={handleBackChange}
                  onBlur={handleBackBlur}
                  placeholder="Wpisz odpowiedź lub definicję..."
                  className="min-h-[100px] resize-y"
                  aria-invalid={!!backError}
                  aria-describedby={backError ? backErrorId : undefined}
                  disabled={isAnyOperationInProgress}
                />
                {backError && (
                  <p id={backErrorId} className="text-sm text-destructive" role="alert">
                    {backError}
                  </p>
                )}
              </div>
            </div>

            {/* Info section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Informacje o fiszce</h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Źródło</dt>
                  <dd className="flex items-center gap-1.5 mt-0.5">
                    {flashcard.is_ai_generated ? (
                      <>
                        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span>Wygenerowana przez AI</span>
                      </>
                    ) : (
                      <span>Dodana ręcznie</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Data utworzenia</dt>
                  <dd className="mt-0.5">{formatDate(flashcard.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Powtórzenia</dt>
                  <dd className="mt-0.5">{flashcard.repetitions}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Interwał</dt>
                  <dd className="mt-0.5">{flashcard.interval} dni</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Współczynnik łatwości</dt>
                  <dd className="mt-0.5">{flashcard.ease_factor.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Następna powtórka</dt>
                  <dd className="mt-0.5">{formatDate(flashcard.next_review_date)}</dd>
                </div>
              </dl>
            </div>

            {/* Destructive actions */}
            <div className="border-t pt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                disabled={isAnyOperationInProgress}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Resetuj postęp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isAnyOperationInProgress}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Usuń fiszkę
              </Button>
            </div>

            {submitError && (
              <p className="text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isAnyOperationInProgress}>
              Anuluj
            </Button>
            <Button onClick={handleSave} disabled={!isValid || !hasChanges || isAnyOperationInProgress}>
              {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset progress confirmation */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onConfirm={handleResetProgress}
        onCancel={() => setShowResetConfirm(false)}
        title="Resetuj postęp nauki"
        description="Czy na pewno chcesz zresetować postęp nauki tej fiszki? Wszystkie statystyki powtórek zostaną wyzerowane i fiszka będzie traktowana jak nowa."
        confirmLabel="Resetuj postęp"
        isLoading={isResettingProgress}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Usuń fiszkę"
        description="Czy na pewno chcesz usunąć tę fiszkę? Ta operacja jest nieodwracalna."
        confirmLabel="Usuń"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
