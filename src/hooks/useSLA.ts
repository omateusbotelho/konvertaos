import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SLAConfig {
  id: string;
  servico_id: string | null;
  cliente_id: string | null;
  nome: string;
  tempo_horas: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  servico?: { nome: string } | null;
  cliente?: { razao_social: string; nome_fantasia: string | null } | null;
}

export function useSLAConfigs() {
  return useQuery({
    queryKey: ['sla-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sla_config')
        .select(`
          *,
          servico:servicos(nome),
          cliente:clientes(razao_social, nome_fantasia)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as SLAConfig[];
    }
  });
}

export function useCreateSLA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sla: {
      nome: string;
      tempo_horas: number;
      servico_id?: string | null;
      cliente_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('sla_config')
        .insert(sla)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-configs'] });
      toast.success('SLA criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar SLA: ' + error.message);
    }
  });
}

export function useUpdateSLA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      nome?: string;
      tempo_horas?: number;
      ativo?: boolean;
      servico_id?: string | null;
      cliente_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('sla_config')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-configs'] });
      toast.success('SLA atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar SLA: ' + error.message);
    }
  });
}

export function useDeleteSLA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sla_config')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-configs'] });
      toast.success('SLA excluído com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir SLA: ' + error.message);
    }
  });
}
