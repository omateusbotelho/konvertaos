import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
        <h1 className="mb-2">Página não encontrada</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button onClick={() => navigate("/")}>
          <Home className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </div>
    </AppLayout>
  );
}
