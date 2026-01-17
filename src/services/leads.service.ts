/**
 * Leads Service
 * Centralized Supabase data access for leads (SDR, Closer, Frios)
 */

import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import type { SupabaseError } from "@/types/supabase-helpers";

// Types
type EtapaSDR = Database["public"]["Enums"]["etapa_sdr"];
type EtapaCloser = Database["public"]["Enums"]["etapa_closer"];
type EtapaFrios = Database["public"]["Enums"]["etapa_frios"];

export interface LeadBase {
  id: string;
  nome: string;
  empresa: string | null;
  telefone: string;
  email: string | null;
  origem_id: string | null;
  servico_interesse_id: string | null;
  funil_atual: string | null;
  created_at: string | null;
  updated_at: string | null;
  observacoes: string | null;
  origem_nome?: string;
  servico_nome?: string;
  follow_up?: {
    data: Date;
    descricao?: string;
  };
  ultima_atividade?: Date;
}

export interface LeadSDR extends LeadBase {
  etapa_sdr: EtapaSDR | null;
  sdr_responsavel_id: string | null;
}

export interface LeadCloser extends LeadBase {
  etapa_closer: EtapaCloser | null;
  closer_responsavel_id: string | null;
  data_agendamento: string | null;
  valor_proposta: number | null;
}

export interface LeadFrio extends LeadBase {
  etapa_frios: EtapaFrios | null;
  sdr_responsavel_id: string | null;
  closer_responsavel_id: string | null;
  data_perda: string | null;
  motivo_perda_id: string | null;
  motivo_perda_nome?: string;
}

export interface LeadsSDRFilters {
  busca?: string;
  origemId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  comFollowUpPendente?: boolean;
}

export interface LeadsCloserFilters {
  busca?: string;
  etapa?: EtapaCloser;
  dataInicio?: Date;
  dataFim?: Date;
}

export interface LeadsFriosFilters {
  busca?: string;
  etapa?: EtapaFrios;
}

// Raw query result types
interface LeadQueryResult {
  id: string;
  nome: string;
  empresa: string | null;
  telefone: string;
  email: string | null;
  origem_id: string | null;
  servico_interesse_id: string | null;
  funil_atual: string | null;
  created_at: string | null;
  updated_at: string | null;
  observacoes: string | null;
  etapa_sdr: EtapaSDR | null;
  etapa_closer: EtapaCloser | null;
  etapa_frios: EtapaFrios | null;
  sdr_responsavel_id: string | null;
  closer_responsavel_id: string | null;
  data_agendamento: string | null;
  valor_proposta: number | null;
  data_perda: string | null;
  motivo_perda_id: string | null;
  origens_lead: { nome: string } | null;
  servicos: { nome: string } | null;
  motivos_perda: { nome: string } | null;
  follow_ups: Array<{
    data_programada: string;
    descricao: string | null;
    concluido: boolean;
  }>;
  atividades_lead: Array<{
    data_atividade: string | null;
  }>;
}

// Helper to process follow-ups and activities
function processLeadExtras(lead: LeadQueryResult) {
  const pendingFollowUps = (lead.follow_ups || [])
    .filter((fu) => !fu.concluido)
    .sort(
      (a, b) =>
        new Date(a.data_programada).getTime() - new Date(b.data_programada).getTime()
    );

  const nextFollowUp = pendingFollowUps[0];

  const atividades = (lead.atividades_lead || [])
    .map((a) => (a.data_atividade ? new Date(a.data_atividade) : null))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime());

  const ultimaAtividade = atividades[0];

  return {
    follow_up: nextFollowUp
      ? {
          data: new Date(nextFollowUp.data_programada),
          descricao: nextFollowUp.descricao || undefined,
        }
      : undefined,
    ultima_atividade: ultimaAtividade,
  };
}

// ============= SDR LEADS =============

export async function fetchLeadsSDR(filters?: LeadsSDRFilters): Promise<LeadSDR[]> {
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

  return ((data || []) as unknown as LeadQueryResult[]).map((lead) => {
    const extras = processLeadExtras(lead);
    return {
      id: lead.id,
      nome: lead.nome,
      empresa: lead.empresa,
      telefone: lead.telefone,
      email: lead.email,
      origem_id: lead.origem_id,
      servico_interesse_id: lead.servico_interesse_id,
      etapa_frios: lead.etapa_frios,
      funil_atual: lead.funil_atual,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      observacoes: lead.observacoes,
      sdr_responsavel_id: lead.sdr_responsavel_id,
      closer_responsavel_id: lead.closer_responsavel_id,
      data_perda: lead.data_perda,
      motivo_perda_id: lead.motivo_perda_id,
      origem_nome: lead.origens_lead?.nome,
      servico_nome: lead.servicos?.nome,
      motivo_perda_nome: lead.motivos_perda?.nome,
      ...extras,
    };
  });
}

export async function updateLeadEtapaFrios(
  leadId: string,
  etapa: EtapaFrios
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({ etapa_frios: etapa })
    .eq("id", leadId);

  if (error) throw error;
}

export async function reativarLead(leadId: string, funil: "sdr" | "closer"): Promise<void> {
  const updateData =
    funil === "sdr"
      ? {
          funil_atual: "sdr" as const,
          etapa_sdr: "novo" as EtapaSDR,
          etapa_frios: null,
          data_perda: null,
          motivo_perda_id: null,
        }
      : {
          funil_atual: "closer" as const,
          etapa_closer: "reuniao_agendada" as EtapaCloser,
          etapa_frios: null,
          data_perda: null,
          motivo_perda_id: null,
        };

  const { error } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", leadId);

  if (error) throw error;
}

export async function fetchLeadsFriosCount(): Promise<number> {
  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("funil_atual", "frios")
    .neq("etapa_frios", "descartado");

  if (error) throw error;
  return count || 0;
}

// Export constants
export const ETAPAS_SDR: EtapaSDR[] = [
  "novo",
  "tentativa_contato",
  "contato_realizado",
  "qualificado",
  "reuniao_agendada",
  "perdido",
];

export const ETAPAS_CLOSER: EtapaCloser[] = [
  "reuniao_agendada",
  "reuniao_realizada",
  "proposta_enviada",
  "negociacao",
  "fechado_ganho",
  "perdido",
];

export const ETAPAS_FRIOS: EtapaFrios[] = [
  "esfriar",
  "reativacao",
  "reativado",
  "descartado",
];

export type { EtapaSDR, EtapaCloser, EtapaFrios };
