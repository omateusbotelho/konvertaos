import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { BenefitItem, InstallInstructions, InstalledState } from "@/components/pwa";

const BENEFITS = [
  {
    icon: Smartphone,
    title: "Acesso rápido",
    description: "Abra direto da tela inicial do seu dispositivo",
  },
  {
    icon: Download,
    title: "Funciona offline",
    description: "Acesse informações mesmo sem internet",
  },
  {
    icon: Monitor,
    title: "Tela cheia",
    description: "Experiência imersiva sem barra do navegador",
  },
] as const;

export default function InstalarApp() {
  const { isInstalled, isIOS, isAndroid, canInstall, install } = usePWAInstall();

  if (isInstalled) {
    return <InstalledState />;
  }

  const platform = isIOS ? "ios" : isAndroid ? "android" : "unknown";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
            <img src="/favicon.png" alt="KonvertaOS" className="w-full h-full object-cover" />
          </div>
          <CardTitle className="text-2xl">Instalar KonvertaOS</CardTitle>
          <CardDescription>
            Instale o app no seu dispositivo para uma experiência ainda melhor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            {BENEFITS.map((benefit) => (
              <BenefitItem key={benefit.title} {...benefit} />
            ))}
          </div>

          {/* Install button or instructions */}
          {canInstall ? (
            <Button className="w-full gap-2" size="lg" onClick={install}>
              <Download className="w-5 h-5" />
              Instalar agora
            </Button>
          ) : (
            <InstallInstructions platform={platform} />
          )}

          <Button variant="ghost" className="w-full" onClick={() => window.location.href = "/"}>
            Continuar no navegador
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
