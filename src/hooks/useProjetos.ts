import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { addDays } from "date-fns";
import type { 
  SupabaseError,
  StatusProjeto,
  ProjetosTaskCounts,
  ProjetosStats as ProjetosStatsRPC,
  EmbeddedProfile,
  SetorTipo
} from "@/types/supabase-helpers";

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
  // Joined data
  cliente_nome?: string;
  cliente_nome_fantasia?: string;
  responsavel_nome?: string;
  servico_nome?: string;
  // Computed
  total_tarefas?: number;
  tarefas_concluidas?: number;
  tarefas_atrasadas?: number;
  is_onboarding?: boolean;
}

export interface UseProjetosFilters {
  busca?: string;
  clienteId?: string;
  responsavelId?: string;
  status?: StatusProjeto;
  comAtrasadas?: boolean;
}

// Embedded types for query results
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

export function useProjetos(filters: UseProjetosFilters = {}) {
  const { user } = useAuth();

  return useQuery<Projeto[], SupabaseError>({
    queryKey: ["projetos", filters],
    queryFn: async () => {
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
        query = query.or(
          `nome.ilike.%${filters.busca}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data?.length) return [];

      // Use optimized RPC to get task counts in a single query
      const projectIds = data.map((p) => p.id);
      
      const { data: taskCounts } = await supabase.rpc(
        "get_projetos_task_counts",
        { p_projeto_ids: projectIds }
      );

      // Create lookup map for task counts
      const tarefasByProjeto: Record<string, { total: number; concluidas: number; atrasadas: number }> = {};
      
      // Initialize all projects with zero counts
      projectIds.forEach(id => {
        tarefasByProjeto[id] = { total: 0, concluidas: 0, atrasadas: 0 };
      });
      
      // Populate from RPC result
      ((taskCounts || []) as ProjetosTaskCounts[]).forEach((tc) => {
        if (tc.projeto_id) {
          tarefasByProjeto[tc.projeto_id] = {
            total: Number(tc.total_tarefas) || 0,
            concluidas: Number(tc.tarefas_concluidas) || 0,
            atrasadas: Number(tc.tarefas_atrasadas) || 0,
          };
        }
      });

      let projetos = (data as ProjetoQueryResult[]).map((projeto): Projeto => ({
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
      }));

      if (filters.comAtrasadas) {
        projetos = projetos.filter((p) => p.tarefas_atrasadas && p.tarefas_atrasadas > 0);
      }

      return projetos;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}

interface EquipeMembro extends EmbeddedProfile {
  total_tarefas: number;
  tarefas_concluidas: number;
}

export function useProjeto(id: string) {
  return useQuery({
    queryKey: ["projeto", id],
    queryFn: async () => {
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

      // Get task counts
      const { data: tarefas } = await supabase
        .from("tarefas")
        .select("id, concluida, data_vencimento, responsavel_id")
        .eq("projeto_id", id);

      const now = new Date();
      const total = tarefas?.length || 0;
      const concluidas = tarefas?.filter((t) => t.concluida).length || 0;
      const atrasadas = tarefas?.filter(
        (t) => !t.concluida && t.data_vencimento && new Date(t.data_vencimento) < now
      ).length || 0;

      // Get team members
      const responsavelIds = [...new Set(tarefas?.map((t) => t.responsavel_id).filter((id): id is string => id !== null) || [])];
      
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
      } as Projeto & { equipe: EquipeMembro[] };
    },
    enabled: !!id,
  });
}

interface ProjetosStats {
  projetosAtivos: number;
  tarefasPendentes: number;
  tarefasAtrasadas: number;
  onboardings: number;
}

export function useProjetosStats() {
  return useQuery<ProjetosStats, SupabaseError>({
    queryKey: ["projetos-stats"],
    queryFn: async () => {
      // Use optimized RPC to get all stats in a single query
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
    },
    staleTime: 2 * 60 * 1000,
  });
}

interface CreateProjetoInput {
  cliente_id: string;
  cliente_servico_id?: string;
  nome: string;
  descricao?: string;
  responsavel_principal_id?: string;
}

export function useCreateProjeto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<unknown, SupabaseError, CreateProjetoInput>({
    mutationFn: async (data) => {
      const { data: projeto, error } = await supabase
        .from("projetos")
        .insert([{
          ...data,
          status: "ativo" as StatusProjeto,
        }])
        .select()
        .single();

      if (error) throw error;
      return projeto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      toast({ title: "Projeto criado com sucesso" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar projeto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

interface UpdateProjetoInput {
  id: string;
  nome?: string;
  descricao?: string;
  responsavel_principal_id?: string;
  status?: StatusProjeto;
  data_conclusao?: string;
}

export function useUpdateProjeto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, SupabaseError, UpdateProjetoInput>({
    mutationFn: async ({ id, ...data }) => {
      const { error } = await supabase
        .from("projetos")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      queryClient.invalidateQueries({ queryKey: ["projeto"] });
      toast({ title: "Projeto atualizado" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar projeto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============= ONBOARDING =============

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

interface TemplateTarefaEmbedded {
  id: string;
  prazo_dias: number | null;
}

interface TemplateQueryResult {
  id: string;
  servico_id: string;
  nome: string;
  ativo: boolean | null;
  created_at: string | null;
  servico: { nome: string } | null;
  tarefas: TemplateTarefaEmbedded[];
}

export function useTemplatesOnboarding() {
  return useQuery<TemplateOnboarding[], SupabaseError>({
    queryKey: ["templates-onboarding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates_onboarding")
        .select(`
          *,
          servico:servicos(nome),
          tarefas:template_onboarding_tarefas(id, prazo_dias)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data as TemplateQueryResult[]).map((t): TemplateOnboarding => ({
        id: t.id,
        servico_id: t.servico_id,
        nome: t.nome,
        ativo: t.ativo ?? true,
        created_at: t.created_at || undefined,
        servico_nome: t.servico?.nome,
        tarefas_count: t.tarefas?.length || 0,
        duracao_estimada: t.tarefas?.reduce((max, tarefa) => 
          Math.max(max, tarefa.prazo_dias || 0), 0) || 0,
      }));
    },
  });
}

