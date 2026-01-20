import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

// Types
export interface Reuniao {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: 'weekly' | '1:1' | 'projeto' | 'cliente' | 'outro';
  data_inicio: string;
  data_fim: string;
  local: string | null;
  organizador_id: string;
  projeto_id: string | null;
  cliente_id: string | null;
  lead_id: string | null;
  recorrente: boolean;
  recorrencia_config: Record<string, unknown> | null;
  status: 'agendada' | 'realizada' | 'cancelada';
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
  tipo: 'ferias' | 'ausencia';
  data_inicio: string;
  data_fim: string;
  motivo: string | null;
  status: 'pendente' | 'aprovada' | 'recusada';
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
}

// Hooks para Reuniões
export function useReunioes(filters: CalendarioFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reunioes', filters],
    queryFn: async () => {
      let query = supabase
        .from('reunioes')
        .select(`
          *,
          organizador:profiles!reunioes_organizador_id_fkey(id, nome, avatar_url),
          projeto:projetos(id, nome),
          cliente:clientes(id, razao_social, nome_fantasia)
        `)
        .order('data_inicio', { ascending: true });

      if (filters.dataInicio) {
        query = query.gte('data_inicio', filters.dataInicio);
      }
      if (filters.dataFim) {
        query = query.lte('data_inicio', filters.dataFim);
      }
      if (filters.tipo && filters.tipo !== 'todos') {
        query = query.eq('tipo', filters.tipo as 'weekly' | '1:1' | 'projeto' | 'cliente' | 'outro');
      }

      const { data, error } = await query;
      if (error) throw error;

      // If filtering by participant
      if (filters.participanteId || filters.apenasMinhas) {
        const targetId = filters.apenasMinhas ? user?.id : filters.participanteId;
        const { data: participacoes } = await supabase
          .from('reuniao_participantes')
          .select('reuniao_id')
          .eq('participante_id', targetId!);

        const reuniaoIds = new Set([
          ...participacoes?.map(p => p.reuniao_id) || [],
          ...data?.filter(r => r.organizador_id === targetId).map(r => r.id) || []
        ]);

        return (data || []).filter(r => reuniaoIds.has(r.id)) as Reuniao[];
      }

      return data as Reuniao[];
    },
    enabled: !!user,
  });
}

export function useReuniao(reuniaoId: string | null) {
  return useQuery({
    queryKey: ['reuniao', reuniaoId],
    queryFn: async () => {
      if (!reuniaoId) return null;

      const { data, error } = await supabase
        .from('reunioes')
        .select(`
          *,
          organizador:profiles!reunioes_organizador_id_fkey(id, nome, avatar_url),
          projeto:projetos(id, nome),
          cliente:clientes(id, razao_social, nome_fantasia)
        `)
        .eq('id', reuniaoId)
        .single();

      if (error) throw error;
      return data as Reuniao;
    },
    enabled: !!reuniaoId,
  });
}

export function useReuniaoParticipantes(reuniaoId: string | null) {
  return useQuery({
    queryKey: ['reuniao-participantes', reuniaoId],
    queryFn: async () => {
      if (!reuniaoId) return [];

      const { data, error } = await supabase
        .from('reuniao_participantes')
        .select(`
          *,
          participante:profiles(id, nome, avatar_url)
        `)
        .eq('reuniao_id', reuniaoId);

      if (error) throw error;
      return data as ReuniaoParticipante[];
    },
    enabled: !!reuniaoId,
  });
}

export function useReuniaoAta(reuniaoId: string | null) {
  return useQuery({
    queryKey: ['reuniao-ata', reuniaoId],
    queryFn: async () => {
      if (!reuniaoId) return null;

      const { data, error } = await supabase
        .from('reuniao_atas')
        .select(`
          *,
          created_by:profiles(id, nome)
        `)
        .eq('reuniao_id', reuniaoId)
        .maybeSingle();

      if (error) throw error;
      return data as ReuniaoAta | null;
    },
    enabled: !!reuniaoId,
  });
}

export function useCreateReuniao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (dados: {
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
      recorrencia_config?: Record<string, unknown> | null;
      participantes: string[];
    }) => {
      const { participantes, tipo, recorrencia_config, ...reuniaoData } = dados;

      const { data: reuniao, error: reuniaoError } = await supabase
        .from('reunioes')
        .insert([{
          titulo: reuniaoData.titulo,
          descricao: reuniaoData.descricao,
          data_inicio: reuniaoData.data_inicio,
          data_fim: reuniaoData.data_fim,
          local: reuniaoData.local,
          projeto_id: reuniaoData.projeto_id,
          cliente_id: reuniaoData.cliente_id,
          lead_id: reuniaoData.lead_id,
          recorrente: reuniaoData.recorrente,
          recorrencia_config: recorrencia_config as unknown as null,
          tipo: tipo as 'weekly' | '1:1' | 'projeto' | 'cliente' | 'outro',
          organizador_id: user!.id,
        }])
        .select()
        .single();

      if (reuniaoError) throw reuniaoError;

      // Add participants
      if (participantes.length > 0) {
        const participantesData = participantes.map(participante_id => ({
          reuniao_id: reuniao.id,
          participante_id,
        }));

        const { error: partError } = await supabase
          .from('reuniao_participantes')
          .insert(participantesData);

        if (partError) throw partError;
      }

      return reuniao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes'] });
      toast.success('Reunião criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar reunião: ' + error.message);
    },
  });
}

