/**
 * Projetos Service
 * Centralized Supabase data access for projects and onboarding templates
 */

import { supabase } from "@/integrations/supabase/client";
import { addDays } from "date-fns";
import type {
  StatusProjeto,
  ProjetosTaskCounts,
  ProjetosStats as ProjetosStatsRPC,
  SetorTipo,
} from "@/types/supabase-helpers";

// Types
export interface Projeto {
  id: string;
  cliente_id: string;
  cliente_servico_id?: string;
  nome: string;
  descricao?: string;
  responsavel_principal_id?: string;
  status: StatusProjeto;
  data_inicio?: string;
  data_conclusao?: string;
  created_at?: string;
  cliente_nome?: string;
  cliente_nome_fantasia?: string;
  responsavel_nome?: string;
  servico_nome?: string;
  total_tarefas?: number;
  tarefas_concluidas?: number;
  tarefas_atrasadas?: number;
  is_onboarding?: boolean;
}

export interface ProjetosFilters {
  busca?: string;
  clienteId?: string;
  responsavelId?: string;
  status?: StatusProjeto;
  comAtrasadas?: boolean;
}

export interface ProjetosStats {
  projetosAtivos: number;
  tarefasPendentes: number;
  tarefasAtrasadas: number;
  onboardings: number;
}

export interface EquipeMembro {
  id: string;
  nome: string;
  avatar_url: string | null;
  cargo: string | null;
  setor: SetorTipo | null;
  total_tarefas: number;
  tarefas_concluidas: number;
}

export interface TemplateOnboarding {
  id: string;
  servico_id: string;
  nome: string;
  ativo: boolean;
  created_at?: string;
  servico_nome?: string;
  tarefas_count?: number;
  duracao_estimada?: number;
}

export interface TemplateTarefa {
  id: string;
  template_id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  prazo_dias?: number;
  setor_responsavel?: string;
}

// Query result types
interface EmbeddedClienteProjeto {
  razao_social: string;
  nome_fantasia: string | null;
}

interface EmbeddedResponsavel {
  nome: string;
}

interface EmbeddedServicoNested {
  nome: string;
}

interface EmbeddedClienteServicoProjeto {
  servico: EmbeddedServicoNested | null;
}

interface ProjetoQueryResult {
  id: string;
  cliente_id: string;
  cliente_servico_id: string | null;
  nome: string;
  descricao: string | null;
  responsavel_principal_id: string | null;
  status: StatusProjeto | null;
  data_inicio: string | null;
  data_conclusao: string | null;
  created_at: string | null;
  cliente: EmbeddedClienteProjeto | null;
  responsavel: EmbeddedResponsavel | null;
  servico: EmbeddedClienteServicoProjeto | null;
}

// ============= PROJETOS =============

