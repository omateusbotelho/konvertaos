import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Calendar,
  RefreshCcw,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadCardFrioProps {
  id: string;
  nome: string;
  empresa?: string;
  funilAnterior?: string;
  motivoPerda?: string;
  proximaTentativa?: Date;
  tentativas?: number;
  maxTentativas?: number;
  onClick?: () => void;
  onReativar?: () => void;
}

export function LeadCardFrio({
  id,
  nome,
  empresa,
  funilAnterior,
  motivoPerda,
  proximaTentativa,
  tentativas = 0,
  maxTentativas = 3,
  onClick,
  onReativar,
}: LeadCardFrioProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const diasAteProximaTentativa = useMemo(() => {
    if (!proximaTentativa) return null;
    const dias = differenceInDays(proximaTentativa, new Date());
    return dias;
  }, [proximaTentativa]);

  const isUltimaTentativa = tentativas >= maxTentativas - 1;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all duration-200 border border-border/30 hover:border-border/60 hover:shadow-md bg-card",
        isDragging && "opacity-50 shadow-xl scale-105 rotate-2"
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3" onClick={onClick}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{nome}</h4>
            {empresa && (
              <p className="text-xs text-muted-foreground truncate">{empresa}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-accent"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onClick}>Ver detalhes</DropdownMenuItem>
              <DropdownMenuItem onClick={onReativar}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Reativar lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Origin Info */}
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mb-2">
          {funilAnterior && (
            <div className="flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Veio de: Pipeline {funilAnterior === "sdr" ? "SDR" : "Closer"}</span>
            </div>
          )}
          {motivoPerda && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Motivo: {motivoPerda}</span>
            </div>
          )}
        </div>

        {/* Next attempt / Attempts counter */}
        <div className="flex flex-col gap-1 pt-2 border-t border-border/20">
          {proximaTentativa && (
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>
                Próxima tentativa:{" "}
                {diasAteProximaTentativa !== null && diasAteProximaTentativa > 0
                  ? `em ${diasAteProximaTentativa} dias`
                  : format(proximaTentativa, "dd/MM", { locale: ptBR })}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>
              Tentativas: {tentativas}/{maxTentativas}
            </span>
          </div>

          {isUltimaTentativa && (
            <div className="flex items-center gap-1 text-xs text-warning animate-pulse mt-1">
              <AlertTriangle className="w-3 h-3" />
              <span className="font-medium">Última tentativa</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
