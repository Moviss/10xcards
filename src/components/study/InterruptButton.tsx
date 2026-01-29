import { Button } from "@/components/ui/button";
import { Square } from "lucide-react";
import type { InterruptButtonProps } from "./types";

export function InterruptButton({ onInterrupt, isSubmitting }: InterruptButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onInterrupt}
      disabled={isSubmitting}
      className="text-muted-foreground hover:text-foreground"
      aria-label="Przerwij sesję nauki"
    >
      <Square className="mr-2 h-4 w-4" aria-hidden="true" />
      Przerwij sesję
    </Button>
  );
}
