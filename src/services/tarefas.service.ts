/**
 * Tarefas Service
 * Centralized Supabase data access for tasks
 */

import { supabase } from "@/integrations/supabase/client";

// Types
export interface EtapaKanban {
  id: string;
  nome: string;
  ordem: number;
  cor: string | null;
  is_default: boolean;
  is_done: boolean;
}

export interface Tarefa {
  id: string;
  projeto_id: string;
  cliente_id: string;
  etapa_id: string;
  titulo: string;
  descricao: string | null;
  responsavel_id: string | null;
  prioridade: "baixa" | "media" | "alta" | "urgente";
  data_vencimento: string | null;
  recorrente: boolean;
  recorrencia_config: unknown;
  tarefa_pai_id: string | null;
  ordem: number;
  concluida: boolean;
  concluida_em: string | null;
  concluida_por_id: string | null;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  projeto?: {
    id: string;
    nome: string;
  };
  cliente?: {
    id: string;
    nome_fantasia: string | null;
    razao_social: string;
  };
  responsavel?: {
    id: string;
    nome: string;
    avatar_url: string | null;
  };
  created_by?: {
    id: string;
    nome: string;
  };
  subtarefas?: Tarefa[];
  _count?: {
    comentarios: number;
    anexos: number;
    subtarefas: number;
    subtarefas_concluidas: number;
  };
}

export interface TarefaComentario {
  id: string;
  tarefa_id: string;
  autor_id: string;
  conteudo: string;
  created_at: string;
  updated_at: string;
  autor?: {
    id: string;
    nome: string;
    avatar_url: string | null;
  };
  anexos?: TarefaComentarioAnexo[];
}

export interface TarefaComentarioAnexo {
  id: string;
  comentario_id: string;
  nome: string;
  url: string;
  tipo: string | null;
  tamanho: number | null;
}

export interface TarefaAnexo {
  id: string;
  tarefa_id: string;
  nome: string;
  url: string;
  tipo: string | null;
  tamanho: number | null;
  uploaded_por_id: string | null;
  created_at: string;
}

export interface TarefaHistorico {
  id: string;
  tarefa_id: string;
  tipo: string;
  descricao: string;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  realizado_por_id: string;
  created_at: string;
  realizado_por?: {
    id: string;
    nome: string;
  };
}

export interface TarefaFilters {
  minhasTarefas?: boolean;
  clienteIds?: string[];
  projetoId?: string;
  responsavelIds?: string[];
  prioridades?: string[];
  prazo?: "atrasadas" | "hoje" | "semana" | "mes" | "sem_prazo";
  userId?: string;
}

export interface RecorrenciaConfig {
  tipo: "diaria" | "semanal" | "mensal";
  intervalo: number;
  diasSemana?: number[];
  diaDoMes?: number;
  dataFim?: string | null;
}

// ============= FETCH FUNCTIONS =============

export async function fetchEtapasKanban(): Promise<EtapaKanban[]> {
  const { data, error } = await supabase
    .from("etapas_kanban")
    .select("*")
    .order("ordem");

  if (error) throw error;
  return data as EtapaKanban[];
}

