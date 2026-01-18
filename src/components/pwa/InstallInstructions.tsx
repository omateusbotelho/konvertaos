import { Share, MoreVertical, Info } from "lucide-react";
import { InstallStep } from "./InstallStep";

interface InstallInstructionsProps {
  platform: "ios" | "android" | "unknown";
}

export function InstallInstructions({ platform }: InstallInstructionsProps) {
  if (platform === "ios") {
    return (
      <div className="p-5 bg-muted/30 rounded-xl border border-border/20 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <p className="font-semibold text-foreground">Instalar no iPhone/iPad</p>
        </div>
        <ol className="text-sm space-y-3 pl-1">
          <InstallStep step={1}>
            Toque em <Share className="w-4 h-4 inline mx-1 text-primary" /> <span className="text-foreground font-medium">Compartilhar</span>
          </InstallStep>
          <InstallStep step={2}>
            Role e toque em <span className="text-foreground font-medium">"Adicionar à Tela de Início"</span>
          </InstallStep>
          <InstallStep step={3}>
            Confirme com <span className="text-foreground font-medium">"Adicionar"</span>
          </InstallStep>
        </ol>
      </div>
    );
  }

  if (platform === "android") {
    return (
      <div className="p-5 bg-muted/30 rounded-xl border border-border/20 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <p className="font-semibold text-foreground">Instalar no Android</p>
        </div>
        <ol className="text-sm space-y-3 pl-1">
          <InstallStep step={1}>
            Toque no menu <MoreVertical className="w-4 h-4 inline mx-1 text-primary" /> do navegador
          </InstallStep>
          <InstallStep step={2}>
            Selecione <span className="text-foreground font-medium">"Instalar aplicativo"</span>
          </InstallStep>
          <InstallStep step={3}>
            Confirme a instalação
          </InstallStep>
        </ol>
      </div>
    );
  }

  return (
    <div className="p-5 bg-muted/30 rounded-xl border border-border/20 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Info className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        Use um navegador moderno (Chrome, Edge, Safari) para instalar o app.
      </p>
    </div>
  );
}
