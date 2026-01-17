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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { LeadCardFrio } from "@/components/comercial/LeadCardFrio";
import { ModalReativar } from "@/components/comercial/ModalReativar";
import { ModalDescartar } from "@/components/comercial/ModalDescartar";
import { LeadDrawer } from "@/components/comercial/LeadDrawer";
import {
  useLeadsFrios,
  useUpdateLeadEtapaFrios,
  useLeadsFriosCount,
  useReativarLead,
  ETAPAS_FRIOS,
  type EtapaFrios,
  type LeadFrio,
} from "@/hooks/useLeadsFrios";
import { Search, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

const ETAPA_CONFIG: Record<
  EtapaFrios,
  { label: string; color: string; collapsible?: boolean }
> = {
  esfriar: { label: "Esfriar", color: "#64748B" },
  reativacao: { label: "Reativação", color: "#F59E0B" },
  reativado: { label: "Reativado", color: "#10B981" },
  descartado: { label: "Descartado", color: "#EF4444", collapsible: true },
};

export default function LeadsFrios() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");

  // Modal states
  const [reativarModal, setReativarModal] = useState<{
    open: boolean;
    leadId: string;
    leadNome: string;
  }>({ open: false, leadId: "", leadNome: "" });
  const [descartarModal, setDescartarModal] = useState<{
    open: boolean;
    leadId: string;
    leadNome: string;
  }>({ open: false, leadId: "", leadNome: "" });
  const [drawerLead, setDrawerLead] = useState<LeadFrio | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingDrop, setPendingDrop] = useState<{
    leadId: string;
    etapa: EtapaFrios;
  } | null>(null);

  const filters = useMemo(
    () => ({
      busca: busca || undefined,
    }),
    [busca]
  );

  const { data: leads, isLoading } = useLeadsFrios(filters);
  const { data: totalLeads } = useLeadsFriosCount();
  const updateEtapa = useUpdateLeadEtapaFrios();
  const reativarLead = useReativarLead();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const leadsByEtapa = useMemo(() => {
    const grouped: Record<EtapaFrios, LeadFrio[]> = {
      esfriar: [],
      reativacao: [],
      reativado: [],
      descartado: [],
    };

    leads?.forEach((lead) => {
      const etapa = lead.etapa_frios || "esfriar";
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
    const targetEtapa = over.id as EtapaFrios;
    const lead = leads?.find((l) => l.id === leadId);

    if (!lead || lead.etapa_frios === targetEtapa) return;

    // Special handling for "reativado" stage
    if (targetEtapa === "reativado") {
      setPendingDrop({ leadId, etapa: targetEtapa });
      setReativarModal({ open: true, leadId, leadNome: lead.nome });
      return;
    }

    // Special handling for "descartado" stage
    if (targetEtapa === "descartado") {
      setPendingDrop({ leadId, etapa: targetEtapa });
      setDescartarModal({ open: true, leadId, leadNome: lead.nome });
      return;
    }

    // Moving to "reativacao" - increment attempt and create follow-up
    if (targetEtapa === "reativacao") {
      handleMoveToReativacao(leadId);
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

  const handleMoveToReativacao = async (leadId: string) => {
    const { error } = await supabase
      .from("leads")
      .update({ etapa_frios: "reativacao" })
      .eq("id", leadId);

    if (error) {
      toast.error("Erro ao mover lead");
      return;
    }

    // Create follow-up for 15 days
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 15);
    await supabase.from("follow_ups").insert({
      lead_id: leadId,
      data_programada: followUpDate.toISOString(),
      descricao: "Tentativa de reativação",
      criado_por_id: profile?.id,
    });

    toast.success("Lead movido para Reativação");
    queryClient.invalidateQueries({ queryKey: ["leads-frios"] });
  };

  const handleConfirmReativar = async (data: {
    destinoFunil: "sdr" | "closer";
    destinoEtapa: string;
  }) => {
    if (!pendingDrop) return;

    await reativarLead.mutateAsync({
      leadId: pendingDrop.leadId,
      destinoFunil: data.destinoFunil,
      destinoEtapa: data.destinoEtapa,
    });

    // Create activity
    await supabase.from("atividades_lead").insert({
      lead_id: pendingDrop.leadId,
      tipo: "anotacao",
      descricao: `Lead reativado e enviado para ${data.destinoFunil === "sdr" ? "Pipeline SDR" : "Pipeline Closer"}`,
      realizado_por_id: profile?.id,
    });

    toast.success("Lead reativado com sucesso!");
    setReativarModal({ open: false, leadId: "", leadNome: "" });
    setPendingDrop(null);
  };

  const handleConfirmDescartar = async (data: { motivo?: string }) => {
    if (!pendingDrop) return;

    const { error } = await supabase
      .from("leads")
      .update({
        etapa_frios: "descartado",
        observacoes: data.motivo
          ? `[DESCARTADO] ${data.motivo}`
          : undefined,
      })
      .eq("id", pendingDrop.leadId);

    if (error) {
      toast.error("Erro ao descartar lead");
      return;
    }

    toast.success("Lead descartado");
    queryClient.invalidateQueries({ queryKey: ["leads-frios"] });
    setDescartarModal({ open: false, leadId: "", leadNome: "" });
    setPendingDrop(null);
  };

  const handleCancelModal = () => {
    setPendingDrop(null);
  };

  const openLeadDrawer = (lead: LeadFrio) => {
    setDrawerLead(lead);
    setDrawerOpen(true);
  };

  const clearFilters = () => {
    setBusca("");
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">Leads Frios</h1>
            <p className="text-muted-foreground mt-1">
              {totalLeads} leads para reaquecimento
            </p>
          </div>
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

          {/* Clear filters */}
          {busca && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Limpar
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
              <div className="flex gap-4 min-w-max h-full">
                {ETAPAS_FRIOS.map((etapa) => {
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
                        <LeadCardFrio
                          key={lead.id}
                          id={lead.id}
                          nome={lead.nome}
                          empresa={lead.empresa || undefined}
                          funilAnterior={lead.funil_anterior || "sdr"}
                          motivoPerda={lead.motivo_perda_nome}
                          proximaTentativa={lead.proximo_followup}
                          tentativas={lead.tentativas_reativacao}
                          maxTentativas={3}
                          onClick={() => openLeadDrawer(lead)}
                          onReativar={() =>
                            setReativarModal({
                              open: true,
                              leadId: lead.id,
                              leadNome: lead.nome,
                            })
                          }
                        />
                      ))}
                    </KanbanColumn>
                  );
                })}
              </div>
            </div>

            <DragOverlay>
              {activeLead && (
                <LeadCardFrio
                  id={activeLead.id}
                  nome={activeLead.nome}
                  empresa={activeLead.empresa || undefined}
                  funilAnterior={activeLead.funil_anterior || "sdr"}
                  motivoPerda={activeLead.motivo_perda_nome}
                  proximaTentativa={activeLead.proximo_followup}
                  tentativas={activeLead.tentativas_reativacao}
                  maxTentativas={3}
                />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Modals */}
      <ModalReativar
        open={reativarModal.open}
        onOpenChange={(open) => setReativarModal((prev) => ({ ...prev, open }))}
        onConfirm={handleConfirmReativar}
        onCancel={handleCancelModal}
        leadNome={reativarModal.leadNome}
      />

      <ModalDescartar
        open={descartarModal.open}
        onOpenChange={(open) => setDescartarModal((prev) => ({ ...prev, open }))}
        onConfirm={handleConfirmDescartar}
        onCancel={handleCancelModal}
        leadNome={descartarModal.leadNome}
      />

      {/* Lead Drawer */}
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
                etapa: drawerLead.etapa_frios || undefined,
                observacoes: drawerLead.observacoes || undefined,
                createdAt: new Date(drawerLead.created_at || Date.now()),
              }
            : null
        }
        atividades={[]}
        followUps={[]}
        historico={[]}
      />
    </AppLayout>
  );
}
