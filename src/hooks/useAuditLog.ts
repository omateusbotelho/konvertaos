import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  id: string;
  usuario_id: string | null;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  usuario_cargo: string | null;
  usuario_setor: string | null;
  created_at: string;
  usuario?: { nome: string; avatar_url: string | null } | null;
}

export interface AuditLogFilters {
  usuario_id?: string;
  acao?: string;
  entidade?: string;
  usuario_cargo?: string;
  usuario_setor?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export function useAuditLog(filters?: AuditLogFilters, page = 0, pageSize = 20) {
  return useQuery({
    queryKey: ['audit-log', filters, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select(`
          *,
          usuario:profiles!audit_log_usuario_id_fkey(nome, avatar_url)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filters?.usuario_id) {
        query = query.eq('usuario_id', filters.usuario_id);
      }
      if (filters?.acao) {
        query = query.eq('acao', filters.acao);
      }
      if (filters?.entidade) {
        query = query.eq('entidade', filters.entidade);
      }
      if (filters?.usuario_cargo) {
        query = query.eq('usuario_cargo', filters.usuario_cargo);
      }
      if (filters?.usuario_setor) {
        query = query.eq('usuario_setor', filters.usuario_setor);
      }
      if (filters?.dataInicio) {
        query = query.gte('created_at', filters.dataInicio.toISOString());
      }
      if (filters?.dataFim) {
        query = query.lte('created_at', filters.dataFim.toISOString());
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as AuditLogEntry[], totalCount: count || 0 };
    }
  });
}

export function useAuditEntidades() {
  return useQuery({
    queryKey: ['audit-entidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('entidade')
        .limit(100);

      if (error) throw error;
      
      const entidades = [...new Set(data?.map(d => d.entidade) || [])];
      return entidades.sort();
    }
  });
}

export function useAuditUsuarios() {
  return useQuery({
    queryKey: ['audit-usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    }
  });
}

// Hook para listar cargos únicos no audit log (para filtros)
export function useAuditCargos() {
  return useQuery({
    queryKey: ['audit-cargos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('usuario_cargo')
        .not('usuario_cargo', 'is', null)
        .limit(100);

      if (error) throw error;
      
      const cargos = [...new Set(data?.map(d => d.usuario_cargo).filter(Boolean) || [])];
      return cargos.sort() as string[];
    }
  });
}

// Hook para listar setores únicos no audit log (para filtros)
export function useAuditSetores() {
  return useQuery({
    queryKey: ['audit-setores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('usuario_setor')
        .not('usuario_setor', 'is', null)
        .limit(100);

      if (error) throw error;
      
      const setores = [...new Set(data?.map(d => d.usuario_setor).filter(Boolean) || [])];
      return setores.sort() as string[];
    }
  });
}
