import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
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
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { LeadCard } from "@/components/kanban/LeadCard";
import { LeadCardOverlay } from "@/components/kanban/LeadCardOverlay";
import {
  NovoLeadModal,
  ModalPerda,
  ModalAgendamento,
  LeadDrawer,
} from "@/components/comercial";
import {
  useLeadsSDR,
  useOrigensLead,
  useUpdateLeadEtapa,
  useLeadsCount,
  ETAPAS_SDR,
  type EtapaSDR,
  type LeadSDR,
} from "@/hooks/useLeadsSDR";
import { useDragState } from "@/hooks/useDragState";
import { useModalState } from "@/hooks/useModalState";
import { Plus, Search, X, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [origemId, setOrigemId] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [comFollowUpPendente, setComFollowUpPendente] = useState(false);

  // Novo Lead Modal - isolated state
  const [novoLeadOpen, setNovoLeadOpen] = useState(false);
  
  // Lead Drawer - isolated state
  const [drawerLead, setDrawerLead] = useState<LeadSDR | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Isolated drag and modal states (reduces re-renders)
  const { activeId, pendingDrop, startDrag, endDrag, setPending, clearPending } = useDragState();
  const { 
    perdaModal, 
    agendamentoModal, 
    openPerdaModal, 
    closePerdaModal, 
    openAgendamentoModal, 
    closeAgendamentoModal 
  } = useModalState();

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

  // Fetch services
  const { data: servicos } = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome")
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch SDRs
  const { data: sdrs } = useQuery({
    queryKey: ["profiles-sdr"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome")
        .eq("cargo", "sdr")
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch Closers
  const { data: closers } = useQuery({
    queryKey: ["profiles-closer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome")
        .eq("cargo", "closer")
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch motivos de perda
  const { data: motivosPerda } = useQuery({
    queryKey: ["motivos-perda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("motivos_perda")
        .select("id, nome")
        .eq("ativo", true)
        .or("aplicavel_a.eq.sdr,aplicavel_a.eq.ambos");
      if (error) throw error;
      return data;
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const leadsByEtapa = useMemo(() => {
    const grouped: Record<EtapaSDR, LeadSDR[]> = {
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
        grouped[etapa].push(lead);
      }
    });

    return grouped;
  }, [leads]);

  const activeLead = useMemo(
    () => leads?.find((l) => l.id === activeId) || null,
    [leads, activeId]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    startDrag(event.active.id as string);
  }, [startDrag]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    endDrag();

    if (!over) return;

    const leadId = active.id as string;
    const targetEtapa = over.id as EtapaSDR;
    const lead = leads?.find((l) => l.id === leadId);

    if (!lead || lead.etapa_sdr === targetEtapa) return;

    // Special handling for "perdido"
    if (targetEtapa === "perdido") {
      setPending(leadId, targetEtapa);
      openPerdaModal(leadId, lead.nome);
      return;
    }

    // Special handling for "reuniao_agendada"
    if (targetEtapa === "reuniao_agendada") {
      setPending(leadId, targetEtapa);
      openAgendamentoModal(leadId, lead.nome);
      return;
    }

    // Normal move
    updateEtapa.mutate(
      { leadId, etapa: targetEtapa },
      {
        onSuccess: () => {
          toast.success(`Lead movido para ${ETAPA_CONFIG[targetEtapa].label}`);
        },
        onError: () => {
          toast.error("Erro ao mover lead");
        },
      }
    );
  }, [leads, endDrag, setPending, openPerdaModal, openAgendamentoModal, updateEtapa]);

  const handleConfirmPerda = useCallback(async (data: {
    motivo_perda_id: string;
    observacoes?: string;
  }) => {
    if (!pendingDrop) return;

    const { error } = await supabase
      .from("leads")
      .update({
        etapa_sdr: "perdido",
        motivo_perda_id: data.motivo_perda_id,
        data_perda: new Date().toISOString(),
        observacoes: data.observacoes || undefined,
      })
      .eq("id", pendingDrop.leadId);

    if (error) {
      toast.error("Erro ao marcar lead como perdido");
      return;
    }

    toast.success("Lead marcado como perdido");
    queryClient.invalidateQueries({ queryKey: ["leads-sdr"] });
    closePerdaModal();
    clearPending();
  }, [pendingDrop, queryClient, closePerdaModal, clearPending]);

  const handleCancelPerda = useCallback(() => {
    clearPending();
  }, [clearPending]);

  const handleConfirmAgendamento = useCallback(async (data: {
    data: Date;
    horario: string;
    closer_id: string;
    observacoes?: string;
  }) => {
    if (!pendingDrop) return;

    const [hours, minutes] = data.horario.split(":").map(Number);
    const dataAgendamento = new Date(data.data);
    dataAgendamento.setHours(hours, minutes, 0, 0);

    const { error } = await supabase
      .from("leads")
      .update({
        etapa_sdr: "reuniao_agendada",
        closer_responsavel_id: data.closer_id,
        data_agendamento: dataAgendamento.toISOString(),
      })
      .eq("id", pendingDrop.leadId);

    if (error) {
      toast.error("Erro ao agendar reunião");
      return;
    }

    // Create activity
    await supabase.from("atividades_lead").insert({
      lead_id: pendingDrop.leadId,
      tipo: "reuniao",
      descricao: `Reunião agendada para ${format(dataAgendamento, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}${data.observacoes ? `. ${data.observacoes}` : ""}`,
      realizado_por_id: profile?.id,
    });

    toast.success("Reunião agendada com sucesso");
    queryClient.invalidateQueries({ queryKey: ["leads-sdr"] });
    closeAgendamentoModal();
    clearPending();
  }, [pendingDrop, profile?.id, queryClient, closeAgendamentoModal, clearPending]);

  const handleCancelAgendamento = useCallback(() => {
    clearPending();
  }, [clearPending]);

  const handleNovoLead = async (data: any) => {
    let sdrId = data.sdr_responsavel_id;

    // Auto-assign if not admin or no SDR selected
    if (!sdrId && sdrs && sdrs.length > 0) {
      // Simple round-robin: get SDR with least leads
      const sdrCounts = await Promise.all(
        sdrs.map(async (sdr) => {
          const { count } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("sdr_responsavel_id", sdr.id)
            .eq("funil_atual", "sdr");
          return { id: sdr.id, count: count || 0 };
        })
      );
      const minSdr = sdrCounts.reduce((min, curr) =>
        curr.count < min.count ? curr : min
      );
      sdrId = minSdr.id;
    }

    const { error } = await supabase.from("leads").insert({
      nome: data.nome,
      empresa: data.empresa || null,
      telefone: data.telefone,
      email: data.email || null,
      origem_id: data.origem_id,
      servico_interesse_id: data.servico_interesse_id || null,
      observacoes: data.observacoes || null,
      sdr_responsavel_id: sdrId || profile?.id,
      etapa_sdr: "novo",
      funil_atual: "sdr",
    });

    if (error) {
      toast.error("Erro ao criar lead");
      throw error;
    }

    toast.success("Lead criado com sucesso");
    queryClient.invalidateQueries({ queryKey: ["leads-sdr"] });
    queryClient.invalidateQueries({ queryKey: ["leads-sdr-count"] });
  };

  const openLeadDrawer = (lead: LeadSDR) => {
    setDrawerLead(lead);
    setDrawerOpen(true);
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
          <Button className="gap-2" onClick={() => setNovoLeadOpen(true)}>
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
                className={cn("p-3 pointer-events-auto")}
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {ETAPAS_SDR.map((etapa) => {
                  const config = ETAPA_CONFIG[etapa];
                  const etapaLeads = leadsByEtapa[etapa] || [];

                  return (
                    <KanbanColumn
                      key={etapa}
                      id={etapa}
                      title={config.label}
                      count={etapaLeads.length}
                      color={config.color}
                      itemIds={etapaLeads.map((l) => l.id)}
                      isCollapsible={config.collapsible}
                      defaultCollapsed={config.collapsible}
                    >
                      {etapaLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          id={lead.id}
                          nome={lead.nome}
                          empresa={lead.empresa || undefined}
                          telefone={lead.telefone}
                          origem={lead.origem_nome}
                          servicoInteresse={lead.servico_nome}
                          followUp={lead.follow_up}
                          ultimaAtividade={
                            lead.ultima_atividade
                              ? { tipo: "ligacao", data: lead.ultima_atividade }
                              : undefined
                          }
                          etapaDesde={lead.updated_at ? new Date(lead.updated_at) : undefined}
                          onClick={() => openLeadDrawer(lead)}
                        />
                      ))}
                    </KanbanColumn>
                  );
                })}
              </div>
            </div>

            {/* Lightweight Drag Overlay - no hooks, no dropdown */}
            <DragOverlay>
              {activeLead && (
                <LeadCardOverlay
                  nome={activeLead.nome}
                  empresa={activeLead.empresa || undefined}
                  origem={activeLead.origem_nome}
                />
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* Modals */}
        <NovoLeadModal
          open={novoLeadOpen}
          onOpenChange={setNovoLeadOpen}
          onSubmit={handleNovoLead}
          origens={origens || []}
          servicos={servicos || []}
          sdrs={sdrs || []}
        />

        <ModalPerda
          open={perdaModal.open}
          onOpenChange={(open) => !open && closePerdaModal()}
          onConfirm={handleConfirmPerda}
          onCancel={handleCancelPerda}
          leadNome={perdaModal.leadNome}
          motivosPerda={motivosPerda || []}
        />

        <ModalAgendamento
          open={agendamentoModal.open}
          onOpenChange={(open) => !open && closeAgendamentoModal()}
          onConfirm={handleConfirmAgendamento}
          onCancel={handleCancelAgendamento}
          leadNome={agendamentoModal.leadNome}
          closers={closers || []}
        />

        <LeadDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          lead={
            drawerLead
              ? {
                  id: drawerLead.id,
                  nome: drawerLead.nome,
                  empresa: drawerLead.empresa || undefined,
                  telefone: drawerLead.telefone,
                  email: drawerLead.email || undefined,
                  origem: drawerLead.origem_nome,
                  etapa: ETAPA_CONFIG[drawerLead.etapa_sdr || "novo"]?.label,
                  servicoInteresse: drawerLead.servico_nome,
                  observacoes: drawerLead.observacoes || undefined,
                  createdAt: new Date(drawerLead.created_at || Date.now()),
                }
              : null
          }
          atividades={[]}
          followUps={[]}
          historico={[]}
        />
      </div>
    </AppLayout>
  );
}
