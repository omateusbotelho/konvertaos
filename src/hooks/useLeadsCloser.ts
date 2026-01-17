import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Database } from "@/integrations/supabase/types";

type EtapaCloser = Database["public"]["Enums"]["etapa_closer"];

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

  return useQuery({
    queryKey: ["leads-closer", filters],
    queryFn: async (): Promise<LeadCloser[]> => {
      let query = supabase
        .from("leads")
        .select(`
          *,
          origens_lead:origem_id(nome),
          servicos:servico_interesse_id(nome),
          sdr:sdr_responsavel_id(nome)
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

      // Get follow-ups and last activity using optimized RPC
      const leadIds = data?.map((l) => l.id) || [];
      let followUps: Record<string, { data: Date; descricao?: string }> = {};
      let ultimasAtividades: Record<string, Date> = {};

      if (leadIds.length > 0) {
        const { data: aggregatedData } = await supabase.rpc(
          "get_leads_followups_and_activities",
          { p_lead_ids: leadIds }
        );

        if (aggregatedData) {
          aggregatedData.forEach((item: any) => {
            if (item.proximo_followup_data) {
              followUps[item.lead_id] = {
                data: new Date(item.proximo_followup_data),
                descricao: item.proximo_followup_descricao || undefined,
              };
            }
            if (item.ultima_atividade_data) {
              ultimasAtividades[item.lead_id] = new Date(item.ultima_atividade_data);
            }
          });
        }
      }

      let result = (data || []).map((lead) => ({
        ...lead,
        origem_nome: (lead.origens_lead as any)?.nome,
        servico_nome: (lead.servicos as any)?.nome,
        sdr_nome: (lead.sdr as any)?.nome,
        follow_up: followUps[lead.id],
        ultima_atividade: ultimasAtividades[lead.id],
      }));

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

export function useUpdateLeadEtapaCloser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      etapa,
    }: {
      leadId: string;
      etapa: EtapaCloser;
    }) => {
      const updateData: Record<string, any> = { etapa_closer: etapa };

      // When moving to closer funnel, also set funil_atual
      if (etapa === "reuniao_agendada") {
        updateData.funil_atual = "closer";
      }

      const { error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads-closer"] });
    },
  });
}

export function useLeadsCloserCount() {
  return useQuery({
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

export function useTodayMeetings() {
  return useQuery({
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
