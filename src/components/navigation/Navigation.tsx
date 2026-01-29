import { useState, useEffect } from "react";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { getUserEmailFromToken } from "@/lib/auth.client";
import { TopNav } from "./TopNav";
import { MobileNav } from "./MobileNav";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

interface NavigationProps {
  currentPath: string;
}

export function Navigation({ currentPath }: NavigationProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const email = getUserEmailFromToken();
    setUserEmail(email);
  }, []);
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
