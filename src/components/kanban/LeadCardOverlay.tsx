import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ORIGEM_COLORS: Record<string, string> = {
  "Formulário Site": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Anúncio Meta": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Anúncio Google": "bg-green-500/20 text-green-400 border-green-500/30",
  "Indicação": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Ligação": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Outro": "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

interface LeadCardOverlayProps {
  nome: string;
  empresa?: string;
  origem?: string;
}

/**
 * Lightweight version of LeadCard for DragOverlay
 * No hooks, no dropdown, no sortable - just static UI
 */
export function LeadCardOverlay({ nome, empresa, origem }: LeadCardOverlayProps) {
  const origemColorClass = origem ? ORIGEM_COLORS[origem] || ORIGEM_COLORS["Outro"] : "";

  return (
    <div className="bg-card border border-border/20 rounded-lg p-3 shadow-2xl opacity-90 rotate-3 scale-105">
      {/* Header: Origin Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {origem && (
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0 border", origemColorClass)}
          >
            {origem}
          </Badge>
        )}
      </div>

      {/* Name + Company */}
      <div className="mb-2">
        <h4 className="font-medium text-foreground text-sm truncate">
          {nome}
        </h4>
        {empresa && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{empresa}</span>
          </div>
        )}
      </div>
    </div>
  );
}
