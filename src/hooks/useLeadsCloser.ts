import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import type { 
  EmbeddedFollowUp, 
  EmbeddedAtividade, 
  EmbeddedOrigem, 
  EmbeddedServico,
  EmbeddedProfile,
  SupabaseError,
  LeadUpdate
} from "@/types/supabase-helpers";

type EtapaCloser = Database["public"]["Enums"]["etapa_closer"];
type FunilTipo = Database["public"]["Enums"]["funil_tipo"];

export interface LeadCloser {
  id: string;
  nome: string;
  empresa: string | null;
  telefone: string;
  email: string | null;
  origem_id: string | null;
  origem_nome?: string;
  servico_interesse_id: string | null;
  servico_nome?: string;
  etapa_closer: EtapaCloser | null;
  funil_atual: string | null;
  created_at: string | null;
  updated_at: string | null;
  observacoes: string | null;
  closer_responsavel_id: string | null;
  sdr_responsavel_id: string | null;
  sdr_nome?: string;
  data_agendamento: string | null;
  valor_proposta: number | null;
  follow_up?: {
    data: Date;
    descricao?: string;
  };
  ultima_atividade?: Date;
}

interface UseLeadsCloserFilters {
  busca?: string;
  sdrId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  valorMin?: number;
  valorMax?: number;
  propostaPendente48h?: boolean;
}

// Raw lead data from Supabase query with embedded relations
interface LeadCloserQueryResult {
  id: string;
  nome: string;
  empresa: string | null;
  telefone: string;
  email: string | null;
  origem_id: string | null;
  servico_interesse_id: string | null;
  etapa_closer: EtapaCloser | null;
  funil_atual: string | null;
  created_at: string | null;
  updated_at: string | null;
  observacoes: string | null;
  closer_responsavel_id: string | null;
  sdr_responsavel_id: string | null;
  data_agendamento: string | null;
  valor_proposta: number | null;
  origens_lead: EmbeddedOrigem | null;
  servicos: EmbeddedServico | null;
  sdr: Pick<EmbeddedProfile, 'nome'> | null;
  follow_ups: EmbeddedFollowUp[];
  atividades_lead: EmbeddedAtividade[];
}

const ETAPAS_CLOSER: EtapaCloser[] = [
  "reuniao_agendada",
  "reuniao_realizada",
  "proposta_enviada",
  "negociacao",
  "fechado_ganho",
  "perdido",
];

