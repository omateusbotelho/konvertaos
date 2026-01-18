import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export function InstalledState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <CardTitle>App instalado!</CardTitle>
          <CardDescription>
            O KonvertaOS já está instalado no seu dispositivo. Você pode acessá-lo pela tela inicial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Voltar para o app
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