export function useUpdateReuniao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'agendada' | 'realizada' | 'cancelada' }) => {
      const { data, error } = await supabase
        .from('reunioes')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reunioes'] });
      queryClient.invalidateQueries({ queryKey: ['reuniao', data.id] });
      toast.success('Reunião atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar reunião: ' + error.message);
    },
  });
}

export function useConfirmarPresenca() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reuniaoId, confirmado }: { reuniaoId: string; confirmado: boolean }) => {
      const { data, error } = await supabase
        .from('reuniao_participantes')
        .update({ confirmado })
        .eq('reuniao_id', reuniaoId)
        .eq('participante_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { reuniaoId }) => {
      queryClient.invalidateQueries({ queryKey: ['reuniao-participantes', reuniaoId] });
      toast.success('Presença confirmada!');
    },
  });
}

export function useSaveAta() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reuniaoId, conteudo, ataId }: { reuniaoId: string; conteudo: string; ataId?: string }) => {
      if (ataId) {
        const { data, error } = await supabase
          .from('reuniao_atas')
          .update({ conteudo })
          .eq('id', ataId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('reuniao_atas')
          .insert({
            reuniao_id: reuniaoId,
            conteudo,
            created_by_id: user!.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, { reuniaoId }) => {
      queryClient.invalidateQueries({ queryKey: ['reuniao-ata', reuniaoId] });
      toast.success('Ata salva com sucesso!');
    },
  });
}

// Hooks para Ausências
export function useAusencias(filters: { status?: string; colaboradorId?: string } = {}) {
  const { user, role } = useAuth();
  const isAdmin = role?.role === 'admin';

  return useQuery({
    queryKey: ['ausencias', filters],
    queryFn: async () => {
      let query = supabase
        .from('ausencias')
        .select(`
          *,
          colaborador:profiles!ausencias_colaborador_id_fkey(id, nome, avatar_url),
          aprovado_por:profiles!ausencias_aprovado_por_id_fkey(id, nome)
        `)
        .order('data_inicio', { ascending: false });

      if (filters.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status as 'pendente' | 'aprovada' | 'recusada');
      }
      if (filters.colaboradorId) {
        query = query.eq('colaborador_id', filters.colaboradorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Ausencia[];
    },
    enabled: !!user,
  });
}

export function useMinhasAusencias() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['minhas-ausencias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ausencias')
        .select(`
          *,
          aprovado_por:profiles!ausencias_aprovado_por_id_fkey(id, nome)
        `)
        .eq('colaborador_id', user!.id)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      return data as Ausencia[];
    },
    enabled: !!user,
  });
}

export function useCreateAusencia() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (dados: {
      tipo: 'ferias' | 'ausencia';
      data_inicio: string;
      data_fim: string;
      motivo?: string;
    }) => {
      const { data, error } = await supabase
        .from('ausencias')
        .insert({
          ...dados,
          colaborador_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ausencias'] });
      queryClient.invalidateQueries({ queryKey: ['minhas-ausencias'] });
      toast.success('Solicitação de ausência enviada!');
    },
    onError: (error) => {
      toast.error('Erro ao solicitar ausência: ' + error.message);
    },
  });
}

export function useUpdateAusenciaStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status, observacoes }: { id: string; status: 'aprovada' | 'recusada'; observacoes?: string }) => {
      const { data, error } = await supabase
        .from('ausencias')
        .update({
          status,
          observacoes,
          aprovado_por_id: user!.id,
          aprovado_em: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ausencias'] });
      toast.success('Status da ausência atualizado!');
    },
  });
}

// Cores por tipo de reunião
export const coresReuniao: Record<string, string> = {
  weekly: 'bg-blue-500',
  '1:1': 'bg-purple-500',
  projeto: 'bg-green-500',
  cliente: 'bg-orange-500',
  outro: 'bg-gray-500',
};

export const coresReuniaoBorder: Record<string, string> = {
  weekly: 'border-l-blue-500',
  '1:1': 'border-l-purple-500',
  projeto: 'border-l-green-500',
  cliente: 'border-l-orange-500',
  outro: 'border-l-gray-500',
};

export const labelsReuniao: Record<string, string> = {
  weekly: 'Reunião Equipe',
  '1:1': '1:1',
  projeto: 'Projeto',
  cliente: 'Cliente',
  outro: 'Outro',
};
