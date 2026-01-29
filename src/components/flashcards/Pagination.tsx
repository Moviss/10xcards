import { useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationDTO } from "@/types";

interface PaginationProps {
  pagination: PaginationDTO;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, total_pages, total } = pagination;

  const canGoPrevious = page > 1;
  const canGoNext = page < total_pages;

  const handlePrevious = useCallback(() => {
    if (canGoPrevious) {
      onPageChange(page - 1);
    }
  }, [canGoPrevious, page, onPageChange]);

  const handleNext = useCallback(() => {
    if (canGoNext) {
      onPageChange(page + 1);
    }
  }, [canGoNext, page, onPageChange]);

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (total_pages <= maxVisible) {
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current
      const start = Math.max(2, page - 1);
      const end = Math.min(total_pages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < total_pages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (total_pages > 1) {
        pages.push(total_pages);
      }
    }

    return pages;
  }, [page, total_pages]);

  if (total_pages <= 1) {
    return (
      <div className="text-sm text-muted-foreground text-center py-2">
        {total} {total === 1 ? "fiszka" : total < 5 ? "fiszki" : "fiszek"}
      </div>
    );
  }

  return (
    <nav
      className="flex flex-col sm:flex-row items-center justify-between gap-4"
      aria-label="Nawigacja paginacji"
    >
      <div className="text-sm text-muted-foreground order-2 sm:order-1">
        Strona {page} z {total_pages} ({total} {total === 1 ? "fiszka" : total < 5 ? "fiszki" : "fiszek"})
      </div>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          aria-label="Poprzednia strona"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:ml-1">Poprzednia</span>
        </Button>

        <div className="flex items-center gap-1" role="group" aria-label="Numery stron">
          {pageNumbers.map((pageNum, index) =>
            pageNum === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                aria-label={`Strona ${pageNum}`}
                aria-current={pageNum === page ? "page" : undefined}
              >
                {pageNum}
              </Button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Następna strona"
        >
          <span className="sr-only sm:not-sr-only sm:mr-1">Następna</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
