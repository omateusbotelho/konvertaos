import { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

function LayoutContent({ children }: AppLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen min-h-dvh bg-background">
      <AppSidebar />
      <AppHeader />
      <main
        className={cn(
          "pt-16 min-h-screen min-h-dvh transition-all duration-300",
          isCollapsed ? "lg:pl-16" : "lg:pl-60"
        )}
      >
        <div className="p-3 sm:p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
