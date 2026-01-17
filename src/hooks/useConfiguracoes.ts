import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConfiguracoesAgencia {
  id: string;
  nome_agencia: string;
  logo_url: string | null;
  favicon_url: string | null;
  fuso_horario: string;
  moeda: string;
  cor_principal: string;
  razao_social: string | null;
  cnpj: string | null;
  endereco: string | null;
  created_at: string;
  updated_at: string;
}

export function useConfiguracoesAgencia() {
  return useQuery({
    queryKey: ['configuracoes-agencia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_agencia')
        .select('*')
        .single();

      if (error) throw error;
      return data as ConfiguracoesAgencia;
    }
  });
}

export function useUpdateConfiguracoes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<ConfiguracoesAgencia, 'id' | 'created_at' | 'updated_at'>>) => {
      const { data: existing } = await supabase
        .from('configuracoes_agencia')
        .select('id')
        .single();

      if (!existing) throw new Error('Configurações não encontradas');

      const { data, error } = await supabase
        .from('configuracoes_agencia')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes-agencia'] });
      toast.success('Configurações salvas com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao salvar configurações: ' + error.message);
    }
  });
}

// Fusos horários comuns
export const FUSOS_HORARIOS = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)' },
  { value: 'America/New_York', label: 'Nova York (GMT-5)' },
  { value: 'Europe/London', label: 'Londres (GMT+0)' },
  { value: 'Europe/Lisbon', label: 'Lisboa (GMT+0)' },
];

// Moedas
export const MOEDAS = [
  { value: 'BRL', label: 'BRL - Real Brasileiro' },
  { value: 'USD', label: 'USD - Dólar Americano' },
  { value: 'EUR', label: 'EUR - Euro' },
];
