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
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import {
  LeadCardCloser,
  ModalReuniaoRealizada,
  ModalProposta,
  ModalPerdaCloser,
  ModalFechadoGanho,
  ModalAtivacaoCliente,
  AgendaRapida,
  LeadDrawerCloser,
  ModalReagendarReuniao,
} from "@/components/comercial";
import type { ClienteData } from "@/components/comercial/ModalAtivacaoCliente";
import {
  useLeadsCloser,
  useUpdateLeadEtapaCloser,
  useLeadsCloserCount,
  useTodayMeetings,
  ETAPAS_CLOSER,
  type EtapaCloser,
  type LeadCloser,
} from "@/hooks/useLeadsCloser";
import { Search, X, CalendarIcon, Loader2 } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const ETAPA_CONFIG: Record<
  EtapaCloser,
  { label: string; color: string; collapsible?: boolean }
> = {
  reuniao_agendada: { label: "Reunião Agendada", color: "#3B82F6" },
  reuniao_realizada: { label: "Reunião Realizada", color: "#8B5CF6" },
  proposta_enviada: { label: "Proposta Enviada", color: "#F59E0B" },
  negociacao: { label: "Negociação", color: "#06B6D4" },
  fechado_ganho: { label: "Fechado (Ganho)", color: "#10B981" },
  no_show: { label: "No-show", color: "#F97316", collapsible: true },
  perdido: { label: "Perdido", color: "#EF4444", collapsible: true },
};

