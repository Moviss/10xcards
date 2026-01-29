import { User, LogOut, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface AccountDropdownProps {
  userEmail: string;
  onLogout: () => void;
  onDeleteAccountClick: () => void;
  isLoggingOut?: boolean;
}

export function AccountDropdown({
  userEmail,
  onLogout,
  onDeleteAccountClick,
  isLoggingOut = false,
}: AccountDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{userEmail}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">Konto</p>
          <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} disabled={isLoggingOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDeleteAccountClick} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Usuń konto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
