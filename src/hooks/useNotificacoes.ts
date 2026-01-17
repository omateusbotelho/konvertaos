import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Notificacao {
  id: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  dados: Record<string, unknown> | null;
  lida: boolean;
  lida_em: string | null;
  created_at: string;
}

export function useNotificacoes(options?: { apenasNaoLidas?: boolean; limite?: number }) {
  const { user } = useAuth();
  const { apenasNaoLidas = false, limite = 50 } = options || {};

  return useQuery({
    queryKey: ["notificacoes", user?.id, apenasNaoLidas, limite],
    queryFn: async () => {
      let query = supabase
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limite);

      if (apenasNaoLidas) {
        query = query.eq("lida", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Notificacao[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Atualiza a cada 30s
  });
}

export function useNotificacoesNaoLidas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notificacoes", "nao-lidas-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notificacoes")
        .select("*", { count: "exact", head: true })
        .eq("lida", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}

export function useMarcarComoLida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificacaoId: string) => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq("id", notificacaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}

export function useMarcarTodasComoLidas() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq("usuario_id", user?.id)
        .eq("lida", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}