export async function fetchProjetos(filters: ProjetosFilters = {}): Promise<Projeto[]> {
  let query = supabase
    .from("projetos")
    .select(`
      *,
      cliente:clientes(razao_social, nome_fantasia),
      responsavel:profiles!projetos_responsavel_principal_id_fkey(nome),
      servico:cliente_servicos(servico:servicos(nome))
    `)
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.clienteId) {
    query = query.eq("cliente_id", filters.clienteId);
  }

  if (filters.responsavelId) {
    query = query.eq("responsavel_principal_id", filters.responsavelId);
  }

  if (filters.busca) {
    query = query.or(`nome.ilike.%${filters.busca}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data?.length) return [];

  // Use optimized RPC to get task counts
  const projectIds = data.map((p) => p.id);

  const { data: taskCounts } = await supabase.rpc("get_projetos_task_counts", {
    p_projeto_ids: projectIds,
  });

  const tarefasByProjeto: Record<
    string,
    { total: number; concluidas: number; atrasadas: number }
  > = {};

  projectIds.forEach((id) => {
    tarefasByProjeto[id] = { total: 0, concluidas: 0, atrasadas: 0 };
  });

  ((taskCounts || []) as ProjetosTaskCounts[]).forEach((tc) => {
    if (tc.projeto_id) {
      tarefasByProjeto[tc.projeto_id] = {
        total: Number(tc.total_tarefas) || 0,
        concluidas: Number(tc.tarefas_concluidas) || 0,
        atrasadas: Number(tc.tarefas_atrasadas) || 0,
      };
    }
  });

  let projetos = (data as ProjetoQueryResult[]).map(
    (projeto): Projeto => ({
      id: projeto.id,
      cliente_id: projeto.cliente_id,
      cliente_servico_id: projeto.cliente_servico_id || undefined,
      nome: projeto.nome,
      descricao: projeto.descricao || undefined,
      responsavel_principal_id: projeto.responsavel_principal_id || undefined,
      status: projeto.status || "ativo",
      data_inicio: projeto.data_inicio || undefined,
      data_conclusao: projeto.data_conclusao || undefined,
      created_at: projeto.created_at || undefined,
      cliente_nome: projeto.cliente?.razao_social,
      cliente_nome_fantasia: projeto.cliente?.nome_fantasia || undefined,
      responsavel_nome: projeto.responsavel?.nome,
      servico_nome: projeto.servico?.servico?.nome,
      total_tarefas: tarefasByProjeto[projeto.id]?.total || 0,
      tarefas_concluidas: tarefasByProjeto[projeto.id]?.concluidas || 0,
      tarefas_atrasadas: tarefasByProjeto[projeto.id]?.atrasadas || 0,
      is_onboarding: projeto.nome.toLowerCase().includes("onboarding"),
    })
  );

  if (filters.comAtrasadas) {
    projetos = projetos.filter((p) => p.tarefas_atrasadas && p.tarefas_atrasadas > 0);
  }

  return projetos;
}

export async function fetchProjeto(
  id: string
): Promise<Projeto & { equipe: EquipeMembro[] }> {
  const { data, error } = await supabase
    .from("projetos")
    .select(`
      *,
      cliente:clientes(id, razao_social, nome_fantasia, telefone, email),
      responsavel:profiles!projetos_responsavel_principal_id_fkey(id, nome, avatar_url, cargo),
      servico:cliente_servicos(id, servico:servicos(id, nome))
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  const { data: tarefas } = await supabase
    .from("tarefas")
    .select("id, concluida, data_vencimento, responsavel_id")
    .eq("projeto_id", id);

  const now = new Date();
  const total = tarefas?.length || 0;
  const concluidas = tarefas?.filter((t) => t.concluida).length || 0;
  const atrasadas =
    tarefas?.filter(
      (t) => !t.concluida && t.data_vencimento && new Date(t.data_vencimento) < now
    ).length || 0;

  const responsavelIds = [
    ...new Set(
      tarefas?.map((t) => t.responsavel_id).filter((id): id is string => id !== null) ||
        []
    ),
  ];

  let equipe: EquipeMembro[] = [];
  if (responsavelIds.length > 0) {
    const { data: membros } = await supabase
      .from("profiles")
      .select("id, nome, avatar_url, cargo, setor")
      .in("id", responsavelIds);

    equipe = (membros || []).map((m) => {
      const tarefasMembro = tarefas?.filter((t) => t.responsavel_id === m.id) || [];
      return {
        id: m.id,
        nome: m.nome,
        avatar_url: m.avatar_url,
        cargo: m.cargo,
        setor: m.setor as SetorTipo | null,
        total_tarefas: tarefasMembro.length,
        tarefas_concluidas: tarefasMembro.filter((t) => t.concluida).length,
      };
    });
  }

  const projeto = data as ProjetoQueryResult;

  return {
    id: projeto.id,
    cliente_id: projeto.cliente_id,
    cliente_servico_id: projeto.cliente_servico_id || undefined,
    nome: projeto.nome,
    descricao: projeto.descricao || undefined,
    responsavel_principal_id: projeto.responsavel_principal_id || undefined,
    status: projeto.status || "ativo",
    data_inicio: projeto.data_inicio || undefined,
    data_conclusao: projeto.data_conclusao || undefined,
    created_at: projeto.created_at || undefined,
    cliente_nome: projeto.cliente?.razao_social,
    cliente_nome_fantasia: projeto.cliente?.nome_fantasia || undefined,
    responsavel_nome: projeto.responsavel?.nome,
    servico_nome: projeto.servico?.servico?.nome,
    total_tarefas: total,
    tarefas_concluidas: concluidas,
    tarefas_atrasadas: atrasadas,
    equipe,
  };
}

export async function fetchProjetosStats(): Promise<ProjetosStats> {
  const { data, error } = await supabase.rpc("get_projetos_stats");

  if (error) throw error;

  const stats = (data as ProjetosStatsRPC[])?.[0] || {
    projetos_ativos: 0,
    tarefas_pendentes: 0,
    tarefas_atrasadas: 0,
    onboardings: 0,
  };

  return {
    projetosAtivos: Number(stats.projetos_ativos) || 0,
    tarefasPendentes: Number(stats.tarefas_pendentes) || 0,
    tarefasAtrasadas: Number(stats.tarefas_atrasadas) || 0,
    onboardings: Number(stats.onboardings) || 0,
  };
}

export interface CreateProjetoInput {
  cliente_id: string;
  cliente_servico_id?: string;
  nome: string;
  descricao?: string;
  responsavel_principal_id?: string;
}

export async function createProjeto(data: CreateProjetoInput) {
  const { data: projeto, error } = await supabase
    .from("projetos")
    .insert([
      {
        ...data,
        status: "ativo" as StatusProjeto,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return projeto;
}

export interface UpdateProjetoInput {
  id: string;
  nome?: string;
  descricao?: string;
  responsavel_principal_id?: string;
  status?: StatusProjeto;
  data_conclusao?: string;
}

export async function updateProjeto({ id, ...data }: UpdateProjetoInput): Promise<void> {
  const { error } = await supabase.from("projetos").update(data).eq("id", id);

  if (error) throw error;
}

// ============= TEMPLATES ONBOARDING =============

export async function fetchTemplatesOnboarding(): Promise<TemplateOnboarding[]> {
  const { data, error } = await supabase
    .from("templates_onboarding")
    .select(`
      *,
      servico:servicos(nome),
      tarefas:template_onboarding_tarefas(id, prazo_dias)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((t) => ({
    id: t.id,
    servico_id: t.servico_id,
    nome: t.nome,
    ativo: t.ativo ?? true,
    created_at: t.created_at || undefined,
    servico_nome: (t.servico as { nome: string } | null)?.nome,
    tarefas_count: (t.tarefas as Array<{ id: string; prazo_dias: number | null }>)?.length || 0,
    duracao_estimada:
      (t.tarefas as Array<{ id: string; prazo_dias: number | null }>)?.reduce(
        (max, tarefa) => Math.max(max, tarefa.prazo_dias || 0),
        0
      ) || 0,
  }));
}

export async function fetchTemplateTarefas(templateId: string): Promise<TemplateTarefa[]> {
  const { data, error } = await supabase
    .from("template_onboarding_tarefas")
    .select("*")
    .eq("template_id", templateId)
    .order("ordem", { ascending: true });

  if (error) throw error;
  return data as TemplateTarefa[];
}

export async function updateTemplate(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase
    .from("templates_onboarding")
    .update({ ativo })
    .eq("id", id);

  if (error) throw error;
}

export async function createTemplateTarefa(data: Omit<TemplateTarefa, "id">) {
  const { data: tarefa, error } = await supabase
    .from("template_onboarding_tarefas")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return tarefa;
}

export async function updateTemplateTarefa({
  id,
  ...data
}: Partial<TemplateTarefa> & { id: string }): Promise<void> {
  const { error } = await supabase
    .from("template_onboarding_tarefas")
    .update(data)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteTemplateTarefa(id: string): Promise<void> {
  const { error } = await supabase
    .from("template_onboarding_tarefas")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export interface DispararOnboardingInput {
  cliente_id: string;
  cliente_servico_id: string;
  template_id: string;
  responsavel_id?: string;
}

export async function dispararOnboarding(
  input: DispararOnboardingInput,
  userId: string
) {
  const { data: template, error: templateError } = await supabase
    .from("templates_onboarding")
    .select(`
      *,
      servico:servicos(nome),
      tarefas:template_onboarding_tarefas(*)
    `)
    .eq("id", input.template_id)
    .single();

  if (templateError) throw templateError;

  const servicoNome = (template.servico as { nome: string } | null)?.nome || "Onboarding";

  const { data: projeto, error: projetoError } = await supabase
    .from("projetos")
    .insert([
      {
        cliente_id: input.cliente_id,
        cliente_servico_id: input.cliente_servico_id,
        nome: `Onboarding - ${servicoNome}`,
        responsavel_principal_id: input.responsavel_id || userId,
        status: "ativo" as StatusProjeto,
      },
    ])
    .select()
    .single();

  if (projetoError) throw projetoError;

  const { data: etapaDefault, error: etapaError } = await supabase
    .from("etapas_kanban")
    .select("id")
    .eq("is_default", true)
    .single();

  if (etapaError) throw etapaError;

  const tarefas = (template.tarefas as Array<{
    titulo: string;
    descricao: string | null;
    ordem: number;
    prazo_dias: number | null;
    setor_responsavel: string | null;
  }>) || [];
  
  const tarefasInsert = tarefas.map((t, index) => ({
    projeto_id: projeto.id,
    cliente_id: input.cliente_id,
    etapa_id: etapaDefault.id,
    titulo: t.titulo,
    descricao: t.descricao,
    ordem: t.ordem || index,
    data_vencimento: t.prazo_dias
      ? addDays(new Date(), t.prazo_dias).toISOString()
      : null,
    created_by_id: userId,
  }));

  if (tarefasInsert.length > 0) {
    const { error: tarefasError } = await supabase.from("tarefas").insert(tarefasInsert);

    if (tarefasError) throw tarefasError;
  }

  return projeto;
}
