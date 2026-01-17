import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Database } from "@/integrations/supabase/types";
import type { 
  EmbeddedOrigem, 
  EmbeddedMotivoPerda,
  SupabaseError,
  LeadUpdate
} from "@/types/supabase-helpers";

type EtapaFrios = Database["public"]["Enums"]["etapa_frios"];
type EtapaSDR = Database["public"]["Enums"]["etapa_sdr"];
type EtapaCloser = Database["public"]["Enums"]["etapa_closer"];
type FunilTipo = Database["public"]["Enums"]["funil_tipo"];

export interface LeadFrio {
  id: string;
  nome: string;
  empresa: string | null;
  telefone: string;
  email: string | null;
  origem_id: string | null;
  origem_nome?: string;
  etapa_frios: EtapaFrios | null;
  funil_atual: string | null;
  funil_anterior?: string | null;
  motivo_perda_id: string | null;
  motivo_perda_nome?: string;
  data_perda: string | null;
  created_at: string | null;
  updated_at: string | null;
  observacoes: string | null;
  sdr_responsavel_id: string | null;
  closer_responsavel_id: string | null;
  tentativas_reativacao?: number;
  proximo_followup?: Date;
}

interface UseLeadsFriosFilters {
  busca?: string;
}

// Raw lead data from Supabase query with embedded relations
interface LeadFrioQueryResult {
  id: string;
  nome: string;
  empresa: string | null;
  telefone: string;
  email: string | null;
  origem_id: string | null;
  etapa_frios: EtapaFrios | null;
  funil_atual: string | null;
  motivo_perda_id: string | null;
  data_perda: string | null;
  created_at: string | null;
  updated_at: string | null;
  observacoes: string | null;
  sdr_responsavel_id: string | null;
  closer_responsavel_id: string | null;
  origens_lead: EmbeddedOrigem | null;
  motivos_perda: EmbeddedMotivoPerda | null;
}

const ETAPAS_FRIOS: EtapaFrios[] = [
  "esfriar",
  "reativacao",
  "reativado",
  "descartado",
];

export function useLeadsFrios(filters?: UseLeadsFriosFilters) {
  const { user } = useAuth();

  return useQuery<LeadFrio[], SupabaseError>({
    queryKey: ["leads-frios", filters],
    queryFn: async (): Promise<LeadFrio[]> => {
      let query = supabase
        .from("leads")
        .select(`
          *,
          origens_lead:origem_id(nome),
          motivos_perda:motivo_perda_id(nome)
        `)
        .eq("funil_atual", "frios");

      if (filters?.busca) {
        query = query.or(
          `nome.ilike.%${filters.busca}%,empresa.ilike.%${filters.busca}%`
        );
      }

      query = query.order("updated_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Get follow-ups for each lead to calculate next attempt
      const leadIds = data?.map((l) => l.id) || [];
      let proximosFollowups: Record<string, Date> = {};
      let tentativasCount: Record<string, number> = {};

      if (leadIds.length > 0) {
        // Get pending follow-ups
        const { data: followUpData } = await supabase
          .from("follow_ups")
          .select("*")
          .in("lead_id", leadIds)
          .eq("concluido", false)
          .order("data_programada", { ascending: true });

        if (followUpData) {
          followUpData.forEach((fu) => {
            if (!proximosFollowups[fu.lead_id]) {
              proximosFollowups[fu.lead_id] = new Date(fu.data_programada);
            }
          });
        }

        // Count reactivation attempts (concluded follow-ups)
        const { data: tentativasData } = await supabase
          .from("follow_ups")
          .select("lead_id")
          .in("lead_id", leadIds)
          .eq("concluido", true);

        if (tentativasData) {
          tentativasData.forEach((t) => {
            tentativasCount[t.lead_id] = (tentativasCount[t.lead_id] || 0) + 1;
          });
        }
      }

      return ((data || []) as LeadFrioQueryResult[]).map((lead) => ({
        id: lead.id,
        nome: lead.nome,
        empresa: lead.empresa,
        telefone: lead.telefone,
        email: lead.email,
        origem_id: lead.origem_id,
        etapa_frios: lead.etapa_frios,
        funil_atual: lead.funil_atual,
        motivo_perda_id: lead.motivo_perda_id,
        data_perda: lead.data_perda,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        observacoes: lead.observacoes,
        sdr_responsavel_id: lead.sdr_responsavel_id,
        closer_responsavel_id: lead.closer_responsavel_id,
        origem_nome: lead.origens_lead?.nome,
        motivo_perda_nome: lead.motivos_perda?.nome,
        proximo_followup: proximosFollowups[lead.id],
        tentativas_reativacao: tentativasCount[lead.id] || 0,
      }));
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}

interface UpdateLeadEtapaFriosInput {
  leadId: string;
  etapa: EtapaFrios;
}

export function useUpdateLeadEtapaFrios() {
  const queryClient = useQueryClient();

  return useMutation<void, SupabaseError, UpdateLeadEtapaFriosInput>({
    mutationFn: async ({ leadId, etapa }) => {
      const { error } = await supabase
        .from("leads")
        .update({ etapa_frios: etapa })
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads-frios"] });
    },
  });
}

export function useLeadsFriosCount() {
  return useQuery<number, SupabaseError>({
    queryKey: ["leads-frios-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("funil_atual", "frios")
        .not("etapa_frios", "eq", "descartado");

      if (error) throw error;
      return count || 0;
    },
  });
}

interface ReativarLeadInput {
  leadId: string;
  destinoFunil: "sdr" | "closer";
  destinoEtapa: string;
}

export function useReativarLead() {
  const queryClient = useQueryClient();

  return useMutation<void, SupabaseError, ReativarLeadInput>({
    mutationFn: async ({ leadId, destinoFunil, destinoEtapa }) => {
      const updateData: LeadUpdate = {
        funil_atual: destinoFunil as FunilTipo,
        etapa_frios: null,
        motivo_perda_id: null,
        data_perda: null,
      };

      if (destinoFunil === "sdr") {
        updateData.etapa_sdr = destinoEtapa as EtapaSDR;
        updateData.etapa_closer = null;
      } else {
        updateData.etapa_closer = destinoEtapa as EtapaCloser;
        updateData.etapa_sdr = null;
      }

      const { error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads-frios"] });
      queryClient.invalidateQueries({ queryKey: ["leads-sdr"] });
      queryClient.invalidateQueries({ queryKey: ["leads-closer"] });
    },
  });
}

export { ETAPAS_FRIOS };
export type { EtapaFrios };
