import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type StatusContrato = 'rascunho' | 'enviado' | 'assinado' | 'cancelado';

export interface Contrato {
  id: string;
  cliente_id: string;
  titulo: string;
  conteudo: string;
  valor: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  status: StatusContrato;
  assinado_em: string | null;
  assinado_por: string | null;
  url_pdf: string | null;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
  cliente?: {
    id: string;
    razao_social: string;
    nome_fantasia: string | null;
    email: string;
  };
  created_by?: {
    id: string;
    nome: string;
  };
}

export interface ContratoTemplate {
  id: string;
  nome: string;
  conteudo: string;
  variaveis: string[];
  ativo: boolean;
  created_at: string;
}

export interface ContratoFilters {
  status?: StatusContrato | 'todos';
  cliente_id?: string;
  data_inicio?: string;
  data_fim?: string;
}

export function useContratos(filters: ContratoFilters = {}) {
  return useQuery({
    queryKey: ['contratos', filters],
    queryFn: async () => {
      let query = supabase
        .from('contratos')
        .select(`
          *,
          cliente:clientes(id, razao_social, nome_fantasia, email),
          created_by:profiles!contratos_created_by_id_fkey(id, nome)
        `)
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status);
      }

      if (filters.cliente_id) {
        query = query.eq('cliente_id', filters.cliente_id);
      }

      if (filters.data_inicio) {
        query = query.gte('data_inicio', filters.data_inicio);
      }

      if (filters.data_fim) {
        query = query.lte('data_fim', filters.data_fim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Contrato[];
    },
  });
}

export function useContrato(id: string | null) {
  return useQuery({
    queryKey: ['contrato', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('contratos')
        .select(`
          *,
          cliente:clientes(id, razao_social, nome_fantasia, email, telefone, cnpj, cpf, endereco, cidade, estado, cep),
          created_by:profiles!contratos_created_by_id_fkey(id, nome)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Contrato;
    },
    enabled: !!id,
  });
}

export function useContratoTemplates() {
  return useQuery({
    queryKey: ['contrato-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contrato_templates')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data as ContratoTemplate[];
    },
  });
}

export function useCreateContrato() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (contrato: {
      cliente_id: string;
      titulo: string;
      conteudo: string;
      valor?: number;
      data_inicio?: string;
      data_fim?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('contratos')
        .insert({
          ...contrato,
          created_by_id: user?.id,
          status: 'rascunho',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast({
        title: 'Contrato criado',
        description: 'O contrato foi criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar contrato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateContrato() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      titulo?: string;
      conteudo?: string;
      valor?: number;
      data_inicio?: string;
      data_fim?: string;
      status?: StatusContrato;
      assinado_em?: string;
      assinado_por?: string;
      url_pdf?: string;
    }) => {
      const { data, error } = await supabase
        .from('contratos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['contrato'] });
      toast({
        title: 'Contrato atualizado',
        description: 'O contrato foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar contrato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useEnviarContrato() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('contratos')
        .update({ status: 'enviado' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['contrato'] });
      toast({
        title: 'Contrato enviado',
        description: 'O contrato foi marcado como enviado para assinatura.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar contrato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAssinarContrato() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, assinado_por }: { id: string; assinado_por: string }) => {
      const { data, error } = await supabase
        .from('contratos')
        .update({
          status: 'assinado',
          assinado_em: new Date().toISOString(),
          assinado_por,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['contrato'] });
      toast({
        title: 'Contrato assinado',
        description: 'O contrato foi marcado como assinado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao marcar assinatura',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCancelarContrato() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('contratos')
        .update({ status: 'cancelado' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['contrato'] });
      toast({
        title: 'Contrato cancelado',
        description: 'O contrato foi cancelado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao cancelar contrato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export const statusContratoConfig: Record<StatusContrato, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'bg-muted text-muted-foreground' },
  enviado: { label: 'Enviado', color: 'bg-warning/20 text-warning' },
  assinado: { label: 'Assinado', color: 'bg-success/20 text-success' },
  cancelado: { label: 'Cancelado', color: 'bg-destructive/20 text-destructive' },
};
