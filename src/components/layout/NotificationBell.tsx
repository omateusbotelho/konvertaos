import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotificacoes,
  useNotificacoesNaoLidas,
  useMarcarComoLida,
  useMarcarTodasComoLidas,
  Notificacao,
} from "@/hooks/useNotificacoes";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const tipoIcones: Record<string, string> = {
  tarefa_atribuida: "📋",
  tarefa_prazo: "⏰",
  tarefa_comentario: "💬",
  tarefa_mencao: "💬",
  lead_recebido: "🎯",
  reuniao_agendada: "📅",
  reuniao_lembrete: "🔔",
  cliente_ativado: "🎉",
  pagamento_confirmado: "💰",
  pagamento_atrasado: "⚠️",
  sla_alerta: "🚨",
  ausencia_solicitada: "🏖️",
  ausencia_aprovada: "✅",
  nps_detrator: "😟",
  contrato_vencendo: "📄",
  geral: "📢",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  const { data: count = 0 } = useNotificacoesNaoLidas();
  const { data: notificacoes, isLoading } = useNotificacoes({ limite: 10 });
  const { mutate: marcarComoLida } = useMarcarComoLida();
  const { mutate: marcarTodas, isPending: marcandoTodas } = useMarcarTodasComoLidas();

  const handleNotificacaoClick = (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      marcarComoLida(notificacao.id);
    }
    if (notificacao.link) {
      setOpen(false);
      navigate(notificacao.link);
    }
  };

  const naoLidas = notificacoes?.filter((n) => !n.lida).length || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {count > 9 ? "9+" : count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {naoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={() => marcarTodas()}
              disabled={marcandoTodas}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notificacoes && notificacoes.length > 0 ? (
            <div className="divide-y">
              {notificacoes.map((notificacao) => (
                <button
                  key={notificacao.id}
                  onClick={() => handleNotificacaoClick(notificacao)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3",
                    !notificacao.lida && "bg-primary/5"
                  )}
                >
                  <div className="text-xl flex-shrink-0">
                    {tipoIcones[notificacao.tipo] || "📢"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      {!notificacao.lida && (
                        <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {notificacao.titulo}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notificacao.mensagem}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notificacao.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!notificacao.lida && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        marcarComoLida(notificacao.id);
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link to="/notificacoes">
              Ver todas as notificações
              <ExternalLink className="h-3 w-3 ml-2" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
