import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlashcardsHeaderProps {
  onAddClick: () => void;
}

export function FlashcardsHeader({ onAddClick }: FlashcardsHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moje fiszki</h1>
        <p className="mt-1 text-muted-foreground">Przeglądaj i zarządzaj swoimi fiszkami do nauki.</p>
      </div>
      <Button onClick={onAddClick}>
        <Plus className="mr-2 h-4 w-4" />
        Dodaj fiszkę
      </Button>
    </header>
  );
}
