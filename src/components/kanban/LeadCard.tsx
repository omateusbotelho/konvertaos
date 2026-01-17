import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  Phone,
  Mail,
  Building2,
  Clock,
  MessageCircle,
  AlertCircle,
  MoreVertical,
  Edit,
  Eye,
  CalendarPlus,
  PhoneCall,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, formatDistanceToNow, isToday, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// Origin colors mapping
const ORIGEM_COLORS: Record<string, string> = {
  "Formulário Site": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Anúncio Meta": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Anúncio Google": "bg-green-500/20 text-green-400 border-green-500/30",
  "Indicação": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Ligação": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Outro": "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

interface LeadCardProps {
  id: string;
  nome: string;
  empresa?: string;
  telefone: string;
  email?: string;
  origem?: string;
  servicoInteresse?: string;
  followUp?: {
    data: Date;
    descricao?: string;
  };
  ultimaAtividade?: {
    tipo: string;
    data: Date;
  };
  createdAt?: Date;
  etapaDesde?: Date;
  onClick?: () => void;
  onEdit?: () => void;
  onRegistrarAtividade?: () => void;
  onAgendarFollowUp?: () => void;
}

export function LeadCard({
  id,
  nome,
  empresa,
  telefone,
  origem,
  servicoInteresse,
  followUp,
  ultimaAtividade,
  etapaDesde,
  onClick,
  onEdit,
  onRegistrarAtividade,
  onAgendarFollowUp,
}: LeadCardProps) {
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

  const followUpStatus = followUp
    ? isPast(followUp.data) && !isToday(followUp.data)
      ? "overdue"
      : isToday(followUp.data)
      ? "today"
      : "upcoming"
    : null;

  const diasNaEtapa = etapaDesde ? differenceInDays(new Date(), etapaDesde) : 0;

  const origemColorClass = origem ? ORIGEM_COLORS[origem] || ORIGEM_COLORS["Outro"] : "";

  const getAtividadeIcon = (tipo: string) => {
    switch (tipo) {
      case "ligacao":
        return <PhoneCall className="w-3 h-3" />;
      case "whatsapp":
        return <MessageCircle className="w-3 h-3" />;
      case "email":
        return <Mail className="w-3 h-3" />;
      default:
        return <MessageCircle className="w-3 h-3" />;
    }
  };

  const getAtividadeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ligacao: "Ligação",
      whatsapp: "WhatsApp",
      email: "E-mail",
      reuniao: "Reunião",
      anotacao: "Anotação",
    };
    return labels[tipo] || tipo;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-card border border-border/20 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:border-border/40",
        isDragging && "opacity-50 scale-105 shadow-2xl rotate-2 z-50"
      )}
    >
      {/* Header: Origin Badge + Menu */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {origem && (
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0 border", origemColorClass)}
          >
            {origem}
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-1 -mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onClick}>
              <Eye className="w-4 h-4 mr-2" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRegistrarAtividade}>
              <Phone className="w-4 h-4 mr-2" />
              Registrar atividade
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAgendarFollowUp}>
              <CalendarPlus className="w-4 h-4 mr-2" />
              Agendar follow-up
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Name + Company */}
      <div className="mb-2" onClick={onClick}>
        <h4 className="font-medium text-foreground text-sm truncate cursor-pointer hover:text-primary transition-colors">
          {nome}
        </h4>
        {empresa && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{empresa}</span>
          </div>
        )}
      </div>

      {/* Last Activity */}
      {ultimaAtividade && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          {getAtividadeIcon(ultimaAtividade.tipo)}
          <span>
            {getAtividadeLabel(ultimaAtividade.tipo)}{" "}
            {formatDistanceToNow(ultimaAtividade.data, {
              locale: ptBR,
              addSuffix: true,
            })}
          </span>
        </div>
      )}

      {/* Time in Stage */}
      {etapaDesde && diasNaEtapa > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Clock className="w-3 h-3" />
          <span>há {diasNaEtapa} {diasNaEtapa === 1 ? "dia" : "dias"} nesta etapa</span>
        </div>
      )}

      {/* Service Badge */}
      {servicoInteresse && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mb-2">
          {servicoInteresse}
        </Badge>
      )}

      {/* Follow-up Indicator */}
      {followUp && (
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs rounded-md p-1.5 mt-2",
            followUpStatus === "overdue" && "bg-destructive/10 text-destructive animate-pulse",
            followUpStatus === "today" && "bg-warning/10 text-warning-foreground",
            followUpStatus === "upcoming" && "bg-info/10 text-info"
          )}
        >
          {followUpStatus === "overdue" ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          <span>
            {followUpStatus === "overdue"
              ? `Follow-up atrasado`
              : followUpStatus === "today"
              ? "Follow-up hoje"
              : `Follow-up ${format(followUp.data, "dd/MM", { locale: ptBR })}`}
          </span>
        </div>
      )}
    </div>
  );
}
