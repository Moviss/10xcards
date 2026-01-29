import { useCallback, useId } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "Szukaj fiszek..." }: SearchInputProps) {
  const inputId = useId();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        id={inputId}
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9 pr-9"
        aria-label="Szukaj fiszek"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
          onClick={handleClear}
          aria-label="Wyczyść wyszukiwanie"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
