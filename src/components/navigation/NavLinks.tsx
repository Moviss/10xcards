import { cn } from "@/lib/utils";
import { NavLink } from "./NavLink";

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/generator", label: "Generator" },
  { href: "/flashcards", label: "Moje Fiszki" },
  { href: "/study", label: "Nauka" },
];

interface NavLinksProps {
  currentPath: string;
  orientation?: "horizontal" | "vertical";
  onLinkClick?: () => void;
}

export function NavLinks({ currentPath, orientation = "horizontal", onLinkClick }: NavLinksProps) {
  return (
    <nav className={cn("flex gap-6", orientation === "vertical" ? "flex-col" : "flex-row items-center")}>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          isActive={currentPath === item.href}
          onClick={onLinkClick}
        />
      ))}
    </nav>
  );
}
