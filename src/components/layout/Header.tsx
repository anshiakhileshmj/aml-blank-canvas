import { Menu, Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NotificationPopover } from "@/components/NotificationPopover";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {

  return (
    <header className="bg-card dark:bg-card border-b border-border dark:border-border h-16 px-6">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2"
            onClick={onMobileMenuToggle}
            data-testid="mobile-menu-toggle"
          >
            <Menu className="text-card-foreground dark:text-card-foreground w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-card-foreground dark:text-card-foreground">AML Dashboard</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search transactions, accounts, API keys..."
              className="w-80 pl-10 bg-input dark:bg-input border-border dark:border-border text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground"
              data-testid="global-search"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-muted-foreground w-4 h-4" />
          </div>
          
          {/* Notifications */}
          <NotificationPopover />
        </div>
      </div>
    </header>
  );
}
