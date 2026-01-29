import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface GenerationLoaderProps {
  elapsedTime: number;
}

export function GenerationLoader({ elapsedTime }: GenerationLoaderProps) {
  // Stages: 0-2s spinner, 2-5s skeleton, 5s+ long wait message
  const showSpinner = elapsedTime < 2;
  const showSkeleton = elapsedTime >= 2 && elapsedTime < 5;
  const showLongWaitMessage = elapsedTime >= 5;

  return (
    <div
      className="space-y-4 py-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Trwa generowanie fiszek"
    >
      {showSpinner && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative size-12">
            <div
              className={cn("absolute inset-0 rounded-full border-4 border-muted", "border-t-primary animate-spin")}
            />
          </div>
          <p className="text-sm text-muted-foreground">Analizowanie tekstu...</p>
        </div>
      )}

      {showSkeleton && (
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">Generowanie propozycji fiszek...</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {showLongWaitMessage && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative size-12">
              <div
                className={cn("absolute inset-0 rounded-full border-4 border-muted", "border-t-primary animate-spin")}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Generowanie może potrwać dłużej...</p>
              <p className="text-sm text-muted-foreground">Model AI przetwarza Twój tekst. Proszę czekać.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
