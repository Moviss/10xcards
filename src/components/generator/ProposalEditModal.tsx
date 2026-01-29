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
import type { ProposalViewModel } from "./types";

interface ProposalEditModalProps {
  proposal: ProposalViewModel | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, front: string, back: string) => void;
}

export function ProposalEditModal({ proposal, isOpen, onClose, onSave }: ProposalEditModalProps) {
  const frontId = useId();
  const backId = useId();
  const frontErrorId = useId();
  const backErrorId = useId();

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [touched, setTouched] = useState({ front: false, back: false });

  // Sync local state with proposal when modal opens
  useEffect(() => {
    if (proposal && isOpen) {
      setFront(proposal.front);
      setBack(proposal.back);
      setTouched({ front: false, back: false });
    }
  }, [proposal, isOpen]);

  const frontError = touched.front && front.trim() === "" ? "Pytanie nie może być puste" : null;
  const backError = touched.back && back.trim() === "" ? "Odpowiedź nie może być pusta" : null;

  const isValid = front.trim() !== "" && back.trim() !== "";

  const handleFrontChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFront(e.target.value);
  }, []);

  const handleBackChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBack(e.target.value);
  }, []);

  const handleFrontBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, front: true }));
  }, []);

  const handleBackBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, back: true }));
  }, []);

  const handleSave = useCallback(() => {
    if (!proposal || !isValid) return;
    onSave(proposal.id, front.trim(), back.trim());
  }, [proposal, front, back, isValid, onSave]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby="edit-modal-description">
        <DialogHeader>
          <DialogTitle>Edytuj propozycję fiszki</DialogTitle>
          <DialogDescription id="edit-modal-description">
            Zmodyfikuj treść pytania i odpowiedzi. Po zapisie propozycja zostanie automatycznie zaakceptowana.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={frontId}>Pytanie (przód fiszki)</Label>
            <Textarea
              id={frontId}
              value={front}
              onChange={handleFrontChange}
              onBlur={handleFrontBlur}
              placeholder="Wpisz pytanie..."
              className="min-h-[100px] resize-y"
              aria-invalid={!!frontError}
              aria-describedby={frontError ? frontErrorId : undefined}
            />
            {frontError && (
              <p id={frontErrorId} className="text-sm text-destructive" role="alert">
                {frontError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={backId}>Odpowiedź (tył fiszki)</Label>
            <Textarea
              id={backId}
              value={back}
              onChange={handleBackChange}
              onBlur={handleBackBlur}
              placeholder="Wpisz odpowiedź..."
              className="min-h-[100px] resize-y"
              aria-invalid={!!backError}
              aria-describedby={backError ? backErrorId : undefined}
            />
            {backError && (
              <p id={backErrorId} className="text-sm text-destructive" role="alert">
                {backError}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Zapisz zmiany
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
