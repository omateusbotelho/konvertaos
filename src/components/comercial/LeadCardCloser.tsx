import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  CalendarPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadCardCloserProps {
  id: string;
  nome: string;
  empresa?: string;
  sdrNome?: string;
  dataAgendamento?: Date;
  valorProposta?: number;
  etapaDesde?: Date;
  semResposta48h?: boolean;
  etapaAtual?: string;
  onClick?: () => void;
  onReagendar?: () => void;
  onRegistrarAtividade?: () => void;
}

export function LeadCardCloser({
  id,
  nome,
  empresa,
  sdrNome,
  dataAgendamento,
  valorProposta,
  etapaDesde,
  semResposta48h,
  etapaAtual,
  onClick,
  onReagendar,
  onRegistrarAtividade,
}: LeadCardCloserProps) {
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

  const tempoNaEtapa = useMemo(() => {
    if (!etapaDesde) return null;
    return formatDistanceToNow(etapaDesde, { locale: ptBR });
  }, [etapaDesde]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

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
              <DropdownMenuItem onClick={onRegistrarAtividade}>
                Registrar atividade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onReagendar}>
                Reagendar reunião
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main info */}
        {dataAgendamento && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Reunião: {format(dataAgendamento, "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
          </div>
        )}

        {valorProposta && valorProposta > 0 && (
          <div className="flex items-center gap-1.5 text-xs mb-2">
            <DollarSign className="w-3.5 h-3.5 text-success" />
            <span className="font-medium text-success">
              {formatCurrency(valorProposta)}/mês
            </span>
          </div>
        )}

        {/* SDR Origin */}
        {sdrNome && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <User className="w-3.5 h-3.5" />
            <span>SDR: {sdrNome}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-border/20">
          {tempoNaEtapa && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>há {tempoNaEtapa} nesta etapa</span>
            </div>
          )}

          {/* Alert for no response > 48h */}
          {semResposta48h && (
            <div className="flex items-center gap-1 text-xs text-destructive animate-pulse">
              <AlertCircle className="w-3 h-3" />
              <span className="font-medium">Sem resposta há 48h</span>
            </div>
          )}

          {/* Reagendar button for no_show */}
          {etapaAtual === "no_show" && onReagendar && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full gap-1.5 text-xs h-8"
              onClick={(e) => {
                e.stopPropagation();
                onReagendar();
              }}
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Reagendar Reunião
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
