import { useState, useCallback, useEffect, useId } from "react";
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
import type { CreateFlashcardCommand } from "@/types";

interface FlashcardAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateFlashcardCommand) => Promise<boolean>;
  isSaving: boolean;
}

export function FlashcardAddModal({ isOpen, onClose, onSave, isSaving }: FlashcardAddModalProps) {
  const frontId = useId();
  const backId = useId();
  const frontErrorId = useId();
  const backErrorId = useId();

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [touched, setTouched] = useState({ front: false, back: false });
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFront("");
      setBack("");
      setTouched({ front: false, back: false });
      setSubmitError(null);
    }
  }, [isOpen]);

  const frontError = touched.front && front.trim() === "" ? "Pole Przód nie może być puste" : null;
  const backError = touched.back && back.trim() === "" ? "Pole Tył nie może być puste" : null;

  const isValid = front.trim() !== "" && back.trim() !== "";

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
    if (!isValid || isSaving) return;

    setTouched({ front: true, back: true });
    setSubmitError(null);

    try {
      await onSave({
        front: front.trim(),
        back: back.trim(),
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Nie udało się dodać fiszki");
    }
  }, [front, back, isValid, isSaving, onSave]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isSaving) {
        onClose();
      }
    },
    [onClose, isSaving]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby="add-modal-description">
        <DialogHeader>
          <DialogTitle>Dodaj nową fiszkę</DialogTitle>
          <DialogDescription id="add-modal-description">
            Wypełnij treść przodu i tyłu fiszki, aby ją dodać do swojej kolekcji.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
              disabled={isSaving}
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
              disabled={isSaving}
            />
            {backError && (
              <p id={backErrorId} className="text-sm text-destructive" role="alert">
                {backError}
              </p>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving ? "Dodawanie..." : "Dodaj fiszkę"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
