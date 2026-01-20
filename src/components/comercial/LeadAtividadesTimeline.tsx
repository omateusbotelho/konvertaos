import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone,
  MessageCircle,
  Mail,
  Video,
  FileText,
  Clock,
  Filter,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useLeadAtividades,
  LeadAtividade,
  ATIVIDADE_TIPO_LABELS,
  ATIVIDADE_TIPOS,
} from "@/hooks/useLeadAtividades";
import { Database } from "@/integrations/supabase/types";
import { ModalNovaAtividade } from "./ModalNovaAtividade";

type AtividadeTipo = Database["public"]["Enums"]["atividade_tipo"];

interface LeadAtividadesTimelineProps {
  leadId: string | null;
  leadNome?: string;
}

// Ícones e cores por tipo de atividade
const ATIVIDADE_CONFIG: Record<
  AtividadeTipo,
  { icon: typeof Phone; bgColor: string; textColor: string }
> = {
  ligacao: {
    icon: Phone,
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-500",
  },
  whatsapp: {
    icon: MessageCircle,
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-500",
  },
  email: {
    icon: Mail,
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-500",
  },
  reuniao: {
    icon: Video,
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-500",
  },
  anotacao: {
    icon: FileText,
    bgColor: "bg-muted",
    textColor: "text-muted-foreground",
  },
};

export function LeadAtividadesTimeline({ leadId, leadNome }: LeadAtividadesTimelineProps) {
  const [tipoFilter, setTipoFilter] = useState<AtividadeTipo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { data: atividades, isLoading } = useLeadAtividades({
    leadId,
    tipoFilter,
  });

  const handleFilterClick = (tipo: AtividadeTipo) => {
    setTipoFilter((prev) => (prev === tipo ? null : tipo));
  };

  const clearFilter = () => {
    setTipoFilter(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Modal de Nova Atividade */}
      {leadId && (
        <ModalNovaAtividade
          open={modalOpen}
          onOpenChange={setModalOpen}
          leadId={leadId}
          leadNome={leadNome}
        />
      )}

      {/* Header com botão de adicionar */}
      <div className="px-6 py-3 border-b border-border/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Filtrar por tipo
            </span>
          </div>
          <div className="flex items-center gap-2">
            {tipoFilter && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={clearFilter}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="w-3 h-3" />
              Registrar
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ATIVIDADE_TIPOS.map((tipo) => {
            const config = ATIVIDADE_CONFIG[tipo];
            const Icon = config.icon;
            const isActive = tipoFilter === tipo;

            return (
              <Button
                key={tipo}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 text-xs gap-1.5",
                  isActive && "bg-primary text-primary-foreground"
                )}
                onClick={() => handleFilterClick(tipo)}
              >
                <Icon className="w-3 h-3" />
                {ATIVIDADE_TIPO_LABELS[tipo]}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <TimelineSkeleton />
          ) : !atividades || atividades.length === 0 ? (
            <EmptyState tipoFilter={tipoFilter} />
          ) : (
            <div className="relative space-y-0">
              {atividades.map((atividade, index) => (
                <TimelineItem
                  key={atividade.id}
                  atividade={atividade}
                  isLast={index === atividades.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function TimelineItem({
  atividade,
  isLast,
}: {
  atividade: LeadAtividade;
  isLast: boolean;
}) {
  const config = ATIVIDADE_CONFIG[atividade.tipo];
  const Icon = config.icon;

  return (
    <div className="flex gap-3 pb-4 last:pb-0">
      {/* Icon + Line */}
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "p-2 rounded-full shrink-0",
            config.bgColor,
            config.textColor
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        {!isLast && (
          <div className="flex-1 w-px bg-border/50 mt-2 min-h-[16px]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0 font-normal",
              config.bgColor,
              config.textColor
            )}
          >
            {ATIVIDADE_TIPO_LABELS[atividade.tipo]}
          </Badge>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(atividade.dataAtividade, {
              locale: ptBR,
              addSuffix: true,
            })}
          </span>
        </div>

        <p className="text-sm text-foreground mt-1.5 break-words">
          {atividade.descricao}
        </p>

        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
          {atividade.realizadoPor && (
            <span>Por {atividade.realizadoPor.nome}</span>
          )}
          <span>•</span>
          <span>
            {format(atividade.dataAtividade, "dd/MM/yy HH:mm", { locale: ptBR })}
          </span>
        </div>
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ tipoFilter }: { tipoFilter: AtividadeTipo | null }) {
  return (
    <div className="text-center py-8">
      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
      <p className="text-sm text-muted-foreground">
        {tipoFilter
          ? `Nenhuma atividade do tipo "${ATIVIDADE_TIPO_LABELS[tipoFilter]}" encontrada`
          : "Nenhuma atividade registrada"}
      </p>
    </div>
  );
}
