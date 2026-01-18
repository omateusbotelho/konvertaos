import { Button } from "@/components/ui/button";
import { Download, Smartphone, Zap, Maximize2, ArrowLeft } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { BenefitItem, InstallInstructions, InstalledState } from "@/components/pwa";

const BENEFITS = [
  {
    icon: Smartphone,
    title: "Acesso instantâneo",
    description: "Abra direto da tela inicial, sem abrir o navegador",
  },
  {
    icon: Zap,
    title: "Modo offline",
    description: "Continue trabalhando mesmo sem conexão",
  },
  {
    icon: Maximize2,
    title: "Experiência imersiva",
    description: "Tela cheia, sem barras do navegador",
  },
] as const;

export default function InstalarApp() {
  const { isInstalled, isIOS, isAndroid, canInstall, install } = usePWAInstall();

  if (isInstalled) {
    return <InstalledState />;
  }

  const platform = isIOS ? "ios" : isAndroid ? "android" : "unknown";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-10">
        {/* Header Section */}
        <header className="text-center space-y-6">
          {/* Logo with subtle glow effect */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-50" />
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-border/30 shadow-xl">
              <img 
                src="/favicon.png" 
                alt="KonvertaOS" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Title & Subtitle with better hierarchy */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Instalar KonvertaOS
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-xs mx-auto">
              Uma experiência ainda melhor no seu dispositivo
            </p>
          </div>
        </header>

        {/* Benefits Section */}
        <section className="space-y-3" aria-label="Benefícios">
          {BENEFITS.map((benefit) => (
            <BenefitItem key={benefit.title} {...benefit} />
          ))}
        </section>

        {/* CTA Section */}
        <section className="space-y-4" aria-label="Ações">
          {canInstall ? (
            <Button 
              size="lg" 
              className="w-full h-14 text-base font-semibold gap-3 shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
              onClick={install}
            >
              <Download className="w-5 h-5" />
              Instalar agora
            </Button>
          ) : (
            <InstallInstructions platform={platform} />
          )}

          <Button 
            variant="ghost" 
            size="lg"
            className="w-full h-12 text-muted-foreground gap-2 transition-all duration-200 hover:text-foreground hover:gap-3"
            onClick={() => window.location.href = "/"}
          >
            <ArrowLeft className="w-4 h-4" />
            Continuar no navegador
          </Button>
        </section>
      </div>
    </div>
  );
}
