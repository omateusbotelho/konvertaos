import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, CheckCircle, Share, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstalarApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  if (isInstalled) {
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
            <div className="flex items-start gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Acesso rápido</p>
                <p className="text-muted-foreground">Abra direto da tela inicial do seu dispositivo</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Funciona offline</p>
                <p className="text-muted-foreground">Acesse informações mesmo sem internet</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Monitor className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Tela cheia</p>
                <p className="text-muted-foreground">Experiência imersiva sem barra do navegador</p>
              </div>
            </div>
          </div>

          {/* Install button or instructions */}
          {deferredPrompt ? (
            <Button className="w-full gap-2" size="lg" onClick={handleInstall}>
              <Download className="w-5 h-5" />
              Instalar agora
            </Button>
          ) : isIOS ? (
            <div className="p-4 bg-card rounded-lg border border-border/20 space-y-3">
              <p className="font-medium text-sm">Para instalar no iPhone/iPad:</p>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">1</span>
                  Toque no botão <Share className="w-4 h-4 inline mx-1" /> Compartilhar
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">2</span>
                  Role para baixo e toque em "Adicionar à Tela de Início"
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">3</span>
                  Confirme tocando em "Adicionar"
                </li>
              </ol>
            </div>
          ) : isAndroid ? (
            <div className="p-4 bg-card rounded-lg border border-border/20 space-y-3">
              <p className="font-medium text-sm">Para instalar no Android:</p>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">1</span>
                  Toque no menu <MoreVertical className="w-4 h-4 inline mx-1" /> do navegador
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">2</span>
                  Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">3</span>
                  Confirme a instalação
                </li>
              </ol>
            </div>
          ) : (
            <div className="p-4 bg-card rounded-lg border border-border/20">
              <p className="text-sm text-muted-foreground text-center">
                Use um navegador moderno (Chrome, Edge, Safari) para instalar o app.
              </p>
            </div>
          )}

          <Button variant="ghost" className="w-full" onClick={() => window.location.href = "/"}>
            Continuar no navegador
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
