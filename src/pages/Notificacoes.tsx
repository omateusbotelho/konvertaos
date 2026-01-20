import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCheck, Bell, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KonvertaCard } from "@/components/ui/konverta-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotificacoes,
  useMarcarComoLida,
  useMarcarTodasComoLidas,
  Notificacao,
} from "@/hooks/useNotificacoes";
import { format, isToday, isYesterday, startOfDay } from "date-fns";
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
  no_show_lead: "🚫",
  geral: "📢",
};

const tipoLabels: Record<string, string> = {
  tarefa_atribuida: "Tarefas",
  tarefa_prazo: "Tarefas",
  tarefa_comentario: "Tarefas",
  tarefa_mencao: "Menções",
  lead_recebido: "Leads",
  reuniao_agendada: "Reuniões",
  reuniao_lembrete: "Reuniões",
  cliente_ativado: "Clientes",
  pagamento_confirmado: "Pagamentos",
  pagamento_atrasado: "Pagamentos",
  sla_alerta: "SLA",
  ausencia_solicitada: "Ausências",
  ausencia_aprovada: "Ausências",
  nps_detrator: "NPS",
  contrato_vencendo: "Contratos",
  no_show_lead: "No-show",
  geral: "Geral",
};

export default function Notificacoes() {
  const navigate = useNavigate();
  const [apenasNaoLidas, setApenasNaoLidas] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<string>("todas");

  const { data: notificacoes, isLoading } = useNotificacoes({
    apenasNaoLidas,
    limite: 100,
  });
  const { mutate: marcarComoLida } = useMarcarComoLida();
  const { mutate: marcarTodas, isPending: marcandoTodas } = useMarcarTodasComoLidas();

  // Filtrar por tipo
  const notificacoesFiltradas = notificacoes?.filter((n) => {
    if (tipoFiltro === "todas") return true;
    return tipoLabels[n.tipo] === tipoFiltro;
  });

  // Agrupar por data
  const gruposData = notificacoesFiltradas?.reduce(
    (acc, notificacao) => {
      const data = startOfDay(new Date(notificacao.created_at));
      const key = data.toISOString();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(notificacao);
      return acc;
    },
    {} as Record<string, Notificacao[]>
  );

  const handleNotificacaoClick = (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      marcarComoLida(notificacao.id);
    }
    if (notificacao.link) {
      navigate(notificacao.link);
    }
  };

  const formatarGrupoData = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const tiposUnicos = [
    ...new Set(Object.values(tipoLabels)),
  ];

  const naoLidas = notificacoes?.filter((n) => !n.lida).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-muted-foreground">
            {naoLidas > 0 ? `${naoLidas} não lidas` : "Todas lidas"}
          </p>
        </div>
        {naoLidas > 0 && (
          <Button
            variant="outline"
            onClick={() => marcarTodas()}
            disabled={marcandoTodas}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <KonvertaCard className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>

          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {tiposUnicos.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Checkbox
              id="apenas-nao-lidas"
              checked={apenasNaoLidas}
              onCheckedChange={(checked) => setApenasNaoLidas(!!checked)}
            />
            <Label htmlFor="apenas-nao-lidas" className="text-sm">
              Não lidas apenas
            </Label>
          </div>
        </div>
      </KonvertaCard>

      {/* Lista de notificações */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <KonvertaCard key={i} className="p-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </KonvertaCard>
          ))}
        </div>
      ) : gruposData && Object.keys(gruposData).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(gruposData)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([dataKey, notificacoesGrupo]) => (
              <div key={dataKey} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground px-1">
                  {formatarGrupoData(dataKey)}
                </h3>
                <div className="space-y-2">
                  {notificacoesGrupo.map((notificacao) => (
                    <KonvertaCard
                      key={notificacao.id}
                      className={cn(
                        "p-4 cursor-pointer transition-colors hover:border-primary/30",
                        !notificacao.lida && "border-primary/20 bg-primary/5"
                      )}
                      onClick={() => handleNotificacaoClick(notificacao)}
                    >
                      <div className="flex gap-4">
                        <div className="text-2xl flex-shrink-0">
                          {tipoIcones[notificacao.tipo] || "📢"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {!notificacao.lida && (
                                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                              <p className="font-medium">{notificacao.titulo}</p>
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {format(
                                new Date(notificacao.created_at),
                                "HH:mm",
                                { locale: ptBR }
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notificacao.mensagem}
                          </p>
                          {notificacao.link && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 mt-2 text-xs"
                            >
                              Ver detalhes →
                            </Button>
                          )}
                        </div>
                      </div>
                    </KonvertaCard>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <KonvertaCard className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-medium text-lg mb-2">Nenhuma notificação</h3>
          <p className="text-muted-foreground text-sm">
            {apenasNaoLidas
              ? "Todas as notificações foram lidas"
              : "Você não possui notificações ainda"}
          </p>
        </KonvertaCard>
      )}
    </div>
  );
}
