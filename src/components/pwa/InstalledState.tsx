import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

export function InstalledState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm text-center space-y-8">
        {/* Success Icon with Animation */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-success/10 animate-ping opacity-50" />
          <div className="relative w-24 h-24 rounded-full bg-success/10 flex items-center justify-center border border-success/20">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            App instalado!
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
            O KonvertaOS está pronto na sua tela inicial. Aproveite a experiência completa.
          </p>
        </div>

        {/* CTA */}
        <Button 
          size="lg"
          className="w-full gap-2 h-12 text-base font-medium transition-all duration-200 hover:gap-3"
          onClick={() => window.location.href = "/"}
        >
          Abrir KonvertaOS
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
