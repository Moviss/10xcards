import { useState, useSyncExternalStore } from "react";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { getUserEmailFromToken } from "@/lib/auth.client";
import { TopNav } from "./TopNav";
import { MobileNav } from "./MobileNav";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

function useCurrentPath() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("popstate", callback);
      document.addEventListener("astro:page-load", callback);
      return () => {
        window.removeEventListener("popstate", callback);
        document.removeEventListener("astro:page-load", callback);
      };
    },
    () => window.location.pathname,
    () => "/"
  );
}

export function Navigation() {
  const currentPath = useCurrentPath();
  const [userEmail] = useState<string | null>(() => getUserEmailFromToken());
  const {
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
  } = useNavigation();

  const handleMobileMenuChange = (open: boolean) => {
    if (open) {
      openMobileMenu();
    } else {
      closeMobileMenu();
    }
  };

  const displayEmail = userEmail ?? "";

  return (
    <>
      <TopNav
        userEmail={displayEmail}
        currentPath={currentPath}
        onLogout={handleLogout}
        onDeleteAccountClick={openDeleteDialog}
        isLoggingOut={isLoggingOut}
      />

      <MobileNav
        userEmail={displayEmail}
        currentPath={currentPath}
        isOpen={isMobileMenuOpen}
        onOpenChange={handleMobileMenuChange}
        onLogout={handleLogout}
        onDeleteAccountClick={openDeleteDialog}
        isLoggingOut={isLoggingOut}
      />

      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />
    </>
  );
}