export function useLeadsCloser(filters?: UseLeadsCloserFilters) {
  const { user } = useAuth();

  return useQuery<LeadCloser[], SupabaseError>({
    queryKey: ["leads-closer", filters],
    queryFn: async (): Promise<LeadCloser[]> => {
      // Single query with resource embedding for all related data
      let query = supabase
        .from("leads")
        .select(`
          *,
          origens_lead:origem_id(nome),
          servicos:servico_interesse_id(nome),
          sdr:sdr_responsavel_id(nome),
          follow_ups!follow_ups_lead_id_fkey(
            data_programada,
            descricao,
            concluido
          ),
          atividades_lead!atividades_lead_lead_id_fkey(
            data_atividade
          )
        `)
        .eq("funil_atual", "closer");

      // Apply filters
      if (filters?.busca) {
        query = query.or(
          `nome.ilike.%${filters.busca}%,empresa.ilike.%${filters.busca}%`
        );
      }

      if (filters?.sdrId) {
        query = query.eq("sdr_responsavel_id", filters.sdrId);
      }

      if (filters?.dataInicio) {
        query = query.gte("data_agendamento", filters.dataInicio.toISOString());
      }

      if (filters?.dataFim) {
        query = query.lte("data_agendamento", filters.dataFim.toISOString());
      }

      if (filters?.valorMin) {
        query = query.gte("valor_proposta", filters.valorMin);
      }

      if (filters?.valorMax) {
        query = query.lte("valor_proposta", filters.valorMax);
      }

      query = query.order("data_agendamento", { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Process embedded data to extract follow-ups and last activity
      let result = ((data || []) as unknown as LeadCloserQueryResult[]).map((lead) => {
        // Get next pending follow-up (not completed, earliest date)
        const pendingFollowUps = (lead.follow_ups || [])
          .filter((fu) => !fu.concluido)
          .sort((a, b) => 
            new Date(a.data_programada).getTime() - new Date(b.data_programada).getTime()
          );
        
        const nextFollowUp = pendingFollowUps[0];
        
        // Get last activity date
        const atividades = (lead.atividades_lead || [])
          .map((a) => a.data_atividade ? new Date(a.data_atividade) : null)
          .filter((d): d is Date => d !== null)
          .sort((a, b) => b.getTime() - a.getTime());
        
        const ultimaAtividade = atividades[0];

        return {
          id: lead.id,
          nome: lead.nome,
          empresa: lead.empresa,
          telefone: lead.telefone,
          email: lead.email,
          origem_id: lead.origem_id,
          servico_interesse_id: lead.servico_interesse_id,
          etapa_closer: lead.etapa_closer,
          funil_atual: lead.funil_atual,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
          observacoes: lead.observacoes,
          closer_responsavel_id: lead.closer_responsavel_id,
          sdr_responsavel_id: lead.sdr_responsavel_id,
          data_agendamento: lead.data_agendamento,
          valor_proposta: lead.valor_proposta,
          origem_nome: lead.origens_lead?.nome,
          servico_nome: lead.servicos?.nome,
          sdr_nome: lead.sdr?.nome,
          follow_up: nextFollowUp ? {
            data: new Date(nextFollowUp.data_programada),
            descricao: nextFollowUp.descricao || undefined,
          } : undefined,
          ultima_atividade: ultimaAtividade,
        };
      });

      // Filter by proposta pendente > 48h
      if (filters?.propostaPendente48h) {
        const now = new Date();
        const h48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        result = result.filter(
          (lead) =>
            lead.etapa_closer === "proposta_enviada" &&
            lead.updated_at &&
            new Date(lead.updated_at) < h48Ago
        );
      }

      return result;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}

interface UpdateLeadEtapaCloserInput {
  leadId: string;
  etapa: EtapaCloser;
}

interface OptimisticContextCloser {
  previousLeads: LeadCloser[] | undefined;
}

export function useUpdateLeadEtapaCloser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, SupabaseError, UpdateLeadEtapaCloserInput, OptimisticContextCloser>({
    mutationFn: async ({ leadId, etapa }) => {
      const updateData: LeadUpdate = { etapa_closer: etapa };

      // When moving to closer funnel, also set funil_atual
      if (etapa === "reuniao_agendada") {
        updateData.funil_atual = "closer" as FunilTipo;
      }

      const { error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) throw error;
    },
    onMutate: async ({ leadId, etapa }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["leads-closer"] });

      // Snapshot the previous value
      const previousLeads = queryClient.getQueryData<LeadCloser[]>(["leads-closer"]);

      // Optimistically update to the new value
      queryClient.setQueriesData<LeadCloser[]>(
        { queryKey: ["leads-closer"] },
        (old) => {
          if (!old) return old;
          return old.map((lead) =>
            lead.id === leadId ? { ...lead, etapa_closer: etapa } : lead
          );
        }
      );

      // Return a context object with the snapshotted value
      return { previousLeads };
    },
    onError: (error, _variables, context) => {
      // Rollback to the previous value on error
      if (context?.previousLeads) {
        queryClient.setQueriesData<LeadCloser[]>(
          { queryKey: ["leads-closer"] },
          context.previousLeads
        );
      }

      toast({
        title: "Erro ao mover lead",
        description: error.message || "Não foi possível atualizar a etapa. Tente novamente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["leads-closer"] });
    },
  });
}

export function useLeadsCloserCount() {
  return useQuery<number, SupabaseError>({
    queryKey: ["leads-closer-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("funil_atual", "closer")
        .not("etapa_closer", "in", '("fechado_ganho","perdido")');

      if (error) throw error;
      return count || 0;
    },
  });
}

interface TodayMeeting {
  id: string;
  nome: string;
  empresa: string | null;
  data_agendamento: string | null;
}

export function useTodayMeetings() {
  return useQuery<TodayMeeting[], SupabaseError>({
    queryKey: ["today-meetings"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from("leads")
        .select("id, nome, empresa, data_agendamento")
        .eq("funil_atual", "closer")
        .eq("etapa_closer", "reuniao_agendada")
        .gte("data_agendamento", today.toISOString())
        .lt("data_agendamento", tomorrow.toISOString())
        .order("data_agendamento", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}

export { ETAPAS_CLOSER };
export type { EtapaCloser };
