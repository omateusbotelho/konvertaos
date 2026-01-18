import { Share, MoreVertical } from "lucide-react";
import { InstallStep } from "./InstallStep";

interface InstallInstructionsProps {
  platform: "ios" | "android" | "unknown";
}

export function InstallInstructions({ platform }: InstallInstructionsProps) {
  if (platform === "ios") {
    return (
      <div className="p-4 bg-card rounded-lg border border-border/20 space-y-3">
        <p className="font-medium text-sm">Para instalar no iPhone/iPad:</p>
        <ol className="text-sm text-muted-foreground space-y-2">
          <InstallStep step={1}>
            Toque no botão <Share className="w-4 h-4 inline mx-1" /> Compartilhar
          </InstallStep>
          <InstallStep step={2}>
            Role para baixo e toque em "Adicionar à Tela de Início"
          </InstallStep>
          <InstallStep step={3}>
            Confirme tocando em "Adicionar"
          </InstallStep>
        </ol>
      </div>
    );
  }

  if (platform === "android") {
    return (
      <div className="p-4 bg-card rounded-lg border border-border/20 space-y-3">
        <p className="font-medium text-sm">Para instalar no Android:</p>
        <ol className="text-sm text-muted-foreground space-y-2">
          <InstallStep step={1}>
            Toque no menu <MoreVertical className="w-4 h-4 inline mx-1" /> do navegador
          </InstallStep>
          <InstallStep step={2}>
            Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"
          </InstallStep>
          <InstallStep step={3}>
            Confirme a instalação
          </InstallStep>
        </ol>
      </div>
    );
  }

  return (
    <div className="p-4 bg-card rounded-lg border border-border/20">
      <p className="text-sm text-muted-foreground text-center">
        Use um navegador moderno (Chrome, Edge, Safari) para instalar o app.
      </p>
    </div>
  );
}
