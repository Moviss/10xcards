import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavHeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export function MobileNavHeader({ onMenuToggle, isMenuOpen }: MobileNavHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
      <a
        href="/generator"
        className="text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        10xCards
      </a>
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuToggle}
        aria-label={isMenuOpen ? "Zamknij menu" : "Otwórz menu"}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-nav-menu"
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
    </header>
  );
}
