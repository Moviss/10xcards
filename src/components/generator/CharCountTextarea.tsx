import { useId, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CharCountTextareaProps {
  value: string;
  onChange: (value: string) => void;
  minLength: number;
  maxLength: number;
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
}

export function CharCountTextarea({
  value,
  onChange,
  minLength,
  maxLength,
  disabled = false,
  error,
  label = "Tekst źródłowy",
  placeholder = "Wklej tekst, z którego chcesz wygenerować fiszki...",
}: CharCountTextareaProps) {
  const textareaId = useId();
  const errorId = useId();
  const countId = useId();

  const charCount = value.length;

  const isValid = useMemo(() => {
    return charCount >= minLength && charCount <= maxLength;
  }, [charCount, minLength, maxLength]);

  const isTooShort = charCount < minLength;
  const isTooLong = charCount > maxLength;

  const countColorClass = useMemo(() => {
    if (charCount === 0) return "text-muted-foreground";
    if (isValid) return "text-green-600 dark:text-green-500";
    return "text-destructive";
  }, [charCount, isValid]);

  const progressPercentage = useMemo(() => {
    if (charCount <= minLength) {
      return (charCount / minLength) * 50;
    }
    const rangeSize = maxLength - minLength;
    const inRange = charCount - minLength;
    return 50 + (inRange / rangeSize) * 50;
  }, [charCount, minLength, maxLength]);

  return (
    <div className="space-y-2">
      <Label htmlFor={textareaId}>{label}</Label>
      <Textarea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="min-h-[200px] resize-y"
        aria-invalid={!!error || isTooLong}
        aria-describedby={`${countId}${error ? ` ${errorId}` : ""}`}
      />
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isValid ? "bg-green-600 dark:bg-green-500" : isTooLong ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>
        <p id={countId} className={cn("text-sm tabular-nums", countColorClass)} aria-live="polite" aria-atomic="true">
          {charCount.toLocaleString("pl-PL")} / {minLength.toLocaleString("pl-PL")}-{maxLength.toLocaleString("pl-PL")}{" "}
          znaków
        </p>
      </div>
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {isTooShort && charCount > 0 && !error && (
        <p className="text-sm text-muted-foreground">
          Potrzebujesz jeszcze {(minLength - charCount).toLocaleString("pl-PL")} znaków
        </p>
      )}
    </div>
  );
}
