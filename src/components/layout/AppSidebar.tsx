import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Calendar,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MoreHorizontal,
  User,
  UsersRound,
  Trophy,
  Banknote,
  Target,
  Snowflake,
  Coins,
  CalendarOff,
} from "lucide-react";
import { KonvertaAvatar } from "@/components/ui/konverta-avatar";
import konvertaLogo from "@/assets/konverta-logo.png";
import konvertaIcon from "@/assets/konverta-icon.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Pipeline SDR", href: "/comercial/sdr", icon: Target },
  { title: "Pipeline Closer", href: "/comercial/closer", icon: Target },
  { title: "Leads Frios", href: "/comercial/leads-frios", icon: Snowflake },
  { title: "Clientes", href: "/clientes", icon: Users },
  { title: "Tarefas", href: "/tarefas", icon: CheckSquare },
  { title: "Projetos", href: "/projetos", icon: FolderKanban },
  { title: "Calendário", href: "/calendario", icon: Calendar },
  { title: "Ranking", href: "/ranking", icon: Trophy },
];

// Items condicionais por cargo
const cargoNavItems = [
  { title: "Minhas Comissões", href: "/minhas-comissoes", icon: Coins, cargos: ['sdr', 'closer'] as string[] | null },
  { title: "Minhas Ausências", href: "/ausencias", icon: CalendarOff, cargos: null }, // null = todos
];

const adminNavItems = [
  { title: "Equipe", href: "/equipe", icon: UsersRound },
  { title: "Financeiro", href: "/financeiro", icon: Banknote },
];

const bottomNavItems = [
  { title: "Configurações", href: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebar();
  const { profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const roleLabel = isAdmin ? "Administrador" : "Colaborador";

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-sidebar border-r border-border/20 flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-60",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/20">
          <div className="flex items-center gap-3 overflow-hidden">
            {isCollapsed ? (
              <img src={konvertaIcon} alt="Konverta" className="h-8 w-8" />
            ) : (
              <img src={konvertaLogo} alt="Konverta" className="h-6" />
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0")} />
                  {!isCollapsed && <span>{item.title}</span>}
                </NavLink>
              </li>
            ))}

            {/* Conditional items based on cargo */}
            {cargoNavItems.map((item) => {
              // Se item tem cargos específicos, verificar se usuário tem esse cargo
              if (item.cargos && !item.cargos.includes(profile?.cargo || '')) return null;
              
              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {/* Admin section */}
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-border/20">
              <p className={cn("text-label px-3 mb-2", isCollapsed && "hidden")}>
                Admin
              </p>
              <ul className="space-y-1">
                {adminNavItems.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      onClick={closeMobile}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-card hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border/20">
            <ul className="space-y-1">
              {bottomNavItems.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Collapse button */}
        <button
          onClick={toggle}
          className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full border border-border/40 bg-background text-muted-foreground hover:text-foreground transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        {/* User section */}
        <div className="p-2 border-t border-border/20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-3 w-full p-2 rounded-lg hover:bg-card transition-colors",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                <KonvertaAvatar
                  name={profile?.nome || "Usuário"}
                  src={profile?.avatar_url || undefined}
                  size="sm"
                />
                {!isCollapsed && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {profile?.nome || "Usuário"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {roleLabel}
                      </p>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isCollapsed ? "center" : "end"}
              side="top"
              className="w-56 bg-card border-border/40"
            >
              <div className="px-2 py-2">
                <p className="text-sm font-medium text-foreground">
                  {profile?.nome}
                </p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-border/20" />
              <DropdownMenuItem
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => {
                  closeMobile();
                  navigate("/perfil");
                }}
              >
                <User className="h-4 w-4 mr-2" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => {
                  closeMobile();
                  navigate("/configuracoes");
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/20" />
              <DropdownMenuItem
                className="text-destructive hover:text-destructive cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
