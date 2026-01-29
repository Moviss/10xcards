import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CharCountTextarea } from "./CharCountTextarea";
import { GENERATOR_CONFIG } from "./types";

interface SourceTextFormProps {
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  error: string | null;
  isValid: boolean;
}

export function SourceTextForm({
  sourceText,
  onSourceTextChange,
  onSubmit,
  isGenerating,
  error,
  isValid,
}: SourceTextFormProps) {
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (isValid && !isGenerating) {
        onSubmit();
      }
    },
    [isValid, isGenerating, onSubmit]
  );

  const isButtonDisabled = !isValid || isGenerating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CharCountTextarea
        value={sourceText}
        onChange={onSourceTextChange}
        minLength={GENERATOR_CONFIG.MIN_SOURCE_TEXT_LENGTH}
        maxLength={GENERATOR_CONFIG.MAX_SOURCE_TEXT_LENGTH}
        disabled={isGenerating}
        error={error || undefined}
        label="Tekst źródłowy"
        placeholder="Wklej tekst, z którego chcesz wygenerować fiszki (np. fragment podręcznika, notatki, artykuł)..."
      />
      <Button type="submit" disabled={isButtonDisabled} className="w-full sm:w-auto">
        {isGenerating ? "Generowanie..." : "Generuj fiszki"}
      </Button>
    </form>
  );
}
