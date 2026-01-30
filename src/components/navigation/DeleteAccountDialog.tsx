import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

const CONFIRM_TEXT = "USUŃ";

export function DeleteAccountDialog({ isOpen, onClose, onConfirm, isLoading }: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmValid = confirmText === CONFIRM_TEXT;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setConfirmText("");
        onClose();
      }
    },
    [onClose]
  );

  const handleConfirm = useCallback(async () => {
    if (!isConfirmValid || isLoading) return;
    await onConfirm();
    setConfirmText("");
  }, [isConfirmValid, isLoading, onConfirm]);

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent data-testid="delete-account-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta operacja jest nieodwracalna. Wszystkie Twoje dane, w tym fiszki i historia nauki, zostaną trwale
            usunięte.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2 py-4">
          <Label htmlFor="confirm-delete">
            Wpisz <span className="font-semibold">{CONFIRM_TEXT}</span> aby potwierdzić:
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_TEXT}
            disabled={isLoading}
            aria-describedby="confirm-delete-hint"
            data-testid="delete-confirm-input"
          />
          <p id="confirm-delete-hint" className="text-xs text-muted-foreground">
            Wpisz dokładnie słowo &quot;{CONFIRM_TEXT}&quot; wielkimi literami.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!isConfirmValid || isLoading}
            onClick={handleConfirm}
            data-testid="delete-account-confirm-button"
          >
            {isLoading ? "Usuwanie..." : "Usuń konto"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
