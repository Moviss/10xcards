import { LogOut, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MobileNavHeader } from "./MobileNavHeader";
import { NavLinks } from "./NavLinks";
import { LanguageSwitcherSlot } from "./LanguageSwitcherSlot";

interface MobileNavProps {
  userEmail: string;
  currentPath: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
  onDeleteAccountClick: () => void;
  isLoggingOut?: boolean;
  isI18nMvpEnabled: boolean;
}

export function MobileNav({
  userEmail,
  currentPath,
  isOpen,
  onOpenChange,
  onLogout,
  onDeleteAccountClick,
  isLoggingOut = false,
  isI18nMvpEnabled,
}: MobileNavProps) {
  const handleLinkClick = () => {
    onOpenChange(false);
  };

  const handleLogout = () => {
    onOpenChange(false);
    onLogout();
  };

  const handleDeleteAccountClick = () => {
    onOpenChange(false);
    onDeleteAccountClick();
  };

  return (
    <div className="md:hidden">
      <MobileNavHeader isMenuOpen={isOpen} onMenuToggle={() => onOpenChange(!isOpen)} />

      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px]" id="mobile-nav-menu">
          <SheetHeader>
            <SheetTitle className="text-left">
              <a href="/generator" className="text-lg font-bold tracking-tight">
                10xCards
              </a>
            </SheetTitle>
            <SheetDescription className="sr-only">Menu nawigacji mobilnej</SheetDescription>
          </SheetHeader>

          <div className="mt-6 flex flex-col gap-6 px-4">
            <NavLinks currentPath={currentPath} orientation="vertical" onLinkClick={handleLinkClick} />
            <LanguageSwitcherSlot placement="mobile" isI18nMvpEnabled={isI18nMvpEnabled} />

            <Separator />

            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground truncate">{userEmail}</p>

              <Button variant="ghost" className="justify-start" onClick={handleLogout} disabled={isLoggingOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
              </Button>

              <Button
                variant="ghost"
                className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDeleteAccountClick}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Usuń konto
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
