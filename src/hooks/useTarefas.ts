import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
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
  // Joined data
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

export interface RecorrenciaConfig {
  tipo: 'diaria' | 'semanal' | 'mensal';
  intervalo: number;
  diasSemana?: number[];
  diaDoMes?: number;
  dataFim?: string | null;
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
  prazo?: 'atrasadas' | 'hoje' | 'semana' | 'mes' | 'sem_prazo';
}

// Hook para buscar etapas do kanban
export function useEtapasKanban() {
  return useQuery({
    queryKey: ['etapas-kanban'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etapas_kanban')
        .select('*')
        .order('ordem');

      if (error) throw error;
      return data as EtapaKanban[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para buscar tarefas com filtros
export function useTarefas(filters: TarefaFilters = {}) {
  return useQuery({
    queryKey: ['tarefas', filters],
    queryFn: async () => {
      let query = supabase
        .from('tarefas')
        .select(`
          *,
          projeto:projetos(id, nome),
          cliente:clientes(id, nome_fantasia, razao_social),
          responsavel:profiles!tarefas_responsavel_id_fkey(id, nome, avatar_url),
          created_by:profiles!tarefas_created_by_id_fkey(id, nome)
        `)
        .is('tarefa_pai_id', null) // Apenas tarefas principais
        .order('ordem');

      // Aplicar filtros
      if (filters.clienteIds && filters.clienteIds.length > 0) {
        query = query.in('cliente_id', filters.clienteIds);
      }

      if (filters.projetoId) {
        query = query.eq('projeto_id', filters.projetoId);
      }

      if (filters.responsavelIds && filters.responsavelIds.length > 0) {
        query = query.in('responsavel_id', filters.responsavelIds);
      }

      if (filters.prioridades && filters.prioridades.length > 0) {
        query = query.in('prioridade', filters.prioridades as ('baixa' | 'media' | 'alta' | 'urgente')[]);
      }

      if (filters.minhasTarefas) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq('responsavel_id', user.id);
        }
      }

      // Filtro de prazo
      if (filters.prazo) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const hojeISO = hoje.toISOString();

        switch (filters.prazo) {
          case 'atrasadas':
            query = query.lt('data_vencimento', hojeISO).eq('concluida', false);
            break;
          case 'hoje':
            const fimHoje = new Date(hoje);
            fimHoje.setHours(23, 59, 59, 999);
            query = query.gte('data_vencimento', hojeISO).lte('data_vencimento', fimHoje.toISOString());
            break;
          case 'semana':
            const fimSemana = new Date(hoje);
            fimSemana.setDate(fimSemana.getDate() + 7);
            query = query.gte('data_vencimento', hojeISO).lte('data_vencimento', fimSemana.toISOString());
            break;
          case 'mes':
            const fimMes = new Date(hoje);
            fimMes.setMonth(fimMes.getMonth() + 1);
            query = query.gte('data_vencimento', hojeISO).lte('data_vencimento', fimMes.toISOString());
            break;
          case 'sem_prazo':
            query = query.is('data_vencimento', null);
            break;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar contadores para cada tarefa
      const tarefasComContadores = await Promise.all(
        (data || []).map(async (tarefa) => {
          const [comentariosResult, anexosResult, subtarefasResult] = await Promise.all([
            supabase.from('tarefa_comentarios').select('id', { count: 'exact', head: true }).eq('tarefa_id', tarefa.id),
            supabase.from('tarefa_anexos').select('id', { count: 'exact', head: true }).eq('tarefa_id', tarefa.id),
            supabase.from('tarefas').select('id, concluida').eq('tarefa_pai_id', tarefa.id),
          ]);

          const subtarefas = subtarefasResult.data || [];

          return {
            ...tarefa,
            _count: {
              comentarios: comentariosResult.count || 0,
              anexos: anexosResult.count || 0,
              subtarefas: subtarefas.length,
              subtarefas_concluidas: subtarefas.filter(s => s.concluida).length,
            },
          };
        })
      );

      return tarefasComContadores as unknown as Tarefa[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para buscar uma tarefa específica com todos os detalhes
export function useTarefa(tarefaId: string | null) {
  return useQuery({
    queryKey: ['tarefa', tarefaId],
    queryFn: async () => {
      if (!tarefaId) return null;

      const { data, error } = await supabase
        .from('tarefas')
        .select(`
          *,
          projeto:projetos(id, nome),
          cliente:clientes(id, nome_fantasia, razao_social),
          responsavel:profiles!tarefas_responsavel_id_fkey(id, nome, avatar_url),
          created_by:profiles!tarefas_created_by_id_fkey(id, nome)
        `)
        .eq('id', tarefaId)
        .single();

      if (error) throw error;

      // Buscar subtarefas
      const { data: subtarefas } = await supabase
        .from('tarefas')
        .select(`
          *,
          responsavel:profiles!tarefas_responsavel_id_fkey(id, nome, avatar_url)
        `)
        .eq('tarefa_pai_id', tarefaId)
        .order('ordem');

      return {
        ...data,
        subtarefas: subtarefas || [],
      } as unknown as Tarefa;
    },
    enabled: !!tarefaId,
  });
}

// Hook para buscar comentários de uma tarefa
export function useTarefaComentarios(tarefaId: string | null) {
  return useQuery({
    queryKey: ['tarefa-comentarios', tarefaId],
    queryFn: async () => {
      if (!tarefaId) return [];

      const { data, error } = await supabase
        .from('tarefa_comentarios')
        .select(`
          *,
          autor:profiles(id, nome, avatar_url)
        `)
        .eq('tarefa_id', tarefaId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar anexos de cada comentário
      const comentariosComAnexos = await Promise.all(
        (data || []).map(async (comentario) => {
          const { data: anexos } = await supabase
            .from('tarefa_comentario_anexos')
            .select('*')
            .eq('comentario_id', comentario.id);

          return {
            ...comentario,
            anexos: anexos || [],
          };
        })
      );

      return comentariosComAnexos as TarefaComentario[];
    },
    enabled: !!tarefaId,
  });
}

// Hook para buscar anexos de uma tarefa
export function useTarefaAnexos(tarefaId: string | null) {
  return useQuery({
    queryKey: ['tarefa-anexos', tarefaId],
    queryFn: async () => {
      if (!tarefaId) return [];

      const { data, error } = await supabase
        .from('tarefa_anexos')
        .select('*')
        .eq('tarefa_id', tarefaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TarefaAnexo[];
    },
    enabled: !!tarefaId,
  });
}

// Hook para buscar histórico de uma tarefa
export function useTarefaHistorico(tarefaId: string | null) {
  return useQuery({
    queryKey: ['tarefa-historico', tarefaId],
    queryFn: async () => {
      if (!tarefaId) return [];

      const { data, error } = await supabase
        .from('tarefa_historico')
        .select(`
          *,
          realizado_por:profiles(id, nome)
        `)
        .eq('tarefa_id', tarefaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TarefaHistorico[];
    },
    enabled: !!tarefaId,
  });
}

// Hook para criar tarefa
export function useCreateTarefa() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      projeto_id: string;
      cliente_id: string;
      etapa_id: string;
      titulo: string;
      descricao?: string;
      responsavel_id?: string;
      prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
      data_vencimento?: string;
      recorrente?: boolean;
      recorrencia_config?: RecorrenciaConfig;
      tarefa_pai_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

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
        recorrencia_config: data.recorrencia_config as unknown as Record<string, unknown>,
        tarefa_pai_id: data.tarefa_pai_id,
        created_by_id: user.id,
      };

      const { data: tarefa, error } = await supabase
        .from('tarefas')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      await supabase.from('tarefa_historico').insert({
        tarefa_id: tarefa.id,
        tipo: 'criada',
        descricao: 'Tarefa criada',
        realizado_por_id: user.id,
      });

      return tarefa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast({
        title: 'Tarefa criada',
        description: 'A tarefa foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar tarefa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para atualizar tarefa
export function useUpdateTarefa() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Tarefa> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.titulo !== undefined) updateData.titulo = data.titulo;
      if (data.descricao !== undefined) updateData.descricao = data.descricao;
      if (data.projeto_id !== undefined) updateData.projeto_id = data.projeto_id;
      if (data.cliente_id !== undefined) updateData.cliente_id = data.cliente_id;
      if (data.etapa_id !== undefined) updateData.etapa_id = data.etapa_id;
      if (data.responsavel_id !== undefined) updateData.responsavel_id = data.responsavel_id;
      if (data.prioridade !== undefined) updateData.prioridade = data.prioridade;
      if (data.data_vencimento !== undefined) updateData.data_vencimento = data.data_vencimento;
      if (data.recorrente !== undefined) updateData.recorrente = data.recorrente;
      if (data.recorrencia_config !== undefined) updateData.recorrencia_config = data.recorrencia_config;
      if (data.concluida !== undefined) updateData.concluida = data.concluida;

      const { data: tarefa, error } = await supabase
        .from('tarefas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return tarefa;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      queryClient.invalidateQueries({ queryKey: ['tarefa', variables.id] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar tarefa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para mover tarefa (drag and drop)
export function useMoveTarefa() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      tarefaId, 
      etapaId, 
      ordem,
      concluir,
    }: { 
      tarefaId: string; 
      etapaId: string; 
      ordem: number;
      concluir?: boolean;
    }) => {
      const updateData: Record<string, unknown> = {
        etapa_id: etapaId,
        ordem,
      };

      if (concluir !== undefined) {
        updateData.concluida = concluir;
        if (concluir) {
          updateData.concluida_em = new Date().toISOString();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) updateData.concluida_por_id = user.id;
        } else {
          updateData.concluida_em = null;
          updateData.concluida_por_id = null;
        }
      }

      const { error } = await supabase
        .from('tarefas')
        .update(updateData)
        .eq('id', tarefaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao mover tarefa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para adicionar comentário
export function useAddComentario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      tarefaId, 
      conteudo,
      mencoes,
    }: { 
      tarefaId: string; 
      conteudo: string;
      mencoes?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: comentario, error } = await supabase
        .from('tarefa_comentarios')
        .insert({
          tarefa_id: tarefaId,
          autor_id: user.id,
          conteudo,
        })
        .select()
        .single();

      if (error) throw error;

      // Criar menções
      if (mencoes && mencoes.length > 0) {
        await supabase.from('tarefa_mencoes').insert(
          mencoes.map(userId => ({
            comentario_id: comentario.id,
            usuario_mencionado_id: userId,
          }))
        );
      }

      return comentario;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tarefa-comentarios', variables.tarefaId] });
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar comentário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para toggle subtarefa
export function useToggleSubtarefa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, concluida }: { id: string; concluida: boolean }) => {
      const updateData: Record<string, unknown> = { concluida };
      
      if (concluida) {
        updateData.concluida_em = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) updateData.concluida_por_id = user.id;
      } else {
        updateData.concluida_em = null;
        updateData.concluida_por_id = null;
      }

      const { error } = await supabase
        .from('tarefas')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      queryClient.invalidateQueries({ queryKey: ['tarefa'] });
    },
  });
}

// Hook para criar subtarefa
export function useCreateSubtarefa() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      tarefaPaiId,
      titulo,
      responsavel_id,
    }: { 
      tarefaPaiId: string;
      titulo: string;
      responsavel_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar tarefa pai para herdar projeto e cliente
      const { data: tarefaPai } = await supabase
        .from('tarefas')
        .select('projeto_id, cliente_id, etapa_id')
        .eq('id', tarefaPaiId)
        .single();

      if (!tarefaPai) throw new Error('Tarefa pai não encontrada');

      const { data: subtarefa, error } = await supabase
        .from('tarefas')
        .insert({
          projeto_id: tarefaPai.projeto_id,
          cliente_id: tarefaPai.cliente_id,
          etapa_id: tarefaPai.etapa_id,
          tarefa_pai_id: tarefaPaiId,
          titulo,
          responsavel_id,
          created_by_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return subtarefa;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tarefa', variables.tarefaPaiId] });
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar subtarefa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para deletar tarefa
export function useDeleteTarefa() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tarefaId: string) => {
      const { error } = await supabase
        .from('tarefas')
        .delete()
        .eq('id', tarefaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast({
        title: 'Tarefa excluída',
        description: 'A tarefa foi excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir tarefa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Função utilitária para gerar cor única por cliente
export function gerarCorCliente(clienteId: string): string {
  const cores = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ];
  
  // Hash simples do ID para escolher cor consistente
  let hash = 0;
  for (let i = 0; i < clienteId.length; i++) {
    hash = clienteId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return cores[Math.abs(hash) % cores.length];
}

// Cores de prioridade
export const coresPrioridade = {
  baixa: '#64748B',
  media: '#3B82F6',
  alta: '#F59E0B',
  urgente: '#EF4444',
};
