import { useState, useSyncExternalStore } from "react";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { getUserEmailFromToken } from "@/lib/auth.client";
import { getClientFeatureFlags, isI18nMvpEnabled } from "@/lib/i18n";
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
  const i18nMvpEnabled = isI18nMvpEnabled(getClientFeatureFlags());
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
        isI18nMvpEnabled={i18nMvpEnabled}
      />

      <MobileNav
        userEmail={displayEmail}
        currentPath={currentPath}
        isOpen={isMobileMenuOpen}
        onOpenChange={handleMobileMenuChange}
        onLogout={handleLogout}
        onDeleteAccountClick={openDeleteDialog}
        isLoggingOut={isLoggingOut}
        isI18nMvpEnabled={i18nMvpEnabled}
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
