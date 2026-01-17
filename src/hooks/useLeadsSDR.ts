import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Database } from "@/integrations/supabase/types";
import type { 
  EmbeddedFollowUp, 
  EmbeddedAtividade, 
  EmbeddedOrigem, 
  EmbeddedServico,
  SupabaseError 
} from "@/types/supabase-helpers";

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

// Raw lead data from Supabase query with embedded relations
interface LeadSDRQueryResult {
  id: string;
  nome: string;
  empresa: string | null;
  telefone: string;
  email: string | null;
  origem_id: string | null;
  servico_interesse_id: string | null;
  etapa_sdr: EtapaSDR | null;
  funil_atual: string | null;
  created_at: string | null;
  updated_at: string | null;
  observacoes: string | null;
  sdr_responsavel_id: string | null;
  origens_lead: EmbeddedOrigem | null;
  servicos: EmbeddedServico | null;
  follow_ups: EmbeddedFollowUp[];
  atividades_lead: EmbeddedAtividade[];
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

  return useQuery<LeadSDR[], SupabaseError>({
    queryKey: ["leads-sdr", filters],
    queryFn: async (): Promise<LeadSDR[]> => {
      // Single query with resource embedding for all related data
      let query = supabase
        .from("leads")
        .select(`
          *,
          origens_lead:origem_id(nome),
          servicos:servico_interesse_id(nome),
          follow_ups!follow_ups_lead_id_fkey(
            data_programada,
            descricao,
            concluido
          ),
          atividades_lead!atividades_lead_lead_id_fkey(
            data_atividade
          )
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

      // Process embedded data to extract follow-ups and last activity
      let result = ((data || []) as LeadSDRQueryResult[]).map((lead) => {
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
          etapa_sdr: lead.etapa_sdr,
          funil_atual: lead.funil_atual,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
          observacoes: lead.observacoes,
          sdr_responsavel_id: lead.sdr_responsavel_id,
          origem_nome: lead.origens_lead?.nome,
          servico_nome: lead.servicos?.nome,
          follow_up: nextFollowUp ? {
            data: new Date(nextFollowUp.data_programada),
            descricao: nextFollowUp.descricao || undefined,
          } : undefined,
          ultima_atividade: ultimaAtividade,
        };
      });

      if (filters?.comFollowUpPendente) {
        result = result.filter((lead) => lead.follow_up);
      }

      return result;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
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

interface UpdateLeadEtapaInput {
  leadId: string;
  etapa: EtapaSDR;
}

export function useUpdateLeadEtapa() {
  const queryClient = useQueryClient();

  return useMutation<void, SupabaseError, UpdateLeadEtapaInput>({
    mutationFn: async ({ leadId, etapa }) => {
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
  return useQuery<number, SupabaseError>({
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
