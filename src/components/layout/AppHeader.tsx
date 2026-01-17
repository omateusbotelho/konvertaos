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
      <div className="flex items-center justify-between h-full px-3 sm:px-4 lg:px-6">
        {/* Mobile menu button - min 44px touch target */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden min-w-[44px] min-h-[44px] h-11 w-11 shrink-0"
          onClick={toggleMobile}
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="hidden sm:block flex-1 max-w-md ml-2">
          <Input
            type="search"
            placeholder="Buscar..."
            aria-label="Campo de busca"
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile search - min 44px touch target */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="sm:hidden min-w-[44px] min-h-[44px] h-11 w-11"
            aria-label="Abrir busca"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