export async function fetchTarefas(filters: TarefaFilters = {}): Promise<Tarefa[]> {
  let query = supabase
    .from("tarefas")
    .select(`
      *,
      projeto:projetos(id, nome),
      cliente:clientes(id, nome_fantasia, razao_social),
      responsavel:profiles!tarefas_responsavel_id_fkey(id, nome, avatar_url),
      created_by:profiles!tarefas_created_by_id_fkey(id, nome)
    `)
    .is("tarefa_pai_id", null)
    .order("ordem");

  if (filters.clienteIds && filters.clienteIds.length > 0) {
    query = query.in("cliente_id", filters.clienteIds);
  }

  if (filters.projetoId) {
    query = query.eq("projeto_id", filters.projetoId);
  }

  if (filters.responsavelIds && filters.responsavelIds.length > 0) {
    query = query.in("responsavel_id", filters.responsavelIds);
  }

  if (filters.prioridades && filters.prioridades.length > 0) {
    query = query.in(
      "prioridade",
      filters.prioridades as ("baixa" | "media" | "alta" | "urgente")[]
    );
  }

  if (filters.minhasTarefas && filters.userId) {
    query = query.eq("responsavel_id", filters.userId);
  }

  // Deadline filter
  if (filters.prazo) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeISO = hoje.toISOString();

    switch (filters.prazo) {
      case "atrasadas":
        query = query.lt("data_vencimento", hojeISO).eq("concluida", false);
        break;
      case "hoje":
        const fimHoje = new Date(hoje);
        fimHoje.setHours(23, 59, 59, 999);
        query = query
          .gte("data_vencimento", hojeISO)
          .lte("data_vencimento", fimHoje.toISOString());
        break;
      case "semana":
        const fimSemana = new Date(hoje);
        fimSemana.setDate(fimSemana.getDate() + 7);
        query = query
          .gte("data_vencimento", hojeISO)
          .lte("data_vencimento", fimSemana.toISOString());
        break;
      case "mes":
        const fimMes = new Date(hoje);
        fimMes.setMonth(fimMes.getMonth() + 1);
        query = query
          .gte("data_vencimento", hojeISO)
          .lte("data_vencimento", fimMes.toISOString());
        break;
      case "sem_prazo":
        query = query.is("data_vencimento", null);
        break;
    }
  }

  const { data, error } = await query;

  if (error) throw error;

  // Fetch counters for each task
  const tarefasComContadores = await Promise.all(
    (data || []).map(async (tarefa) => {
      const [comentariosResult, anexosResult, subtarefasResult] = await Promise.all([
        supabase
          .from("tarefa_comentarios")
          .select("id", { count: "exact", head: true })
          .eq("tarefa_id", tarefa.id),
        supabase
          .from("tarefa_anexos")
          .select("id", { count: "exact", head: true })
          .eq("tarefa_id", tarefa.id),
        supabase.from("tarefas").select("id, concluida").eq("tarefa_pai_id", tarefa.id),
      ]);

      const subtarefas = subtarefasResult.data || [];

      return {
        ...tarefa,
        _count: {
          comentarios: comentariosResult.count || 0,
          anexos: anexosResult.count || 0,
          subtarefas: subtarefas.length,
          subtarefas_concluidas: subtarefas.filter((s) => s.concluida).length,
        },
      };
    })
  );

  return tarefasComContadores as unknown as Tarefa[];
}

export async function fetchTarefa(tarefaId: string): Promise<Tarefa | null> {
  if (!tarefaId) return null;

  const { data, error } = await supabase
    .from("tarefas")
    .select(`
      *,
      projeto:projetos(id, nome),
      cliente:clientes(id, nome_fantasia, razao_social),
      responsavel:profiles!tarefas_responsavel_id_fkey(id, nome, avatar_url),
      created_by:profiles!tarefas_created_by_id_fkey(id, nome)
    `)
    .eq("id", tarefaId)
    .single();

  if (error) throw error;

  // Fetch subtasks
  const { data: subtarefas } = await supabase
    .from("tarefas")
    .select(`
      *,
      responsavel:profiles!tarefas_responsavel_id_fkey(id, nome, avatar_url)
    `)
    .eq("tarefa_pai_id", tarefaId)
    .order("ordem");

  return {
    ...data,
    subtarefas: subtarefas || [],
  } as unknown as Tarefa;
}

