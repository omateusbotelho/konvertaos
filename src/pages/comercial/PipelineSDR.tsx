import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { KanbanColumn, LeadCard } from "@/components/kanban";
import {
  useLeadsSDR,
  useOrigensLead,
  useUpdateLeadEtapa,
  useLeadsCount,
  ETAPAS_SDR,
  type EtapaSDR,
} from "@/hooks/useLeadsSDR";
import { Plus, Search, X, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

const ETAPA_CONFIG: Record<
  EtapaSDR,
  { label: string; color: string; collapsible?: boolean }
> = {
  novo: { label: "Novo Lead", color: "#3B82F6" },
  tentativa_contato: { label: "Tentativa de Contato", color: "#8B5CF6" },
  contato_realizado: { label: "Contato Realizado", color: "#F59E0B" },
  qualificado: { label: "Qualificado", color: "#10B981" },
  reuniao_agendada: { label: "Reunião Agendada", color: "#06B6D4" },
  perdido: { label: "Perdido", color: "#EF4444", collapsible: true },
};

export default function PipelineSDR() {
  const [busca, setBusca] = useState("");
  const [origemId, setOrigemId] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [comFollowUpPendente, setComFollowUpPendente] = useState(false);

  const filters = useMemo(
    () => ({
      busca: busca || undefined,
      origemId: origemId || undefined,
      dataInicio: dateRange?.from,
      dataFim: dateRange?.to,
      comFollowUpPendente,
    }),
    [busca, origemId, dateRange, comFollowUpPendente]
  );

  const { data: leads, isLoading } = useLeadsSDR(filters);
  const { data: origens } = useOrigensLead();
  const { data: totalLeads } = useLeadsCount();
  const updateEtapa = useUpdateLeadEtapa();

  const leadsByEtapa = useMemo(() => {
    const grouped: Record<EtapaSDR, typeof leads> = {
      novo: [],
      tentativa_contato: [],
      contato_realizado: [],
      qualificado: [],
      reuniao_agendada: [],
      perdido: [],
    };

    leads?.forEach((lead) => {
      const etapa = lead.etapa_sdr || "novo";
      if (grouped[etapa]) {
        grouped[etapa]!.push(lead);
      }
    });

    return grouped;
  }, [leads]);

  const handleDrop = (leadId: string, etapa: EtapaSDR) => {
    updateEtapa.mutate(
      { leadId, etapa },
      {
        onSuccess: () => {
          toast.success(`Lead movido para ${ETAPA_CONFIG[etapa].label}`);
        },
        onError: () => {
          toast.error("Erro ao mover lead");
        },
      }
    );
  };

  const clearFilters = () => {
    setBusca("");
    setOrigemId("");
    setDateRange(undefined);
    setComFollowUpPendente(false);
  };

  const hasFilters = busca || origemId || dateRange || comFollowUpPendente;

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1>Pipeline SDR</h1>
            <p className="text-muted-foreground mt-1">
              {totalLeads} leads ativos
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Lead
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-card/50 rounded-lg border border-border/20">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, empresa, telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Origin Select */}
          <Select value={origemId} onValueChange={setOrigemId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              {origens?.map((origem) => (
                <SelectItem key={origem.id} value={origem.id}>
                  {origem.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yy", { locale: ptBR })
                  )
                ) : (
                  "Data de entrada"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          {/* Follow-up Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="follow-up"
              checked={comFollowUpPendente}
              onCheckedChange={setComFollowUpPendente}
            />
            <Label htmlFor="follow-up" className="text-sm cursor-pointer">
              Com follow-up pendente
            </Label>
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1"
            >
              <X className="w-4 h-4" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {ETAPAS_SDR.map((etapa) => {
                const config = ETAPA_CONFIG[etapa];
                const etapaLeads = leadsByEtapa[etapa] || [];

                return (
                  <KanbanColumn
                    key={etapa}
                    title={config.label}
                    count={etapaLeads.length}
                    color={config.color}
                    isCollapsible={config.collapsible}
                    defaultCollapsed={config.collapsible}
                    onDrop={(leadId) => handleDrop(leadId, etapa)}
                  >
                    {etapaLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        id={lead.id}
                        nome={lead.nome}
                        empresa={lead.empresa || undefined}
                        telefone={lead.telefone}
                        email={lead.email || undefined}
                        origem={lead.origem_nome}
                        servicoInteresse={lead.servico_nome}
                        followUp={lead.follow_up}
                        ultimaAtividade={lead.ultima_atividade}
                        onClick={() => {
                          // TODO: Open lead detail modal
                        }}
                      />
                    ))}
                  </KanbanColumn>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
