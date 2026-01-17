import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { 
  SupabaseError,
  StatusCliente,
  FormaPagamento,
  ModeloCobranca
} from "@/types/supabase-helpers";

export interface Cliente {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj?: string;
  cpf?: string;
  telefone: string;
  email: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  fee_mensal: number;
  modelo_cobranca: ModeloCobranca;
  percentual?: number;
  dia_vencimento?: number;
  forma_pagamento: FormaPagamento;
  status: StatusCliente;
  data_ativacao?: string;
  data_cancelamento?: string;
  motivo_cancelamento?: string;
  lead_id?: string;
  sdr_responsavel_id?: string;
  closer_responsavel_id?: string;
  created_at?: string;
  // Joined data
  sdr_nome?: string;
  closer_nome?: string;
  servicos?: ClienteServico[];
}

export interface ClienteServico {
  id: string;
  cliente_id: string;
  servico_id: string;
  responsavel_id: string;
  valor: number;
  data_inicio?: string;
  data_cancelamento?: string;
  status?: string;
  // Joined
  servico_nome?: string;
  responsavel_nome?: string;
}

export interface UseClientesFilters {
  busca?: string;
  status?: StatusCliente;
  servicoId?: string;
  responsavelId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  feeMin?: number;
  feeMax?: number;
}

// Embedded types for query results
interface EmbeddedProfileNome {
  nome: string;
}

interface EmbeddedServicoNested {
  nome: string;
  setor_responsavel?: string;
}

interface EmbeddedClienteServico {
  id: string;
  servico_id: string;
  responsavel_id: string;
  valor: number;
  data_inicio: string | null;
  data_cancelamento: string | null;
  status: string | null;
  servico: EmbeddedServicoNested | null;
  responsavel: EmbeddedProfileNome | null;
}

interface ClienteQueryResult {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  cpf: string | null;
  telefone: string;
  email: string;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  fee_mensal: number;
  modelo_cobranca: ModeloCobranca | null;
  percentual: number | null;
  dia_vencimento: number | null;
  forma_pagamento: FormaPagamento | null;
  status: StatusCliente | null;
  data_ativacao: string | null;
  data_cancelamento: string | null;
  motivo_cancelamento: string | null;
  lead_id: string | null;
  sdr_responsavel_id: string | null;
  closer_responsavel_id: string | null;
  created_at: string | null;
  sdr: EmbeddedProfileNome | null;
  closer: EmbeddedProfileNome | null;
  cliente_servicos: EmbeddedClienteServico[] | null;
}

