/**
 * Calendario Service
 * Centralized Supabase data access for meetings and absences
 */

import { supabase } from "@/integrations/supabase/client";

// Types
export interface Reuniao {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: "weekly" | "1:1" | "projeto" | "cliente" | "outro";
  data_inicio: string;
  data_fim: string;
  local: string | null;
  organizador_id: string;
  projeto_id: string | null;
  cliente_id: string | null;
  lead_id: string | null;
  recorrente: boolean;
  recorrencia_config: Record<string, unknown> | null;
  status: "agendada" | "realizada" | "cancelada";
  created_at: string;
  updated_at: string;
  organizador?: {
    id: string;
    nome: string;
    avatar_url: string | null;
  };
  projeto?: {
    id: string;
    nome: string;
  } | null;
  cliente?: {
    id: string;
    razao_social: string;
    nome_fantasia: string | null;
  } | null;
}

export interface ReuniaoParticipante {
  id: string;
  reuniao_id: string;
  participante_id: string;
  confirmado: boolean | null;
  created_at: string;
  participante?: {
    id: string;
    nome: string;
    avatar_url: string | null;
  };
}

export interface ReuniaoAta {
  id: string;
  reuniao_id: string;
  conteudo: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: string;
    nome: string;
  };
}

export interface Ausencia {
  id: string;
  colaborador_id: string;
  tipo: "ferias" | "ausencia";
  data_inicio: string;
  data_fim: string;
  motivo: string | null;
  status: "pendente" | "aprovada" | "recusada";
  aprovado_por_id: string | null;
  aprovado_em: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  colaborador?: {
    id: string;
    nome: string;
    avatar_url: string | null;
  };
  aprovado_por?: {
    id: string;
    nome: string;
  } | null;
}

export interface CalendarioFilters {
  dataInicio?: string;
  dataFim?: string;
  tipo?: string;
  participanteId?: string;
  apenasMinhas?: boolean;
  userId?: string;
}

export interface AusenciasFilters {
  status?: string;
  colaboradorId?: string;
}

// ============= REUNIOES =============

