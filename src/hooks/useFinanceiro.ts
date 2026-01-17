import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "@/hooks/use-toast";

// Types
export interface Cobranca {
  id: string;
  cliente_id: string;
  asaas_payment_id: string | null;
  tipo: "recorrente" | "avulsa";
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: "pendente" | "pago" | "atrasado" | "cancelado" | "falhou";
  forma_pagamento: "boleto" | "pix" | "cartao" | null;
  url_boleto: string | null;
  url_pix: string | null;
  linha_digitavel: string | null;
  pix_copia_cola: string | null;
  tentativas: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  cliente?: {
    razao_social: string;
    nome_fantasia: string | null;
  };
}

export interface Comissao {
  id: string;
  cliente_id: string;
  cobranca_id: string | null;
  colaborador_id: string;
  tipo_colaborador: "sdr" | "closer";
  valor: number;
  percentual: number | null;
  status: "pendente" | "aprovada" | "paga" | "cancelada";
  data_referencia: string;
  data_pagamento: string | null;
  observacoes: string | null;
  aprovado_por_id: string | null;
  created_at: string;
  updated_at: string;
  cliente?: {
    razao_social: string;
    nome_fantasia: string | null;
  };
  colaborador?: {
    nome: string;
    cargo: string | null;
  };
}

export interface CustoFixo {
  id: string;
  nome: string;
  categoria: "ferramenta" | "pessoal" | "infraestrutura" | "midia" | "freelancer" | "outros";
  valor: number;
  recorrente: boolean;
  dia_vencimento: number | null;
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustoVariavel {
  id: string;
  cliente_id: string | null;
  nome: string;
  categoria: "ferramenta" | "pessoal" | "infraestrutura" | "midia" | "freelancer" | "outros";
  valor: number;
  data_referencia: string;
  observacoes: string | null;
  lancado_por_id: string;
  created_at: string;
  cliente?: {
    razao_social: string;
    nome_fantasia: string | null;
  };
}

export interface ResumoFinanceiro {
  receita: number;
  despesa: number;
  lucro: number;
  inadimplencia: number;
  clientesInadimplentes: number;
}

// Fetch Cobrancas
export function useCobrancas(filters?: { 
  status?: string; 
  formaPagamento?: string; 
  clienteId?: string;
  mes?: number;
  ano?: number;
}) {
  return useQuery({
    queryKey: ["cobrancas", filters],
    queryFn: async () => {
      let query = supabase
        .from("cobrancas")
        .select(`
          *,
          cliente:clientes(razao_social, nome_fantasia)
        `)
        .order("data_vencimento", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status as "pendente" | "pago" | "atrasado" | "cancelado" | "falhou");
      }
      if (filters?.formaPagamento) {
        query = query.eq("forma_pagamento", filters.formaPagamento as "boleto" | "pix" | "cartao");
      }
      if (filters?.clienteId) {
        query = query.eq("cliente_id", filters.clienteId);
      }
      if (filters?.mes && filters?.ano) {
        const startDate = new Date(filters.ano, filters.mes - 1, 1);
        const endDate = new Date(filters.ano, filters.mes, 0);
        query = query
          .gte("data_vencimento", startDate.toISOString().split("T")[0])
          .lte("data_vencimento", endDate.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Cobranca[];
    },
  });
}

// Fetch Comissoes
export function useComissoes(filters?: {
  status?: string;
  colaboradorId?: string;
  mes?: number;
  ano?: number;
}) {
  return useQuery({
    queryKey: ["comissoes", filters],
    queryFn: async () => {
      let query = supabase
        .from("comissoes")
        .select(`
          *,
          cliente:clientes(razao_social, nome_fantasia),
          colaborador:profiles!comissoes_colaborador_id_fkey(nome, cargo)
        `)
        .order("data_referencia", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status as "pendente" | "aprovada" | "paga" | "cancelada");
      }
      if (filters?.colaboradorId) {
        query = query.eq("colaborador_id", filters.colaboradorId);
      }
      if (filters?.mes && filters?.ano) {
        const startDate = new Date(filters.ano, filters.mes - 1, 1);
        const endDate = new Date(filters.ano, filters.mes, 0);
        query = query
          .gte("data_referencia", startDate.toISOString().split("T")[0])
          .lte("data_referencia", endDate.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Comissao[];
    },
  });
}

// Minhas Comissões (for SDR/Closer)
export function useMinhasComissoes() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["minhas-comissoes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("comissoes")
        .select(`
          *,
          cliente:clientes(razao_social, nome_fantasia)
        `)
        .eq("colaborador_id", user.id)
        .order("data_referencia", { ascending: false });

      if (error) throw error;
      return data as Comissao[];
    },
    enabled: !!user?.id,
  });
}

