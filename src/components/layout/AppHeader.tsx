import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";

export function AppHeader() {
  const { isCollapsed, toggleMobile } = useSidebar();

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-background/70 backdrop-blur-md border-b border-border/30 shadow-sm transition-all duration-300",
        isCollapsed ? "lg:left-16" : "lg:left-60",
        "left-0"
      )}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleMobile}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="hidden sm:block flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Buscar..."
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          <Button variant="ghost" size="icon" className="sm:hidden">
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