export default function PipelineCloser() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [sdrId, setSdrId] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [valorRange, setValorRange] = useState<[number, number]>([0, 50000]);
  const [propostaPendente, setPropostaPendente] = useState(false);

  // Modal states
  const [reuniaoModal, setReuniaoModal] = useState<{
    open: boolean;
    leadId: string;
    leadNome: string;
  }>({ open: false, leadId: "", leadNome: "" });
  const [propostaModal, setPropostaModal] = useState<{
    open: boolean;
    leadId: string;
    leadNome: string;
  }>({ open: false, leadId: "", leadNome: "" });
  const [perdaModal, setPerdaModal] = useState<{
    open: boolean;
    leadId: string;
    leadNome: string;
  }>({ open: false, leadId: "", leadNome: "" });
  const [fechadoModal, setFechadoModal] = useState<{
    open: boolean;
    leadId: string;
    leadNome: string;
    valorProposta?: number;
  }>({ open: false, leadId: "", leadNome: "" });
  const [ativacaoModal, setAtivacaoModal] = useState<{
    open: boolean;
    lead: LeadCloser | null;
  }>({ open: false, lead: null });
  const [reagendarModal, setReagendarModal] = useState<{
    open: boolean;
    leadId: string;
    leadNome: string;
  }>({ open: false, leadId: "", leadNome: "" });
  const [drawerLead, setDrawerLead] = useState<LeadCloser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingDrop, setPendingDrop] = useState<{
    leadId: string;
    etapa: EtapaCloser;
  } | null>(null);

  const filters = useMemo(
    () => ({
      busca: busca || undefined,
      sdrId: sdrId || undefined,
      dataInicio: dateRange?.from,
      dataFim: dateRange?.to,
      valorMin: valorRange[0] > 0 ? valorRange[0] : undefined,
      valorMax: valorRange[1] < 50000 ? valorRange[1] : undefined,
      propostaPendente48h: propostaPendente,
    }),
    [busca, sdrId, dateRange, valorRange, propostaPendente]
  );

  const { data: leads, isLoading } = useLeadsCloser(filters);
  const { data: totalLeads } = useLeadsCloserCount();
  const { data: todayMeetings, isLoading: loadingMeetings } = useTodayMeetings();
  const updateEtapa = useUpdateLeadEtapaCloser();

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

  // Fetch motivos de perda (for closer)
  const { data: motivosPerda } = useQuery({
    queryKey: ["motivos-perda-closer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("motivos_perda")
        .select("id, nome")
        .eq("ativo", true)
        .or("aplicavel_a.eq.closer,aplicavel_a.eq.ambos");
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
    const grouped: Record<EtapaCloser, LeadCloser[]> = {
      reuniao_agendada: [],
      reuniao_realizada: [],
      proposta_enviada: [],
      negociacao: [],
      fechado_ganho: [],
      no_show: [],
      perdido: [],
    };

    leads?.forEach((lead) => {
      const etapa = lead.etapa_closer || "reuniao_agendada";
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const targetEtapa = over.id as EtapaCloser;
    const lead = leads?.find((l) => l.id === leadId);

    if (!lead || lead.etapa_closer === targetEtapa) return;

    // Special handling for different stages
    if (targetEtapa === "reuniao_realizada") {
      setPendingDrop({ leadId, etapa: targetEtapa });
      setReuniaoModal({ open: true, leadId, leadNome: lead.nome });
      return;
    }

    if (targetEtapa === "proposta_enviada") {
      setPendingDrop({ leadId, etapa: targetEtapa });
      setPropostaModal({ open: true, leadId, leadNome: lead.nome });
      return;
    }

    if (targetEtapa === "perdido") {
      setPendingDrop({ leadId, etapa: targetEtapa });
      setPerdaModal({ open: true, leadId, leadNome: lead.nome });
      return;
    }

    if (targetEtapa === "no_show") {
      // Move to no_show - simple move with activity log and SDR notification
      updateEtapa.mutate(
        { leadId, etapa: targetEtapa },
        {
          onSuccess: async () => {
            // Create activity for no-show
            await supabase.from("atividades_lead").insert({
              lead_id: leadId,
              tipo: "anotacao" as const,
              descricao: "Lead marcado como No-show pelo Closer",
              realizado_por_id: profile?.id,
              data_atividade: new Date().toISOString(),
            });

            // Create notification for SDR if exists
            if (lead.sdr_responsavel_id) {
              await supabase.from("notificacoes").insert({
                usuario_id: lead.sdr_responsavel_id,
                tipo: "no_show_lead" as const,
                titulo: "Lead marcado como No-show",
                mensagem: `O lead "${lead.nome}" não compareceu à reunião agendada. Considere entrar em contato para reagendar.`,
                link: `/comercial/pipeline-sdr`,
                dados: {
                  lead_id: leadId,
                  lead_nome: lead.nome,
                  closer_nome: profile?.nome,
                },
              });
            }

            toast.success("Lead marcado como No-show");
            // Invalidate SDR queries so they see this lead
            queryClient.invalidateQueries({ queryKey: ["leads-sdr"] });
          },
          onError: () => {
            toast.error("Erro ao mover lead");
          },
        }
      );
      return;
    }

    if (targetEtapa === "fechado_ganho") {
      setPendingDrop({ leadId, etapa: targetEtapa });
      setFechadoModal({
        open: true,
        leadId,
        leadNome: lead.nome,
        valorProposta: lead.valor_proposta || undefined,
      });
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
  };

  const handleConfirmReuniao = async (data: { observacoes?: string }) => {
    if (!pendingDrop) return;

    const { error } = await supabase
      .from("leads")
      .update({ etapa_closer: "reuniao_realizada" })
      .eq("id", pendingDrop.leadId);

    if (error) {
      toast.error("Erro ao atualizar lead");
      return;
    }

    // Create activity
    await supabase.from("atividades_lead").insert({
      lead_id: pendingDrop.leadId,
      tipo: "reuniao",
      descricao: data.observacoes || "Reunião realizada",
      realizado_por_id: profile?.id,
    });

    toast.success("Reunião registrada");
    queryClient.invalidateQueries({ queryKey: ["leads-closer"] });
    setReuniaoModal({ open: false, leadId: "", leadNome: "" });
    setPendingDrop(null);
  };

  const handleConfirmProposta = async (data: {
    valor_proposta: number;
    observacoes?: string;
  }) => {
    if (!pendingDrop) return;

    const { error } = await supabase
      .from("leads")
      .update({
        etapa_closer: "proposta_enviada",
        valor_proposta: data.valor_proposta,
      })
      .eq("id", pendingDrop.leadId);

    if (error) {
      toast.error("Erro ao enviar proposta");
      return;
    }

    // Create activity
    await supabase.from("atividades_lead").insert({
      lead_id: pendingDrop.leadId,
      tipo: "anotacao",
      descricao: `Proposta enviada: R$ ${data.valor_proposta.toLocaleString("pt-BR")}/mês${data.observacoes ? `. ${data.observacoes}` : ""}`,
      realizado_por_id: profile?.id,
    });

    // Create follow-up for 2 days
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 2);
    await supabase.from("follow_ups").insert({
      lead_id: pendingDrop.leadId,
      data_programada: followUpDate.toISOString(),
      descricao: "Follow-up proposta enviada",
      criado_por_id: profile?.id,
    });

    toast.success("Proposta registrada");
    queryClient.invalidateQueries({ queryKey: ["leads-closer"] });
    setPropostaModal({ open: false, leadId: "", leadNome: "" });
    setPendingDrop(null);
  };

  const handleConfirmPerda = async (data: {
    motivo_perda_id: string;
    observacoes?: string;
    mover_para_frios: boolean;
  }) => {
    if (!pendingDrop) return;

    const updateData: Record<string, any> = {
      etapa_closer: "perdido",
      motivo_perda_id: data.motivo_perda_id,
      data_perda: new Date().toISOString(),
      observacoes: data.observacoes || undefined,
    };

    if (data.mover_para_frios) {
      updateData.funil_atual = "frios";
      updateData.etapa_frios = "esfriar";
    }

    const { error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", pendingDrop.leadId);

    if (error) {
      toast.error("Erro ao marcar lead como perdido");
      return;
    }

    toast.success(
      data.mover_para_frios
        ? "Lead movido para Leads Frios"
        : "Lead marcado como perdido"
    );
    queryClient.invalidateQueries({ queryKey: ["leads-closer"] });
    setPerdaModal({ open: false, leadId: "", leadNome: "" });
    setPendingDrop(null);
  };

  const handleConfirmFechado = async () => {
    if (!pendingDrop) return;
    
    // Find the lead data to pass to activation modal
    const lead = leads?.find(l => l.id === pendingDrop.leadId);
    if (!lead) {
      toast.error("Lead não encontrado");
      return;
    }

    // Close the celebration modal and open activation modal
    setFechadoModal({ open: false, leadId: "", leadNome: "" });
    setAtivacaoModal({ open: true, lead });
  };

  const handleConfirmAtivacao = async (data: ClienteData) => {
    if (!ativacaoModal.lead) return;
    const lead = ativacaoModal.lead;

    try {
      // 1. Create client in clientes table
      const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .insert({
          lead_id: lead.id,
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia,
          cnpj: data.cnpj,
          cpf: data.cpf,
          telefone: data.telefone,
          email: data.email,
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep,
          fee_mensal: data.fee_mensal,
          modelo_cobranca: data.modelo_cobranca,
          percentual: data.percentual,
          dia_vencimento: data.dia_vencimento,
          forma_pagamento: data.forma_pagamento,
          sdr_responsavel_id: lead.sdr_responsavel_id,
          closer_responsavel_id: lead.closer_responsavel_id,
          status: "ativo",
        })
        .select()
        .single();

      if (clienteError) throw clienteError;

      // 2. Create cliente_servicos for each service
      if (data.servicos.length > 0) {
        const servicosInsert = data.servicos.map((s) => ({
          cliente_id: cliente.id,
          servico_id: s.servico_id,
          responsavel_id: s.responsavel_id,
          valor: s.valor,
          status: "ativo",
        }));

        const { error: servicosError } = await supabase
          .from("cliente_servicos")
          .insert(servicosInsert);

        if (servicosError) {
          console.error("Error inserting services:", servicosError);
          // Don't throw - client was created, just log the error
        }
      }

      // 3. Update lead to converted status
      const { error: leadError } = await supabase
        .from("leads")
        .update({
          etapa_closer: "fechado_ganho",
          funil_atual: "convertido",
          data_conversao: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      // 4. Create timeline entry
      await supabase.from("cliente_timeline").insert({
        cliente_id: cliente.id,
        tipo: "criado",
        descricao: `Cliente ativado a partir do lead "${lead.nome}"`,
        realizado_por_id: profile?.id,
      });

      // 5. Create activity on lead
      await supabase.from("atividades_lead").insert({
        lead_id: lead.id,
        tipo: "anotacao",
        descricao: `🎉 Negócio fechado! Cliente ativado com fee de R$ ${data.fee_mensal.toLocaleString("pt-BR")}/mês`,
        realizado_por_id: profile?.id,
      });

      toast.success("🎉 Cliente ativado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["leads-closer"] });
      setAtivacaoModal({ open: false, lead: null });
      setPendingDrop(null);
    } catch (error) {
      console.error("Error activating client:", error);
      toast.error("Erro ao ativar cliente");
    }
  };

  const handleCancelAtivacao = () => {
    setAtivacaoModal({ open: false, lead: null });
    setPendingDrop(null);
  };

  const handleCancelModal = () => {
    setPendingDrop(null);
  };

  const openLeadDrawer = (lead: LeadCloser) => {
    setDrawerLead(lead);
    setDrawerOpen(true);
  };

  const openReagendarModal = (lead: LeadCloser) => {
    setReagendarModal({
      open: true,
      leadId: lead.id,
      leadNome: lead.nome,
    });
  };

  const handleConfirmReagendar = async (data: {
    data: Date;
    horario: string;
    observacoes?: string;
  }) => {
    const [hours, minutes] = data.horario.split(":").map(Number);
    const dataAgendamento = new Date(data.data);
    dataAgendamento.setHours(hours, minutes, 0, 0);

    const { error } = await supabase
      .from("leads")
      .update({
        etapa_closer: "reuniao_agendada",
        data_agendamento: dataAgendamento.toISOString(),
      })
      .eq("id", reagendarModal.leadId);

    if (error) {
      toast.error("Erro ao reagendar reunião");
      return;
    }

    // Create activity
    await supabase.from("atividades_lead").insert({
      lead_id: reagendarModal.leadId,
      tipo: "reuniao",
      descricao: `Reunião reagendada para ${format(dataAgendamento, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}${data.observacoes ? `. ${data.observacoes}` : ""}`,
      realizado_por_id: profile?.id,
    });

    toast.success("Reunião reagendada com sucesso!");
    queryClient.invalidateQueries({ queryKey: ["leads-closer"] });
    setReagendarModal({ open: false, leadId: "", leadNome: "" });
  };

  const clearFilters = () => {
    setBusca("");
    setSdrId("");
    setDateRange(undefined);
    setValorRange([0, 50000]);
    setPropostaPendente(false);
  };

  const hasFilters =
    busca ||
    sdrId ||
    dateRange ||
    valorRange[0] > 0 ||
    valorRange[1] < 50000 ||
    propostaPendente;

  // Check if lead has no response for 48h
  const is48hPending = (lead: LeadCloser) => {
    if (lead.etapa_closer !== "proposta_enviada" || !lead.updated_at) return false;
    const hours = differenceInHours(new Date(), new Date(lead.updated_at));
    return hours >= 48;
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">Pipeline Closer</h1>
            <p className="text-muted-foreground mt-1">
              {totalLeads} leads em negociação
            </p>
          </div>
        </div>

        {/* Agenda Rápida */}
        <div className="mb-4">
          <AgendaRapida meetings={todayMeetings || []} isLoading={loadingMeetings} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-card/50 rounded-lg border border-border/20">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, empresa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* SDR Select */}
          <Select value={sdrId} onValueChange={setSdrId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="SDR de origem" />
            </SelectTrigger>
            <SelectContent>
              {sdrs?.map((sdr) => (
                <SelectItem key={sdr.id} value={sdr.id}>
                  {sdr.nome}
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
                  "Período agendamento"
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

          {/* Valor Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  (valorRange[0] === 0 && valorRange[1] === 50000) &&
                    "text-muted-foreground"
                )}
              >
                {valorRange[0] === 0 && valorRange[1] === 50000
                  ? "Valor proposta"
                  : `R$ ${valorRange[0].toLocaleString()} - ${valorRange[1].toLocaleString()}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <p className="text-sm font-medium">Valor da proposta</p>
                <Slider
                  min={0}
                  max={50000}
                  step={500}
                  value={valorRange}
                  onValueChange={(v) => setValorRange(v as [number, number])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>R$ {valorRange[0].toLocaleString()}</span>
                  <span>R$ {valorRange[1].toLocaleString()}</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Pending Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="pendente-48h"
              checked={propostaPendente}
              onCheckedChange={setPropostaPendente}
            />
            <Label htmlFor="pendente-48h" className="text-sm cursor-pointer">
              Propostas pendentes &gt; 48h
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
                {ETAPAS_CLOSER.map((etapa) => {
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
                        <LeadCardCloser
                          key={lead.id}
                          id={lead.id}
                          nome={lead.nome}
                          empresa={lead.empresa || undefined}
                          sdrNome={lead.sdr_nome}
                          dataAgendamento={
                            lead.data_agendamento
                              ? new Date(lead.data_agendamento)
                              : undefined
                          }
                          valorProposta={lead.valor_proposta || undefined}
                          etapaDesde={
                            lead.updated_at
                              ? new Date(lead.updated_at)
                              : undefined
                          }
                          semResposta48h={is48hPending(lead)}
                          etapaAtual={etapa}
                          onClick={() => openLeadDrawer(lead)}
                          onReagendar={() => openReagendarModal(lead)}
                        />
                      ))}
                    </KanbanColumn>
                  );
                })}
              </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeLead && (
                <div className="opacity-90 rotate-3 scale-105">
                  <LeadCardCloser
                    id={activeLead.id}
                    nome={activeLead.nome}
                    empresa={activeLead.empresa || undefined}
                    sdrNome={activeLead.sdr_nome}
                    dataAgendamento={
                      activeLead.data_agendamento
                        ? new Date(activeLead.data_agendamento)
                        : undefined
                    }
                    valorProposta={activeLead.valor_proposta || undefined}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* Modals */}
        <ModalReuniaoRealizada
          open={reuniaoModal.open}
          onOpenChange={(open) => setReuniaoModal((prev) => ({ ...prev, open }))}
          onConfirm={handleConfirmReuniao}
          onCancel={handleCancelModal}
          leadNome={reuniaoModal.leadNome}
        />

        <ModalProposta
          open={propostaModal.open}
          onOpenChange={(open) => setPropostaModal((prev) => ({ ...prev, open }))}
          onConfirm={handleConfirmProposta}
          onCancel={handleCancelModal}
          leadNome={propostaModal.leadNome}
        />

        <ModalPerdaCloser
          open={perdaModal.open}
          onOpenChange={(open) => setPerdaModal((prev) => ({ ...prev, open }))}
          onConfirm={handleConfirmPerda}
          onCancel={handleCancelModal}
          leadNome={perdaModal.leadNome}
          motivosPerda={motivosPerda || []}
        />

        <ModalFechadoGanho
          open={fechadoModal.open}
          onOpenChange={(open) => setFechadoModal((prev) => ({ ...prev, open }))}
          onConfirm={handleConfirmFechado}
          onCancel={handleCancelModal}
          leadNome={fechadoModal.leadNome}
          valorProposta={fechadoModal.valorProposta}
        />

        {ativacaoModal.lead && (
          <ModalAtivacaoCliente
            open={ativacaoModal.open}
            onOpenChange={(open) => {
              if (!open) handleCancelAtivacao();
            }}
            onConfirm={handleConfirmAtivacao}
            onCancel={handleCancelAtivacao}
            leadId={ativacaoModal.lead.id}
            leadNome={ativacaoModal.lead.nome}
            leadTelefone={ativacaoModal.lead.telefone}
            leadEmail={ativacaoModal.lead.email || undefined}
            valorProposta={ativacaoModal.lead.valor_proposta || undefined}
            sdrId={ativacaoModal.lead.sdr_responsavel_id || undefined}
            closerId={ativacaoModal.lead.closer_responsavel_id || undefined}
          />
        )}

        <LeadDrawerCloser
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
                  etapa: ETAPA_CONFIG[drawerLead.etapa_closer || "reuniao_agendada"]?.label,
                  servicoInteresse: drawerLead.servico_nome,
                  observacoes: drawerLead.observacoes || undefined,
                  sdrResponsavel: drawerLead.sdr_nome,
                  dataAgendamento: drawerLead.data_agendamento
                    ? new Date(drawerLead.data_agendamento)
                    : undefined,
                  valorProposta: drawerLead.valor_proposta || undefined,
                  createdAt: new Date(drawerLead.created_at || Date.now()),
                }
              : null
          }
          onReagendar={drawerLead ? () => openReagendarModal(drawerLead) : undefined}
        />

        <ModalReagendarReuniao
          open={reagendarModal.open}
          onOpenChange={(open) => setReagendarModal((prev) => ({ ...prev, open }))}
          onConfirm={handleConfirmReagendar}
          onCancel={() => setReagendarModal({ open: false, leadId: "", leadNome: "" })}
          leadNome={reagendarModal.leadNome}
        />
      </div>
    </AppLayout>
  );
}
