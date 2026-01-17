import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinanceiroRouteProps {
  children: ReactNode;
}

export function FinanceiroRoute({ children }: FinanceiroRouteProps) {
  const { user, profile, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin tem acesso total; colaborador com cargo financeiro também tem acesso
  const hasAccess = isAdmin || (profile?.cargo === "financeiro" && !isAdmin);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShieldX className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-semibold">Acesso Restrito</h2>
          <p className="text-muted-foreground max-w-md">
            Você não tem permissão para acessar o módulo Financeiro.
            <br />
            Apenas administradores e usuários do setor Financeiro podem acessar esta área.
          </p>
          <Button onClick={() => window.history.back()}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
