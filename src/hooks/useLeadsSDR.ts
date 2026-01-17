import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Database } from "@/integrations/supabase/types";

type EtapaSDR = Database["public"]["Enums"]["etapa_sdr"];

export interface LeadSDR {
  id: string;
  nome: string;
  empresa: string | null;
  telefone: string;
  email: string | null;
  origem_id: string | null;
  origem_nome?: string;
  servico_interesse_id: string | null;
  servico_nome?: string;
  etapa_sdr: EtapaSDR | null;
  funil_atual: string | null;
  created_at: string | null;
  updated_at: string | null;
  observacoes: string | null;
  sdr_responsavel_id: string | null;
  follow_up?: {
    data: Date;
    descricao?: string;
  };
  ultima_atividade?: Date;
}

interface UseLeadsSDRFilters {
  busca?: string;
  origemId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  comFollowUpPendente?: boolean;
}

const ETAPAS_SDR: EtapaSDR[] = [
  "novo",
  "tentativa_contato",
  "contato_realizado",
  "qualificado",
  "reuniao_agendada",
  "perdido",
];

export function useLeadsSDR(filters?: UseLeadsSDRFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["leads-sdr", filters],
    queryFn: async (): Promise<LeadSDR[]> => {
      let query = supabase
        .from("leads")
        .select(`
          *,
          origens_lead:origem_id(nome),
          servicos:servico_interesse_id(nome)
        `)
        .eq("funil_atual", "sdr");

      // Apply filters
      if (filters?.busca) {
        query = query.or(
          `nome.ilike.%${filters.busca}%,empresa.ilike.%${filters.busca}%,telefone.ilike.%${filters.busca}%`
        );
      }

      if (filters?.origemId) {
        query = query.eq("origem_id", filters.origemId);
      }

      if (filters?.dataInicio) {
        query = query.gte("created_at", filters.dataInicio.toISOString());
      }

      if (filters?.dataFim) {
        query = query.lte("created_at", filters.dataFim.toISOString());
      }

      query = query.order("created_at", { ascending: false });

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
        follow_up: followUps[lead.id],
        ultima_atividade: ultimasAtividades[lead.id],
      }));

      if (filters?.comFollowUpPendente) {
        result = result.filter((lead) => lead.follow_up);
      }

      return result;
    },
    enabled: !!user,
  });
}

export function useOrigensLead() {
  return useQuery({
    queryKey: ["origens-lead"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("origens_lead")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateLeadEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      etapa,
    }: {
      leadId: string;
      etapa: EtapaSDR;
    }) => {
      const { error } = await supabase
        .from("leads")
        .update({ etapa_sdr: etapa })
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads-sdr"] });
    },
  });
}

export function useLeadsCount() {
  return useQuery({
    queryKey: ["leads-sdr-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("funil_atual", "sdr")
        .neq("etapa_sdr", "perdido");

      if (error) throw error;
      return count || 0;
    },
  });
}

export { ETAPAS_SDR };
export type { EtapaSDR };