export function useTemplateTarefas(templateId: string) {
  return useQuery<TemplateTarefa[], SupabaseError>({
    queryKey: ["template-tarefas", templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_onboarding_tarefas")
        .select("*")
        .eq("template_id", templateId)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as TemplateTarefa[];
    },
    enabled: !!templateId,
  });
}

interface UpdateTemplateInput {
  id: string;
  ativo: boolean;
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, SupabaseError, UpdateTemplateInput>({
    mutationFn: async ({ id, ativo }) => {
      const { error } = await supabase
        .from("templates_onboarding")
        .update({ ativo })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates-onboarding"] });
      toast({ title: "Template atualizado" });
    },
  });
}

export function useCreateTemplateTarefa() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<unknown, SupabaseError, Omit<TemplateTarefa, "id">>({
    mutationFn: async (data) => {
      const { data: tarefa, error } = await supabase
        .from("template_onboarding_tarefas")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return tarefa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-tarefas"] });
      queryClient.invalidateQueries({ queryKey: ["templates-onboarding"] });
      toast({ title: "Tarefa adicionada ao template" });
    },
  });
}

export function useUpdateTemplateTarefa() {
  const queryClient = useQueryClient();

  return useMutation<void, SupabaseError, Partial<TemplateTarefa> & { id: string }>({
    mutationFn: async ({ id, ...data }) => {
      const { error } = await supabase
        .from("template_onboarding_tarefas")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-tarefas"] });
      queryClient.invalidateQueries({ queryKey: ["templates-onboarding"] });
    },
  });
}

export function useDeleteTemplateTarefa() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, SupabaseError, string>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("template_onboarding_tarefas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-tarefas"] });
      queryClient.invalidateQueries({ queryKey: ["templates-onboarding"] });
      toast({ title: "Tarefa removida do template" });
    },
  });
}

// ============= DISPARAR ONBOARDING =============

interface DispararOnboardingInput {
  clienteId: string;
  clienteNome: string;
  servicoId: string;
  responsavelId: string;
  clienteServicoId?: string;
}

interface TemplateComTarefas {
  id: string;
  nome: string;
  tarefas: TemplateTarefa[];
}

export function useDispararOnboarding() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation<unknown, SupabaseError, DispararOnboardingInput>({
    mutationFn: async ({
      clienteId,
      clienteNome,
      servicoId,
      responsavelId,
      clienteServicoId,
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Buscar template do serviço
      const { data: template, error: templateError } = await supabase
        .from("templates_onboarding")
        .select(`
          *,
          tarefas:template_onboarding_tarefas(*)
        `)
        .eq("servico_id", servicoId)
        .eq("ativo", true)
        .maybeSingle();

      if (templateError) throw templateError;
      if (!template) {
        console.log("Nenhum template ativo para este serviço");
        return null;
      }

      const templateData = template as TemplateComTarefas;

      // 2. Criar projeto
      const { data: projeto, error: projetoError } = await supabase
        .from("projetos")
        .insert({
          cliente_id: clienteId,
          cliente_servico_id: clienteServicoId,
          nome: `Onboarding - ${clienteNome}`,
          responsavel_principal_id: responsavelId,
          status: "ativo" as StatusProjeto,
        })
        .select()
        .single();

      if (projetoError) throw projetoError;

      // 3. Buscar etapa padrão do kanban
      const { data: etapaPadrao } = await supabase
        .from("etapas_kanban")
        .select("id")
        .eq("is_default", true)
        .maybeSingle();

      const etapaId = etapaPadrao?.id;
      if (!etapaId) throw new Error("Etapa padrão não encontrada");

      // 4. Criar tarefas do template
      const hoje = new Date();
      const tarefasParaInserir = templateData.tarefas.map((tarefa, index) => ({
        projeto_id: projeto.id,
        cliente_id: clienteId,
        etapa_id: etapaId,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao,
        data_vencimento: tarefa.prazo_dias
          ? addDays(hoje, tarefa.prazo_dias).toISOString()
          : null,
        ordem: index,
        created_by_id: user.id,
      }));

      if (tarefasParaInserir.length > 0) {
        const { error: tarefasError } = await supabase
          .from("tarefas")
          .insert(tarefasParaInserir);

        if (tarefasError) throw tarefasError;
      }

      return projeto;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["projetos"] });
        queryClient.invalidateQueries({ queryKey: ["tarefas"] });
        toast({ title: "Onboarding iniciado com sucesso!" });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao iniciar onboarding",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
