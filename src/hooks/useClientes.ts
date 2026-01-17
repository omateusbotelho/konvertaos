import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

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
  modelo_cobranca: "fee" | "fee_percentual" | "avulso";
  percentual?: number;
  dia_vencimento?: number;
  forma_pagamento: "boleto" | "pix" | "cartao";
  status: "ativo" | "inadimplente" | "cancelado";
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
  status?: "ativo" | "inadimplente" | "cancelado";
  servicoId?: string;
  responsavelId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  feeMin?: number;
  feeMax?: number;
}

export function useClientes(filters: UseClientesFilters = {}) {
  const { user } = useAuth();

  return useQuery({
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

      return data.map((cliente): Cliente => ({
        ...cliente,
        sdr_nome: cliente.sdr?.nome,
        closer_nome: cliente.closer?.nome,
        servicos: cliente.cliente_servicos?.map((cs: any) => ({
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

      return {
        ...data,
        sdr_nome: data.sdr?.nome,
        closer_nome: data.closer?.nome,
        servicos: data.cliente_servicos?.map((cs: any) => ({
          id: cs.id,
          cliente_id: data.id,
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

export function useClientesStats() {
  return useQuery({
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

export function useCancelarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clienteId,
      motivo,
    }: {
      clienteId: string;
      motivo: string;
    }) => {
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

export function useAddClienteServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      cliente_id: string;
      servico_id: string;
      responsavel_id: string;
      valor: number;
    }) => {
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

export function useCancelarServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      servicoId,
      clienteId,
    }: {
      servicoId: string;
      clienteId: string;
    }) => {
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

export function useAddClienteAcesso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      cliente_id: string;
      tipo: string;
      usuario?: string;
      senha?: string;
      url?: string;
      observacoes?: string;
    }) => {
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

  return useMutation({
    mutationFn: async (acessoId: string) => {
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
