import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { addDays } from "date-fns";

export interface Projeto {
  id: string;
  cliente_id: string;
  cliente_servico_id?: string;
  nome: string;
  descricao?: string;
  responsavel_principal_id?: string;
  status: "ativo" | "pausado" | "concluido" | "cancelado";
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
  status?: "ativo" | "pausado" | "concluido" | "cancelado";
  comAtrasadas?: boolean;
}

export function useProjetos(filters: UseProjetosFilters = {}) {
  const { user } = useAuth();

  return useQuery({
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

      // Get task counts for all projects in a single query (optimized)
      const projectIds = data.map((p) => p.id);
      
      const { data: tarefas } = await supabase
        .from("tarefas")
        .select("projeto_id, concluida, data_vencimento")
        .in("projeto_id", projectIds);

      const now = new Date();
      const tarefasByProjeto: Record<string, { total: number; concluidas: number; atrasadas: number }> = {};
      
      // Initialize all projects with zero counts
      projectIds.forEach(id => {
        tarefasByProjeto[id] = { total: 0, concluidas: 0, atrasadas: 0 };
      });
      
      // Aggregate counts from single query result
      (tarefas || []).forEach(t => {
        if (t.projeto_id && tarefasByProjeto[t.projeto_id]) {
          tarefasByProjeto[t.projeto_id].total++;
          if (t.concluida) tarefasByProjeto[t.projeto_id].concluidas++;
          if (!t.concluida && t.data_vencimento && new Date(t.data_vencimento) < now) {
            tarefasByProjeto[t.projeto_id].atrasadas++;
          }
        }
      });

      let projetos = data.map((projeto): Projeto => ({
        ...projeto,
        status: projeto.status as Projeto["status"],
        cliente_nome: projeto.cliente?.razao_social,
        cliente_nome_fantasia: projeto.cliente?.nome_fantasia,
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
  });
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
      const responsavelIds = [...new Set(tarefas?.map((t) => t.responsavel_id).filter(Boolean) || [])];
      
      let equipe: any[] = [];
      if (responsavelIds.length > 0) {
        const { data: membros } = await supabase
          .from("profiles")
          .select("id, nome, avatar_url, cargo, setor")
          .in("id", responsavelIds);

        equipe = membros?.map((m) => {
          const tarefasMembro = tarefas?.filter((t) => t.responsavel_id === m.id) || [];
          return {
            ...m,
            total_tarefas: tarefasMembro.length,
            tarefas_concluidas: tarefasMembro.filter((t) => t.concluida).length,
          };
        }) || [];
      }

      return {
        ...data,
        status: data.status as Projeto["status"],
        cliente_nome: data.cliente?.razao_social,
        cliente_nome_fantasia: data.cliente?.nome_fantasia,
        responsavel_nome: data.responsavel?.nome,
        servico_nome: data.servico?.servico?.nome,
        total_tarefas: total,
        tarefas_concluidas: concluidas,
        tarefas_atrasadas: atrasadas,
        equipe,
      } as Projeto & { equipe: any[] };
    },
    enabled: !!id,
  });
}

export function useProjetosStats() {
  return useQuery({
    queryKey: ["projetos-stats"],
    queryFn: async () => {
      const { data: projetos, error } = await supabase
        .from("projetos")
        .select("id, status");

      if (error) throw error;

      const { data: tarefas } = await supabase
        .from("tarefas")
        .select("id, concluida, data_vencimento, projeto_id");

      const now = new Date();
      const ativos = projetos?.filter((p) => p.status === "ativo").length || 0;
      const totalTarefas = tarefas?.filter((t) => !t.concluida).length || 0;
      const atrasadas = tarefas?.filter(
        (t) => !t.concluida && t.data_vencimento && new Date(t.data_vencimento) < now
      ).length || 0;

      // Count onboardings (projetos com nome contendo "onboarding" e status ativo)
      const onboardings = projetos?.filter(
        (p) => p.status === "ativo"
      ).length || 0;

      return {
        projetosAtivos: ativos,
        tarefasPendentes: totalTarefas,
        tarefasAtrasadas: atrasadas,
        onboardings,
      };
    },
  });
}

