import { useState } from "react";
import { cn } from "@/lib/utils";
import { Phone, Mail, Building2, Clock, MessageCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  ultimaAtividade?: Date;
  onClick?: () => void;
}

export function LeadCard({
  id,
  nome,
  empresa,
  telefone,
  email,
  origem,
  servicoInteresse,
  followUp,
  ultimaAtividade,
  onClick,
}: LeadCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("leadId", id);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const followUpStatus = followUp
    ? isPast(followUp.data) && !isToday(followUp.data)
      ? "overdue"
      : isToday(followUp.data)
      ? "today"
      : "upcoming"
    : null;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={cn(
        "bg-card border border-border/20 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:border-border/40 hover:shadow-lg",
        isDragging && "opacity-50 scale-95"
      )}
    >
      {/* Header: Name + Company */}
      <div className="mb-2">
        <h4 className="font-medium text-foreground text-sm truncate">{nome}</h4>
        {empresa && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{empresa}</span>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="flex flex-col gap-1 mb-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Phone className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{telefone}</span>
        </div>
        {email && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {origem && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {origem}
          </Badge>
        )}
        {servicoInteresse && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {servicoInteresse}
          </Badge>
        )}
      </div>

      {/* Follow-up Indicator */}
      {followUp && (
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs rounded-md p-1.5 mt-2",
            followUpStatus === "overdue" && "bg-destructive/10 text-destructive",
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
              ? `Atrasado ${formatDistanceToNow(followUp.data, { locale: ptBR })}`
              : followUpStatus === "today"
              ? "Hoje"
              : format(followUp.data, "dd/MM", { locale: ptBR })}
          </span>
        </div>
      )}

      {/* Last Activity */}
      {ultimaAtividade && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/10">
          <MessageCircle className="w-3 h-3" />
          <span>
            Última atividade{" "}
            {formatDistanceToNow(ultimaAtividade, {
              locale: ptBR,
              addSuffix: true,
            })}
          </span>
        </div>
      )}
    </div>
  );
}