export async function fetchReunioes(filters: CalendarioFilters = {}): Promise<Reuniao[]> {
  let query = supabase
    .from("reunioes")
    .select(`
      *,
      organizador:profiles!reunioes_organizador_id_fkey(id, nome, avatar_url),
      projeto:projetos(id, nome),
      cliente:clientes(id, razao_social, nome_fantasia)
    `)
    .order("data_inicio", { ascending: true });

  if (filters.dataInicio) {
    query = query.gte("data_inicio", filters.dataInicio);
  }
  if (filters.dataFim) {
    query = query.lte("data_inicio", filters.dataFim);
  }
  if (filters.tipo && filters.tipo !== "todos") {
    query = query.eq(
      "tipo",
      filters.tipo as "weekly" | "1:1" | "projeto" | "cliente" | "outro"
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  // If filtering by participant
  if (filters.participanteId || filters.apenasMinhas) {
    const targetId = filters.apenasMinhas ? filters.userId : filters.participanteId;
    if (!targetId) return data as Reuniao[];

    const { data: participacoes } = await supabase
      .from("reuniao_participantes")
      .select("reuniao_id")
      .eq("participante_id", targetId);

    const reuniaoIds = new Set([
      ...(participacoes?.map((p) => p.reuniao_id) || []),
      ...(data?.filter((r) => r.organizador_id === targetId).map((r) => r.id) || []),
    ]);

    return (data || []).filter((r) => reuniaoIds.has(r.id)) as Reuniao[];
  }

  return data as Reuniao[];
}

export async function fetchReuniao(reuniaoId: string): Promise<Reuniao | null> {
  if (!reuniaoId) return null;

  const { data, error } = await supabase
    .from("reunioes")
    .select(`
      *,
      organizador:profiles!reunioes_organizador_id_fkey(id, nome, avatar_url),
      projeto:projetos(id, nome),
      cliente:clientes(id, razao_social, nome_fantasia)
    `)
    .eq("id", reuniaoId)
    .single();

  if (error) throw error;
  return data as Reuniao;
}

export async function fetchReuniaoParticipantes(
  reuniaoId: string
): Promise<ReuniaoParticipante[]> {
  if (!reuniaoId) return [];

  const { data, error } = await supabase
    .from("reuniao_participantes")
    .select(`
      *,
      participante:profiles(id, nome, avatar_url)
    `)
    .eq("reuniao_id", reuniaoId);

  if (error) throw error;
  return data as ReuniaoParticipante[];
}

export async function fetchReuniaoAta(reuniaoId: string): Promise<ReuniaoAta | null> {
  if (!reuniaoId) return null;

  const { data, error } = await supabase
    .from("reuniao_atas")
    .select(`
      *,
      created_by:profiles(id, nome)
    `)
    .eq("reuniao_id", reuniaoId)
    .maybeSingle();

  if (error) throw error;
  return data as ReuniaoAta | null;
}

export interface CreateReuniaoInput {
  titulo: string;
  descricao?: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  local?: string;
  projeto_id?: string;
  cliente_id?: string;
  lead_id?: string;
  recorrente?: boolean;
  participantes: string[];
}

export async function createReuniao(input: CreateReuniaoInput, organizadorId: string) {
  const { participantes, tipo, ...reuniaoData } = input;

  const { data: reuniao, error: reuniaoError } = await supabase
    .from("reunioes")
    .insert({
      ...reuniaoData,
      tipo: tipo as "weekly" | "1:1" | "projeto" | "cliente" | "outro",
      organizador_id: organizadorId,
    })
    .select()
    .single();

  if (reuniaoError) throw reuniaoError;

  // Add participants
  if (participantes.length > 0) {
    const participantesData = participantes.map((participante_id) => ({
      reuniao_id: reuniao.id,
      participante_id,
    }));

    const { error: partError } = await supabase
      .from("reuniao_participantes")
      .insert(participantesData);

    if (partError) throw partError;
  }

  return reuniao;
}

export async function updateReuniaoStatus(
  id: string,
  status: "agendada" | "realizada" | "cancelada"
) {
  const { data, error } = await supabase
    .from("reunioes")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function confirmarPresenca(
  reuniaoId: string,
  participanteId: string,
  confirmado: boolean
) {
  const { data, error } = await supabase
    .from("reuniao_participantes")
    .update({ confirmado })
    .eq("reuniao_id", reuniaoId)
    .eq("participante_id", participanteId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface SaveAtaInput {
  reuniaoId: string;
  conteudo: string;
  ataId?: string;
}

export async function saveAta(input: SaveAtaInput, userId: string) {
  if (input.ataId) {
    const { data, error } = await supabase
      .from("reuniao_atas")
      .update({ conteudo: input.conteudo })
      .eq("id", input.ataId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("reuniao_atas")
      .insert({
        reuniao_id: input.reuniaoId,
        conteudo: input.conteudo,
        created_by_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// ============= AUSENCIAS =============

export async function fetchAusencias(filters: AusenciasFilters = {}): Promise<Ausencia[]> {
  let query = supabase
    .from("ausencias")
    .select(`
      *,
      colaborador:profiles!ausencias_colaborador_id_fkey(id, nome, avatar_url),
      aprovado_por:profiles!ausencias_aprovado_por_id_fkey(id, nome)
    `)
    .order("data_inicio", { ascending: false });

  if (filters.status && filters.status !== "todos") {
    query = query.eq("status", filters.status as "pendente" | "aprovada" | "recusada");
  }
  if (filters.colaboradorId) {
    query = query.eq("colaborador_id", filters.colaboradorId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Ausencia[];
}

export async function fetchMinhasAusencias(userId: string): Promise<Ausencia[]> {
  const { data, error } = await supabase
    .from("ausencias")
    .select(`
      *,
      aprovado_por:profiles!ausencias_aprovado_por_id_fkey(id, nome)
    `)
    .eq("colaborador_id", userId)
    .order("data_inicio", { ascending: false });

  if (error) throw error;
  return data as Ausencia[];
}

export interface CreateAusenciaInput {
  tipo: "ferias" | "ausencia";
  data_inicio: string;
  data_fim: string;
  motivo?: string;
}

export async function createAusencia(input: CreateAusenciaInput, colaboradorId: string) {
  const { data, error } = await supabase
    .from("ausencias")
    .insert({
      ...input,
      colaborador_id: colaboradorId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface UpdateAusenciaStatusInput {
  id: string;
  status: "aprovada" | "recusada";
  observacoes?: string;
}

export async function updateAusenciaStatus(
  input: UpdateAusenciaStatusInput,
  aprovadoPorId: string
) {
  const { data, error } = await supabase
    .from("ausencias")
    .update({
      status: input.status,
      observacoes: input.observacoes,
      aprovado_por_id: aprovadoPorId,
      aprovado_em: new Date().toISOString(),
    })
    .eq("id", input.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Export constants
export const coresReuniao: Record<string, string> = {
  weekly: "bg-blue-500",
  "1:1": "bg-purple-500",
  projeto: "bg-green-500",
  cliente: "bg-orange-500",
  outro: "bg-gray-500",
};

export const coresReuniaoBorder: Record<string, string> = {
  weekly: "border-l-blue-500",
  "1:1": "border-l-purple-500",
  projeto: "border-l-green-500",
  cliente: "border-l-orange-500",
  outro: "border-l-gray-500",
};

export const labelsReuniao: Record<string, string> = {
  weekly: "Reunião Equipe",
  "1:1": "1:1",
  projeto: "Projeto",
  cliente: "Cliente",
  outro: "Outro",
};