export function useClientes(filters: UseClientesFilters = {}) {
  const { user } = useAuth();

  return useQuery<Cliente[], SupabaseError>({
    queryKey: ["clientes", filters],
    queryFn: async () => {
      let query = supabase
        .from("clientes")
        .select(`
          *,
          sdr:profiles!clientes_sdr_responsavel_id_fkey(nome),
          closer:profiles!clientes_closer_responsavel_id_fkey(nome),
          cliente_servicos(
            id,
            servico_id,
            responsavel_id,
            valor,
            data_inicio,
            data_cancelamento,
            status,
            servico:servicos(nome),
            responsavel:profiles(nome)
          )
        `)
        .order("created_at", { ascending: false });

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.busca) {
        query = query.or(
          `razao_social.ilike.%${filters.busca}%,nome_fantasia.ilike.%${filters.busca}%,cnpj.ilike.%${filters.busca}%,email.ilike.%${filters.busca}%`
        );
      }

      if (filters.dataInicio) {
        query = query.gte("data_ativacao", filters.dataInicio.toISOString());
      }

      if (filters.dataFim) {
        query = query.lte("data_ativacao", filters.dataFim.toISOString());
      }

      if (filters.feeMin) {
        query = query.gte("fee_mensal", filters.feeMin);
      }

      if (filters.feeMax) {
        query = query.lte("fee_mensal", filters.feeMax);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data as ClienteQueryResult[]).map((cliente): Cliente => ({
        id: cliente.id,
        razao_social: cliente.razao_social,
        nome_fantasia: cliente.nome_fantasia || undefined,
        cnpj: cliente.cnpj || undefined,
        cpf: cliente.cpf || undefined,
        telefone: cliente.telefone,
        email: cliente.email,
        endereco: cliente.endereco || undefined,
        cidade: cliente.cidade || undefined,
        estado: cliente.estado || undefined,
        cep: cliente.cep || undefined,
        fee_mensal: cliente.fee_mensal,
        modelo_cobranca: cliente.modelo_cobranca || "fee",
        percentual: cliente.percentual || undefined,
        dia_vencimento: cliente.dia_vencimento || undefined,
        forma_pagamento: cliente.forma_pagamento || "pix",
        status: cliente.status || "ativo",
        data_ativacao: cliente.data_ativacao || undefined,
        data_cancelamento: cliente.data_cancelamento || undefined,
        motivo_cancelamento: cliente.motivo_cancelamento || undefined,
        lead_id: cliente.lead_id || undefined,
        sdr_responsavel_id: cliente.sdr_responsavel_id || undefined,
        closer_responsavel_id: cliente.closer_responsavel_id || undefined,
        created_at: cliente.created_at || undefined,
        sdr_nome: cliente.sdr?.nome,
        closer_nome: cliente.closer?.nome,
        servicos: cliente.cliente_servicos?.map((cs) => ({
          id: cs.id,
          cliente_id: cliente.id,
          servico_id: cs.servico_id,
          responsavel_id: cs.responsavel_id,
          valor: cs.valor,
          data_inicio: cs.data_inicio || undefined,
          data_cancelamento: cs.data_cancelamento || undefined,
          status: cs.status || undefined,
          servico_nome: cs.servico?.nome,
          responsavel_nome: cs.responsavel?.nome,
        })) || [],
      }));
    },
    enabled: !!user,
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ["cliente", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select(`
          *,
          sdr:profiles!clientes_sdr_responsavel_id_fkey(id, nome, email),
          closer:profiles!clientes_closer_responsavel_id_fkey(id, nome, email),
          cliente_servicos(
            id,
            servico_id,
            responsavel_id,
            valor,
            data_inicio,
            data_cancelamento,
            status,
            servico:servicos(id, nome, setor_responsavel),
            responsavel:profiles(id, nome)
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      const cliente = data as ClienteQueryResult & {
        sdr: { id: string; nome: string; email: string } | null;
        closer: { id: string; nome: string; email: string } | null;
        cliente_servicos: (EmbeddedClienteServico & {
          servico: { id: string; nome: string; setor_responsavel: string } | null;
          responsavel: { id: string; nome: string } | null;
        })[] | null;
      };

      return {
        ...cliente,
        sdr_nome: cliente.sdr?.nome,
        closer_nome: cliente.closer?.nome,
        servicos: cliente.cliente_servicos?.map((cs) => ({
          id: cs.id,
          cliente_id: cliente.id,
          servico_id: cs.servico_id,
          responsavel_id: cs.responsavel_id,
          valor: cs.valor,
          data_inicio: cs.data_inicio,
          data_cancelamento: cs.data_cancelamento,
          status: cs.status,
          servico_nome: cs.servico?.nome,
          responsavel_nome: cs.responsavel?.nome,
          servico_setor: cs.servico?.setor_responsavel,
        })) || [],
      } as Cliente & { servicos: (ClienteServico & { servico_setor?: string })[] };
    },
    enabled: !!id,
  });
}

interface ClientesStats {
  totalAtivos: number;
  mrr: number;
  inadimplentes: number;
  novosEsteMes: number;
}

export function useClientesStats() {
  return useQuery<ClientesStats, SupabaseError>({
    queryKey: ["clientes-stats"],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all clients for stats
      const { data: clientes, error } = await supabase
        .from("clientes")
        .select("id, status, fee_mensal, data_ativacao");

      if (error) throw error;

      const ativos = clientes?.filter((c) => c.status === "ativo") || [];
      const inadimplentes = clientes?.filter((c) => c.status === "inadimplente") || [];
      const novosEsteMes = clientes?.filter(
        (c) => c.data_ativacao && new Date(c.data_ativacao) >= startOfMonth
      ) || [];

      const mrr = ativos.reduce((sum, c) => sum + (c.fee_mensal || 0), 0);

      return {
        totalAtivos: ativos.length,
        mrr,
        inadimplentes: inadimplentes.length,
        novosEsteMes: novosEsteMes.length,
      };
    },
  });
}

export function useClienteTimeline(clienteId: string) {
  return useQuery({
    queryKey: ["cliente-timeline", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_timeline")
        .select(`
          *,
          realizado_por:profiles(nome)
        `)
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });
}

export function useClienteAcessos(clienteId: string) {
  return useQuery({
    queryKey: ["cliente-acessos", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_acessos")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });
}

export function useClienteArquivos(clienteId: string) {
  return useQuery({
    queryKey: ["cliente-arquivos", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_arquivos")
        .select(`
          *,
          uploaded_por:profiles(nome)
        `)
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });
}

interface CancelarClienteInput {
  clienteId: string;
  motivo: string;
}

export function useCancelarCliente() {
  const queryClient = useQueryClient();

  return useMutation<void, SupabaseError, CancelarClienteInput>({
    mutationFn: async ({ clienteId, motivo }) => {
      // Update client status
      const { error } = await supabase
        .from("clientes")
        .update({
          status: "cancelado",
          data_cancelamento: new Date().toISOString(),
          motivo_cancelamento: motivo,
        })
        .eq("id", clienteId);

      if (error) throw error;

      // Cancel all active services
      await supabase
        .from("cliente_servicos")
        .update({
          status: "cancelado",
          data_cancelamento: new Date().toISOString(),
        })
        .eq("cliente_id", clienteId)
        .eq("status", "ativo");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-stats"] });
    },
  });
}

interface AddClienteServicoInput {
  cliente_id: string;
  servico_id: string;
  responsavel_id: string;
  valor: number;
}

export function useAddClienteServico() {
  const queryClient = useQueryClient();

  return useMutation<void, SupabaseError, AddClienteServicoInput>({
    mutationFn: async (data) => {
      const { error } = await supabase.from("cliente_servicos").insert({
        ...data,
        status: "ativo",
        data_inicio: new Date().toISOString(),
      });

      if (error) throw error;

      // Update client fee
      const { data: servicos } = await supabase
        .from("cliente_servicos")
        .select("valor")
        .eq("cliente_id", data.cliente_id)
        .eq("status", "ativo");

      const newFee = servicos?.reduce((sum, s) => sum + (s.valor || 0), 0) || 0;

      await supabase
        .from("clientes")
        .update({ fee_mensal: newFee })
        .eq("id", data.cliente_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["cliente"] });
    },
  });
}

interface CancelarServicoInput {
  servicoId: string;
  clienteId: string;
}

export function useCancelarServico() {
  const queryClient = useQueryClient();

  return useMutation<void, SupabaseError, CancelarServicoInput>({
    mutationFn: async ({ servicoId, clienteId }) => {
      const { error } = await supabase
        .from("cliente_servicos")
        .update({
          status: "cancelado",
          data_cancelamento: new Date().toISOString(),
        })
        .eq("id", servicoId);

      if (error) throw error;

      // Update client fee
      const { data: servicos } = await supabase
        .from("cliente_servicos")
        .select("valor")
        .eq("cliente_id", clienteId)
        .eq("status", "ativo");

      const newFee = servicos?.reduce((sum, s) => sum + (s.valor || 0), 0) || 0;

      await supabase
        .from("clientes")
        .update({ fee_mensal: newFee })
        .eq("id", clienteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["cliente"] });
    },
  });
}

interface AddClienteAcessoInput {
  cliente_id: string;
  tipo: string;
  usuario?: string;
  senha?: string;
  url?: string;
  observacoes?: string;
}

export function useAddClienteAcesso() {
  const queryClient = useQueryClient();

  return useMutation<void, SupabaseError, AddClienteAcessoInput>({
    mutationFn: async (data) => {
      const { error } = await supabase.from("cliente_acessos").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cliente-acessos"] });
    },
  });
}

export function useDeleteClienteAcesso() {
  const queryClient = useQueryClient();

  return useMutation<void, SupabaseError, string>({
    mutationFn: async (acessoId) => {
      const { error } = await supabase
        .from("cliente_acessos")
        .delete()
        .eq("id", acessoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cliente-acessos"] });
    },
  });
}
