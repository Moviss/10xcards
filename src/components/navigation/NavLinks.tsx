import { cn } from "@/lib/utils";
import { NavLink } from "./NavLink";

interface NavItem {
  href: string;
  label: string;
  testId: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/generator", label: "Generator", testId: "nav-link-generator" },
  { href: "/flashcards", label: "Moje Fiszki", testId: "nav-link-flashcards" },
  { href: "/study", label: "Nauka", testId: "nav-link-study" },
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
          testId={item.testId}
        />
      ))}
    </nav>
  );
}