// Fetch Custos Fixos
export function useCustosFixos() {
  return useQuery({
    queryKey: ["custos-fixos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custos_fixos")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as CustoFixo[];
    },
  });
}

// Fetch Custos Variáveis
export function useCustosVariaveis(filters?: { mes?: number; ano?: number; clienteId?: string }) {
  return useQuery({
    queryKey: ["custos-variaveis", filters],
    queryFn: async () => {
      let query = supabase
        .from("custos_variaveis")
        .select(`
          *,
          cliente:clientes(razao_social, nome_fantasia)
        `)
        .order("data_referencia", { ascending: false });

      if (filters?.clienteId) {
        query = query.eq("cliente_id", filters.clienteId);
      }
      if (filters?.mes && filters?.ano) {
        const startDate = new Date(filters.ano, filters.mes - 1, 1);
        const endDate = new Date(filters.ano, filters.mes, 0);
        query = query
          .gte("data_referencia", startDate.toISOString().split("T")[0])
          .lte("data_referencia", endDate.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CustoVariavel[];
    },
  });
}

// Resumo Financeiro do Período
export function useResumoFinanceiro(mes: number, ano: number) {
  return useQuery({
    queryKey: ["resumo-financeiro", mes, ano],
    queryFn: async () => {
      const startDate = new Date(ano, mes - 1, 1);
      const endDate = new Date(ano, mes, 0);
      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      // Get paid cobrancas (receita)
      const { data: cobrancasPagas } = await supabase
        .from("cobrancas")
        .select("valor")
        .eq("status", "pago")
        .gte("data_pagamento", startStr)
        .lte("data_pagamento", endStr);

      const receita = cobrancasPagas?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;

      // Get custos fixos ativos
      const { data: custosFixos } = await supabase
        .from("custos_fixos")
        .select("valor")
        .eq("ativo", true);

      const totalCustosFixos = custosFixos?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;

      // Get custos variáveis do período
      const { data: custosVariaveis } = await supabase
        .from("custos_variaveis")
        .select("valor")
        .gte("data_referencia", startStr)
        .lte("data_referencia", endStr);

      const totalCustosVariaveis = custosVariaveis?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;

      // Get inadimplência do período (cobranças vencidas no período com status atrasado ou falhou)
      const { data: cobrancasInadimplentes } = await supabase
        .from("cobrancas")
        .select("valor, cliente_id")
        .in("status", ["atrasado", "falhou"])
        .gte("data_vencimento", startStr)
        .lte("data_vencimento", endStr);

      const inadimplencia = cobrancasInadimplentes?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;
      const clientesInadimplentes = new Set(cobrancasInadimplentes?.map(c => c.cliente_id)).size;

      const despesa = totalCustosFixos + totalCustosVariaveis;
      const lucro = receita - despesa;

      return {
        receita,
        despesa,
        lucro,
        inadimplencia,
        clientesInadimplentes,
      } as ResumoFinanceiro;
    },
  });
}

// Mutations
export function useAprovarComissoes() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("comissoes")
        .update({ 
          status: "aprovada",
          aprovado_por_id: user?.id 
        })
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comissoes"] });
      toast({
        title: "Comissões aprovadas",
        description: "As comissões selecionadas foram aprovadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar as comissões.",
        variant: "destructive",
      });
    },
  });
}

export function useMarcarComissoesPagas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("comissoes")
        .update({ 
          status: "paga",
          data_pagamento: new Date().toISOString().split("T")[0]
        })
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comissoes"] });
      toast({
        title: "Comissões pagas",
        description: "As comissões selecionadas foram marcadas como pagas.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as comissões.",
        variant: "destructive",
      });
    },
  });
}

export function useCreateCustoFixo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<CustoFixo, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("custos_fixos").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custos-fixos"] });
      toast({ title: "Custo fixo criado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao criar custo fixo", variant: "destructive" });
    },
  });
}

export function useCreateCustoVariavel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<CustoVariavel, "id" | "created_at" | "lancado_por_id" | "cliente">) => {
      const { error } = await supabase.from("custos_variaveis").insert({
        ...data,
        lancado_por_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custos-variaveis"] });
      toast({ title: "Custo variável lançado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao lançar custo variável", variant: "destructive" });
    },
  });
}