export function useCreateProjeto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      cliente_id: string;
      cliente_servico_id?: string;
      nome: string;
      descricao?: string;
      responsavel_principal_id?: string;
    }) => {
      const { data: projeto, error } = await supabase
        .from("projetos")
        .insert([{
          ...data,
          status: "ativo",
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
    onError: (error: any) => {
      toast({
        title: "Erro ao criar projeto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProjeto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      nome?: string;
      descricao?: string;
      responsavel_principal_id?: string;
      status?: Projeto["status"];
      data_conclusao?: string;
    }) => {
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
    onError: (error: any) => {
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

export function useTemplatesOnboarding() {
  return useQuery({
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

      return data.map((t): TemplateOnboarding => ({
        id: t.id,
        servico_id: t.servico_id,
        nome: t.nome,
        ativo: t.ativo ?? true,
        created_at: t.created_at,
        servico_nome: t.servico?.nome,
        tarefas_count: t.tarefas?.length || 0,
        duracao_estimada: t.tarefas?.reduce((max: number, tarefa: any) => 
          Math.max(max, tarefa.prazo_dias || 0), 0) || 0,
      }));
    },
  });
}

export function useTemplateTarefas(templateId: string) {
  return useQuery({
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

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ativo,
    }: {
      id: string;
      ativo: boolean;
    }) => {
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

  return useMutation({
    mutationFn: async (data: Omit<TemplateTarefa, "id">) => {
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

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<TemplateTarefa> & { id: string }) => {
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

  return useMutation({
    mutationFn: async (id: string) => {
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

export function useDispararOnboarding() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      clienteId,
      clienteNome,
      servicoId,
      responsavelId,
      clienteServicoId,
    }: {
      clienteId: string;
      clienteNome: string;
      servicoId: string;
      responsavelId: string;
      clienteServicoId?: string;
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
        .single();

      if (templateError || !template) {
        console.log("Nenhum template ativo para este serviço");
        return null;
      }

      // 2. Criar projeto
      const { data: projeto, error: projetoError } = await supabase
        .from("projetos")
        .insert([{
          cliente_id: clienteId,
          cliente_servico_id: clienteServicoId,
          nome: `Onboarding ${template.nome} - ${clienteNome}`,
          responsavel_principal_id: responsavelId,
          status: "ativo",
        }])
        .select()
        .single();

      if (projetoError) throw projetoError;

      // 3. Buscar etapa padrão (Backlog)
      const { data: etapaPadrao } = await supabase
        .from("etapas_kanban")
        .select("id")
        .eq("is_default", true)
        .single();

      if (!etapaPadrao) {
        const { data: primeiraEtapa } = await supabase
          .from("etapas_kanban")
          .select("id")
          .order("ordem", { ascending: true })
          .limit(1)
          .single();
        
        if (!primeiraEtapa) throw new Error("Nenhuma etapa kanban encontrada");
        etapaPadrao.id = primeiraEtapa.id;
      }

      // 4. Criar tarefas do template
      const dataAtivacao = new Date();
      const tarefas = template.tarefas || [];

      for (const tarefaTemplate of tarefas) {
        const dataVencimento = tarefaTemplate.prazo_dias
          ? addDays(dataAtivacao, tarefaTemplate.prazo_dias)
          : null;

        await supabase.from("tarefas").insert([{
          projeto_id: projeto.id,
          cliente_id: clienteId,
          etapa_id: etapaPadrao.id,
          titulo: tarefaTemplate.titulo,
          descricao: tarefaTemplate.descricao,
          responsavel_id: responsavelId,
          data_vencimento: dataVencimento?.toISOString(),
          prioridade: "media",
          created_by_id: user.id,
        }]);
      }

      // 5. Registrar na timeline do cliente
      await supabase.from("cliente_timeline").insert([{
        cliente_id: clienteId,
        tipo: "servico_adicionado",
        descricao: `Onboarding iniciado: ${template.nome}`,
        realizado_por_id: user.id,
      }]);

      return projeto;
    },
    onSuccess: (projeto) => {
      if (projeto) {
        queryClient.invalidateQueries({ queryKey: ["projetos"] });
        queryClient.invalidateQueries({ queryKey: ["tarefas"] });
        queryClient.invalidateQueries({ queryKey: ["cliente-timeline"] });
        toast({
          title: "Onboarding iniciado",
          description: `Projeto criado com as tarefas do template`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao disparar onboarding",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
