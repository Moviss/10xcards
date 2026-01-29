import { useState, useCallback } from "react";
import { toast } from "sonner";
import { authenticatedFetch, clearAuthToken } from "@/lib/auth.client";

interface UseNavigationResult {
  isLoggingOut: boolean;
  isDeleting: boolean;
  isDeleteDialogOpen: boolean;
  isMobileMenuOpen: boolean;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  handleLogout: () => Promise<void>;
  handleDeleteAccount: () => Promise<void>;
}

export function useNavigation(): UseNavigationResult {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const response = await authenticatedFetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        clearAuthToken();
        window.location.href = "/login";
        return;
      }

      if (response.status === 401) {
        clearAuthToken();
        toast.error("Sesja wygasła. Przekierowanie do strony logowania.");
        window.location.href = "/login";
        return;
      }

      toast.error("Nie udało się wylogować. Spróbuj ponownie.");
    } catch {
      toast.error("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    try {
      const response = await authenticatedFetch("/api/auth/account", {
        method: "DELETE",
      });

      if (response.ok) {
        clearAuthToken();
        window.location.href = "/";
        return;
      }

      if (response.status === 401) {
        clearAuthToken();
        toast.error("Sesja wygasła. Przekierowanie do strony logowania.");
        window.location.href = "/login";
        return;
      }

      const data = await response.json();
      toast.error(data.error || "Nie udało się usunąć konta.");
    } catch {
      toast.error("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, []);

  const openDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  const openMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return {
    isLoggingOut,
    isDeleting,
    isDeleteDialogOpen,
    isMobileMenuOpen,
    openDeleteDialog,
    closeDeleteDialog,
    openMobileMenu,
    closeMobileMenu,
    handleLogout,
    handleDeleteAccount,
  };
}