export async function fetchTarefaComentarios(tarefaId: string): Promise<TarefaComentario[]> {
  if (!tarefaId) return [];

  const { data, error } = await supabase
    .from("tarefa_comentarios")
    .select(`
      *,
      autor:profiles(id, nome, avatar_url)
    `)
    .eq("tarefa_id", tarefaId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Fetch attachments for each comment
  const comentariosComAnexos = await Promise.all(
    (data || []).map(async (comentario) => {
      const { data: anexos } = await supabase
        .from("tarefa_comentario_anexos")
        .select("*")
        .eq("comentario_id", comentario.id);

      return {
        ...comentario,
        anexos: anexos || [],
      };
    })
  );

  return comentariosComAnexos as TarefaComentario[];
}

export async function fetchTarefaAnexos(tarefaId: string): Promise<TarefaAnexo[]> {
  if (!tarefaId) return [];

  const { data, error } = await supabase
    .from("tarefa_anexos")
    .select("*")
    .eq("tarefa_id", tarefaId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as TarefaAnexo[];
}

export async function fetchTarefaHistorico(tarefaId: string): Promise<TarefaHistorico[]> {
  if (!tarefaId) return [];

  const { data, error } = await supabase
    .from("tarefa_historico")
    .select(`
      *,
      realizado_por:profiles(id, nome)
    `)
    .eq("tarefa_id", tarefaId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as TarefaHistorico[];
}

// ============= MUTATION FUNCTIONS =============

export interface CreateTarefaInput {
  projeto_id: string;
  cliente_id: string;
  etapa_id: string;
  titulo: string;
  descricao?: string;
  responsavel_id?: string;
  prioridade?: "baixa" | "media" | "alta" | "urgente";
  data_vencimento?: string;
  recorrente?: boolean;
  recorrencia_config?: RecorrenciaConfig;
  tarefa_pai_id?: string;
}

export async function createTarefa(data: CreateTarefaInput, userId: string) {
  const insertData = {
    projeto_id: data.projeto_id,
    cliente_id: data.cliente_id,
    etapa_id: data.etapa_id,
    titulo: data.titulo,
    descricao: data.descricao,
    responsavel_id: data.responsavel_id,
    prioridade: data.prioridade,
    data_vencimento: data.data_vencimento,
    recorrente: data.recorrente,
    recorrencia_config: data.recorrencia_config
      ? JSON.parse(JSON.stringify(data.recorrencia_config))
      : null,
    tarefa_pai_id: data.tarefa_pai_id,
    created_by_id: userId,
  };

  const { data: tarefa, error } = await supabase
    .from("tarefas")
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;

  // Record in history
  await supabase.from("tarefa_historico").insert({
    tarefa_id: tarefa.id,
    tipo: "criada",
    descricao: "Tarefa criada",
    realizado_por_id: userId,
  });

  return tarefa;
}

export async function updateTarefa(id: string, data: Partial<Tarefa>) {
  const updateData: Record<string, unknown> = {};

  if (data.titulo !== undefined) updateData.titulo = data.titulo;
  if (data.descricao !== undefined) updateData.descricao = data.descricao;
  if (data.projeto_id !== undefined) updateData.projeto_id = data.projeto_id;
  if (data.cliente_id !== undefined) updateData.cliente_id = data.cliente_id;
  if (data.etapa_id !== undefined) updateData.etapa_id = data.etapa_id;
  if (data.responsavel_id !== undefined) updateData.responsavel_id = data.responsavel_id;
  if (data.prioridade !== undefined) updateData.prioridade = data.prioridade;
  if (data.data_vencimento !== undefined)
    updateData.data_vencimento = data.data_vencimento;
  if (data.recorrente !== undefined) updateData.recorrente = data.recorrente;
  if (data.recorrencia_config !== undefined)
    updateData.recorrencia_config = data.recorrencia_config;
  if (data.concluida !== undefined) updateData.concluida = data.concluida;

  const { data: tarefa, error } = await supabase
    .from("tarefas")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return tarefa;
}

export interface MoveTarefaInput {
  tarefaId: string;
  etapaId: string;
  ordem?: number;
  concluir?: boolean;
}

export async function moveTarefa({ tarefaId, etapaId, ordem, concluir }: MoveTarefaInput) {
  const updateData: Record<string, unknown> = { etapa_id: etapaId };

  if (ordem !== undefined) updateData.ordem = ordem;
  if (concluir !== undefined) updateData.concluida = concluir;

  const { data, error } = await supabase
    .from("tarefas")
    .update(updateData)
    .eq("id", tarefaId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTarefa(tarefaId: string): Promise<void> {
  // Delete subtasks first
  await supabase.from("tarefas").delete().eq("tarefa_pai_id", tarefaId);

  const { error } = await supabase.from("tarefas").delete().eq("id", tarefaId);

  if (error) throw error;
}

export interface CreateComentarioInput {
  tarefa_id: string;
  conteudo: string;
  autor_id: string;
}

export async function createComentario(data: CreateComentarioInput) {
  const { data: comentario, error } = await supabase
    .from("tarefa_comentarios")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return comentario;
}

export async function deleteComentario(comentarioId: string): Promise<void> {
  const { error } = await supabase
    .from("tarefa_comentarios")
    .delete()
    .eq("id", comentarioId);

  if (error) throw error;
}
