import { useEffect, useCallback } from "react";
import { useFlashcards } from "@/lib/hooks/useFlashcards";
import { FlashcardsHeader } from "./FlashcardsHeader";
import { FlashcardsToolbar } from "./FlashcardsToolbar";
import { FlashcardsContent } from "./FlashcardsContent";
import { Pagination } from "./Pagination";
import { FlashcardAddModal } from "./FlashcardAddModal";
import { FlashcardEditModal } from "./FlashcardEditModal";
import { Toaster, toast } from "sonner";

export function FlashcardsContainer() {
  const {
    // Data
    flashcards,
    pagination,

    // Filters
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    setSorting,

    // Pagination
    goToPage,

    // States
    isLoading,
    error,

    // Edit modal
    editingFlashcard,
    isEditModalOpen,
    openEditModal,
    closeEditModal,

    // Add modal
    isAddModalOpen,
    openAddModal,
    closeAddModal,

    // CRUD operations
    isSaving,
    isDeleting,
    isResettingProgress,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    resetProgress,

    // Helpers
    hasSearchQuery,
    clearSearch,
  } = useFlashcards();

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error, { duration: 5000 });
    }
  }, [error]);

  // Handle create with success toast
  const handleCreate = useCallback(
    async (data: Parameters<typeof createFlashcard>[0]) => {
      const success = await createFlashcard(data);
      if (success) {
        toast.success("Fiszka została dodana pomyślnie!", { duration: 3000 });
      }
      return success;
    },
    [createFlashcard]
  );

  // Handle update with success toast
  const handleUpdate = useCallback(
    async (id: string, data: Parameters<typeof updateFlashcard>[1]) => {
      const success = await updateFlashcard(id, data);
      if (success) {
        toast.success("Zmiany zostały zapisane!", { duration: 3000 });
      }
      return success;
    },
    [updateFlashcard]
  );

  // Handle delete with success toast
  const handleDelete = useCallback(
    async (id: string) => {
      const success = await deleteFlashcard(id);
      if (success) {
        toast.success("Fiszka została usunięta!", { duration: 3000 });
      }
      return success;
    },
    [deleteFlashcard]
  );

  // Handle reset progress with success toast
  const handleResetProgress = useCallback(
    async (id: string) => {
      const success = await resetProgress(id);
      if (success) {
        toast.success("Postęp nauki został zresetowany!", { duration: 3000 });
      }
      return success;
    },
    [resetProgress]
  );

  return (
    <section aria-labelledby="flashcards-title" className="space-y-6">
      <Toaster position="top-center" richColors closeButton />

      <h2 id="flashcards-title" className="sr-only">
        Zarządzanie fiszkami
      </h2>

      <FlashcardsHeader onAddClick={openAddModal} />

      <FlashcardsToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        sortValue={sortField}
        sortOrder={sortOrder}
        onSortChange={setSorting}
      />

      <FlashcardsContent
        flashcards={flashcards}
        isLoading={isLoading}
        hasSearchQuery={hasSearchQuery}
        onFlashcardClick={openEditModal}
        onClearSearch={clearSearch}
        onAddClick={openAddModal}
      />

      {pagination && pagination.total_pages > 0 && !isLoading && flashcards.length > 0 && (
        <Pagination pagination={pagination} onPageChange={goToPage} />
      )}

      <FlashcardAddModal isOpen={isAddModalOpen} onClose={closeAddModal} onSave={handleCreate} isSaving={isSaving} />

      <FlashcardEditModal
        flashcard={editingFlashcard}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleUpdate}
        onResetProgress={handleResetProgress}
        onDelete={handleDelete}
        isSaving={isSaving}
        isDeleting={isDeleting}
        isResettingProgress={isResettingProgress}
      />
    </section>
  );
}
