import { NavLinks } from "./NavLinks";
import { AccountDropdown } from "./AccountDropdown";

interface TopNavProps {
  userEmail: string;
  currentPath: string;
  onLogout: () => void;
  onDeleteAccountClick: () => void;
  isLoggingOut?: boolean;
}

export function TopNav({
  userEmail,
  currentPath,
  onLogout,
  onDeleteAccountClick,
  isLoggingOut = false,
}: TopNavProps) {
  return (
    <header className="hidden h-14 items-center justify-between border-b px-6 md:flex">
      <div className="flex items-center gap-8">
        <a
          href="/generator"
          className="text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          10xCards
        </a>
        <NavLinks currentPath={currentPath} orientation="horizontal" />
      </div>

      <AccountDropdown
        userEmail={userEmail}
        onLogout={onLogout}
        onDeleteAccountClick={onDeleteAccountClick}
        isLoggingOut={isLoggingOut}
      />
    </header>
  );
}
