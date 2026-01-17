/**
 * Financeiro Service
 * Centralized Supabase data access for financial data
 */

import { supabase } from "@/integrations/supabase/client";

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
  taxaInadimplencia: number;
  clientesInadimplentes: number;
  totalCustosFixos: number;
  totalCustosVariaveis: number;
  cobrancasNoPeriodo: number;
  cobrancasPagas: number;
  cobrancasAtrasadas: number;
}

export interface CobrancasFilters {
  status?: string;
  formaPagamento?: string;
  clienteId?: string;
  mes?: number;
  ano?: number;
}

export interface ComissoesFilters {
  status?: string;
  colaboradorId?: string;
  mes?: number;
  ano?: number;
}

export interface CustosVariaveisFilters {
  mes?: number;
  ano?: number;
  clienteId?: string;
}

// ============= FETCH FUNCTIONS =============

export async function fetchCobrancas(filters?: CobrancasFilters): Promise<Cobranca[]> {
  let query = supabase
    .from("cobrancas")
    .select(`
      *,
      cliente:clientes(razao_social, nome_fantasia)
    `)
    .order("data_vencimento", { ascending: false });

  if (filters?.status) {
    query = query.eq(
      "status",
      filters.status as "pendente" | "pago" | "atrasado" | "cancelado" | "falhou"
    );
  }
  if (filters?.formaPagamento) {
    query = query.eq(
      "forma_pagamento",
      filters.formaPagamento as "boleto" | "pix" | "cartao"
    );
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
}

export async function fetchComissoes(filters?: ComissoesFilters): Promise<Comissao[]> {
  let query = supabase
    .from("comissoes")
    .select(`
      *,
      cliente:clientes(razao_social, nome_fantasia),
      colaborador:profiles!comissoes_colaborador_id_fkey(nome, cargo)
    `)
    .order("data_referencia", { ascending: false });

  if (filters?.status) {
    query = query.eq(
      "status",
      filters.status as "pendente" | "aprovada" | "paga" | "cancelada"
    );
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
}

export async function fetchMinhasComissoes(userId: string): Promise<Comissao[]> {
  const { data, error } = await supabase
    .from("comissoes")
    .select(`
      *,
      cliente:clientes(razao_social, nome_fantasia)
    `)
    .eq("colaborador_id", userId)
    .order("data_referencia", { ascending: false });

  if (error) throw error;
  return data as Comissao[];
}

export async function fetchCustosFixos(): Promise<CustoFixo[]> {
  const { data, error } = await supabase
    .from("custos_fixos")
    .select("*")
    .order("nome");

  if (error) throw error;
  return data as CustoFixo[];
}

export async function fetchCustosVariaveis(
  filters?: CustosVariaveisFilters
): Promise<CustoVariavel[]> {
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
}

export async function fetchResumoFinanceiro(
  mes: number,
  ano: number
): Promise<ResumoFinanceiro> {
  const { data, error } = await supabase.rpc("get_financeiro_summary", {
    mes_ref: mes,
    ano_ref: ano,
  });

  if (error) throw error;

  const result = data?.[0];

  if (!result) {
    return {
      receita: 0,
      despesa: 0,
      lucro: 0,
      inadimplencia: 0,
      taxaInadimplencia: 0,
      clientesInadimplentes: 0,
      totalCustosFixos: 0,
      totalCustosVariaveis: 0,
      cobrancasNoPeriodo: 0,
      cobrancasPagas: 0,
      cobrancasAtrasadas: 0,
    };
  }

  return {
    receita: Number(result.receita) || 0,
    despesa: Number(result.despesa) || 0,
    lucro: Number(result.lucro) || 0,
    inadimplencia: Number(result.inadimplencia) || 0,
    taxaInadimplencia: Number(result.taxa_inadimplencia) || 0,
    clientesInadimplentes: Number(result.clientes_inadimplentes) || 0,
    totalCustosFixos: Number(result.total_custos_fixos) || 0,
    totalCustosVariaveis: Number(result.total_custos_variaveis) || 0,
    cobrancasNoPeriodo: Number(result.cobrancas_no_periodo) || 0,
    cobrancasPagas: Number(result.cobrancas_pagas) || 0,
    cobrancasAtrasadas: Number(result.cobrancas_atrasadas) || 0,
  };
}

// ============= MUTATION FUNCTIONS =============

export async function aprovarComissoes(
  ids: string[],
  aprovadoPorId: string
): Promise<void> {
  const { error } = await supabase
    .from("comissoes")
    .update({
      status: "aprovada",
      aprovado_por_id: aprovadoPorId,
    })
    .in("id", ids);

  if (error) throw error;
}

export async function marcarComissoesPagas(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from("comissoes")
    .update({
      status: "paga",
      data_pagamento: new Date().toISOString().split("T")[0],
    })
    .in("id", ids);

  if (error) throw error;
}

export async function createCustoFixo(
  data: Omit<CustoFixo, "id" | "created_at" | "updated_at">
): Promise<void> {
  const { error } = await supabase.from("custos_fixos").insert(data);
  if (error) throw error;
}

export async function createCustoVariavel(
  data: Omit<CustoVariavel, "id" | "created_at" | "cliente">,
  userId: string
): Promise<void> {
  const { error } = await supabase.from("custos_variaveis").insert({
    ...data,
    lancado_por_id: userId,
  });
  if (error) throw error;
}
