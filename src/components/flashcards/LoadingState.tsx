import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Ładowanie fiszek">
      {/* Desktop table skeleton */}
      <div className="hidden md:block space-y-2">
        {/* Header skeleton */}
        <div className="grid grid-cols-[1fr_1fr_100px] gap-4 py-3 px-4 border-b">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Row skeletons */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_100px] gap-4 py-4 px-4 border-b">
            <Skeleton className="h-4 w-full max-w-[300px]" />
            <Skeleton className="h-4 w-full max-w-[300px]" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>

      {/* Mobile card skeleton */}
      <div className="md:hidden space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="pt-2 border-t">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
