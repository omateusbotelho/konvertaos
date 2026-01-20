import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, subHours } from "date-fns";
import { ListItem } from "@/components/dashboard/ListWidget";
import { AlertItem } from "@/components/dashboard/AlertWidget";
import { ChartDataPoint } from "@/components/dashboard/ChartWidget";

// ============= Tipos base =============
interface StatData {
  valor: number;
  variacao?: number;
  prefix?: string;
  suffix?: string;
}

// ============= Dashboard Data Types =============
export interface AdminDashboardData {
  receitaMes: StatData;
  leadsNovos: StatData;
  tarefasAtrasadas: StatData;
  inadimplencia: StatData;
  churnMes: StatData;
  clientesAtivos: StatData;
  reunioesHoje: ListItem[];
  aprovacoesPendentes: ListItem[];
  alertasCriticos: AlertItem[];
}

export interface SDRDashboardData {
  meusLeads: StatData;
  followupsHoje: StatData;
  agendamentosMes: StatData;
  leadsSemAtividade: ListItem[];
  leadsFrios: ListItem[];
  metaAgendamentos: { current: number; target: number };
}

export interface WinRateByOrigem {
  origem: string;
  total: number;
  ganhos: number;
  taxa: number;
}

export interface CloserDashboardData {
  reunioesHoje: StatData;
  propostasPendentes: StatData;
  fechamentosMes: StatData;
  comissaoAcumulada: StatData;
  // Métricas avançadas
  taxaConversao: StatData;
  ticketMedio: StatData;
  tempoCicloMedio: StatData;
  forecastMensal: StatData;
  winRatePorOrigem: WinRateByOrigem[];
  evolucaoMensal: ChartDataPoint[];
  propostasSemResposta: ListItem[];
  proximasReunioes: ListItem[];
}

export interface OperacionalDashboardData {
  meusClientes: StatData;
  tarefasPendentes: StatData;
  tarefasAtrasadas: StatData;
  onboardings: ListItem[];
  tarefasVencendoHoje: ListItem[];
  entregasMes: { current: number; target: number };
}

export interface FinanceiroDashboardData {
  cobrancasHoje: StatData;
  inadimplentes: StatData;
  comissoesAPagar: StatData;
  lucroMes: StatData;
  receitaVsDespesas: ChartDataPoint[];
  cobrancasFalhadas: ListItem[];
}

// ============= Helpers =============
function calcVariacao(atual: number, anterior: number): number {
  if (anterior === 0) return atual > 0 ? 100 : 0;
  return Math.round(((atual - anterior) / anterior) * 100 * 10) / 10;
}

function getMonthRange(date: Date = new Date()) {
  return {
    start: startOfMonth(date).toISOString(),
    end: endOfMonth(date).toISOString(),
  };
}

function getTodayRange() {
  const now = new Date();
  return {
    start: startOfDay(now).toISOString(),
    end: endOfDay(now).toISOString(),
  };
}

// ============= Admin Dashboard =============
export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const now = new Date();
  const mesAtual = getMonthRange(now);
  const mesAnterior = getMonthRange(subMonths(now, 1));
  const hoje = getTodayRange();

  // Parallel queries for stats
  const [
    receitaMesAtual,
    receitaMesAnterior,
    leadsNovosAtual,
    leadsNovosAnterior,
    tarefasAtrasadas,
    inadimplenciaAtual,
    inadimplenciaAnterior,
    churnMesAtual,
    churnMesAnterior,
    clientesAtivosAtual,
    clientesAtivosAnterior,
    reunioesHoje,
    aprovacoesPendentes,
    cobrancasFalhadas,
    detratoresNPS,
    slaEstourados,
  ] = await Promise.all([
    // Receita mês atual
    supabase
      .from("cobrancas")
      .select("valor")
      .eq("status", "pago")
      .gte("data_pagamento", mesAtual.start)
      .lte("data_pagamento", mesAtual.end),
    // Receita mês anterior
    supabase
      .from("cobrancas")
      .select("valor")
      .eq("status", "pago")
      .gte("data_pagamento", mesAnterior.start)
      .lte("data_pagamento", mesAnterior.end),
    // Leads novos mês atual
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", mesAtual.start)
      .lte("created_at", mesAtual.end),
    // Leads novos mês anterior
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", mesAnterior.start)
      .lte("created_at", mesAnterior.end),
    // Tarefas atrasadas
    supabase
      .from("tarefas")
      .select("id", { count: "exact", head: true })
      .eq("concluida", false)
      .lt("data_vencimento", now.toISOString()),
    // Inadimplência atual
    supabase
      .from("cobrancas")
      .select("valor")
      .in("status", ["atrasado", "falhou"])
      .gte("data_vencimento", mesAtual.start)
      .lte("data_vencimento", mesAtual.end),
    // Inadimplência anterior
    supabase
      .from("cobrancas")
      .select("valor")
      .in("status", ["atrasado", "falhou"])
      .gte("data_vencimento", mesAnterior.start)
      .lte("data_vencimento", mesAnterior.end),
    // Churn mês atual
    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelado")
      .gte("data_cancelamento", mesAtual.start)
      .lte("data_cancelamento", mesAtual.end),
    // Churn mês anterior
    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelado")
      .gte("data_cancelamento", mesAnterior.start)
      .lte("data_cancelamento", mesAnterior.end),
    // Clientes ativos atual
    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("status", "ativo"),
    // Clientes ativos mês anterior (aproximação)
    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("status", "ativo")
      .lte("data_ativacao", mesAnterior.end),
    // Reuniões hoje
    supabase
      .from("reunioes")
      .select(`
        id,
        titulo,
        data_inicio,
        tipo,
        clientes(razao_social),
        leads(nome)
      `)
      .gte("data_inicio", hoje.start)
      .lte("data_inicio", hoje.end)
      .eq("status", "agendada")
      .order("data_inicio", { ascending: true })
      .limit(5),
    // Aprovações pendentes
    supabase
      .from("ausencias")
      .select(`
        id,
        tipo,
        data_inicio,
        data_fim,
        profiles!ausencias_colaborador_id_fkey(nome)
      `)
      .eq("status", "pendente")
      .order("created_at", { ascending: false })
      .limit(5),
    // Cobranças falhadas
    supabase
      .from("cobrancas")
      .select("id", { count: "exact", head: true })
      .in("status", ["falhou"]),
    // Detratores NPS (últimos 7 dias)
    supabase
      .from("nps_respostas")
      .select("id", { count: "exact", head: true })
      .lte("score", 6)
      .gte("created_at", subMonths(now, 1).toISOString()),
    // SLA estourados (tarefas muito atrasadas)
    supabase
      .from("tarefas")
      .select("id", { count: "exact", head: true })
      .eq("concluida", false)
      .lt("data_vencimento", subHours(now, 24).toISOString()),
  ]);

  // Calculate values
  const receitaAtualSum = (receitaMesAtual.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);
  const receitaAnteriorSum = (receitaMesAnterior.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);
  const inadimplenciaAtualSum = (inadimplenciaAtual.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);
  const inadimplenciaAnteriorSum = (inadimplenciaAnterior.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);

  // Build alerts
  const alertas: AlertItem[] = [];
  if ((slaEstourados.count || 0) > 0) {
    alertas.push({
      id: "sla",
      title: "SLA Crítico",
      description: `${slaEstourados.count} tarefas com SLA estourado`,
      variant: "error",
      actionLabel: "Ver tarefas",
      actionHref: "/tarefas",
    });
  }
  if ((detratoresNPS.count || 0) > 0) {
    alertas.push({
      id: "nps",
      title: "Detratores NPS",
      description: `${detratoresNPS.count} detratores no último mês`,
      variant: "warning",
      actionLabel: "Analisar",
      actionHref: "/nps",
    });
  }
  if ((cobrancasFalhadas.count || 0) > 0) {
    alertas.push({
      id: "cobrancas",
      title: "Cobranças Falhadas",
      description: `${cobrancasFalhadas.count} cobranças com erro`,
      variant: "warning",
      actionLabel: "Resolver",
      actionHref: "/financeiro/cobrancas",
    });
  }

  return {
    receitaMes: {
      valor: receitaAtualSum,
      variacao: calcVariacao(receitaAtualSum, receitaAnteriorSum),
      prefix: "R$ ",
    },
    leadsNovos: {
      valor: leadsNovosAtual.count || 0,
      variacao: calcVariacao(leadsNovosAtual.count || 0, leadsNovosAnterior.count || 0),
    },
    tarefasAtrasadas: {
      valor: tarefasAtrasadas.count || 0,
    },
    inadimplencia: {
      valor: inadimplenciaAtualSum,
      variacao: calcVariacao(inadimplenciaAtualSum, inadimplenciaAnteriorSum),
      prefix: "R$ ",
    },
    churnMes: {
      valor: churnMesAtual.count || 0,
      variacao: calcVariacao(churnMesAtual.count || 0, churnMesAnterior.count || 0),
    },
    clientesAtivos: {
      valor: clientesAtivosAtual.count || 0,
      variacao: calcVariacao(clientesAtivosAtual.count || 0, clientesAtivosAnterior.count || 0),
    },
    reunioesHoje: (reunioesHoje.data || []).map((r) => ({
      id: r.id,
      primary: r.clientes?.razao_social || r.leads?.nome || r.titulo,
      secondary: `${new Date(r.data_inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - ${r.titulo}`,
      badge: r.tipo === "1:1" ? { text: "1:1", variant: "info" as const } : undefined,
    })),
    aprovacoesPendentes: (aprovacoesPendentes.data || []).map((a) => ({
      id: a.id,
      primary: `${a.tipo} - ${a.profiles?.nome || "Colaborador"}`,
      secondary: `${new Date(a.data_inicio).toLocaleDateString("pt-BR")} a ${new Date(a.data_fim).toLocaleDateString("pt-BR")}`,
      badge: { text: "Pendente", variant: "warning" as const },
    })),
    alertasCriticos: alertas,
  };
}

// ============= SDR Dashboard =============
export async function fetchSDRDashboard(userId: string): Promise<SDRDashboardData> {
  const now = new Date();
  const mesAtual = getMonthRange(now);
  const mesAnterior = getMonthRange(subMonths(now, 1));
  const hoje = getTodayRange();
  const ha24h = subHours(now, 24).toISOString();

  const [
    meusLeadsAtual,
    meusLeadsAnterior,
    followupsHoje,
    agendamentosAtual,
    agendamentosAnterior,
    leadsSemAtividade,
    leadsFrios,
  ] = await Promise.all([
    // Meus leads atuais
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("sdr_responsavel_id", userId)
      .eq("funil_atual", "sdr"),
    // Meus leads mês anterior
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("sdr_responsavel_id", userId)
      .eq("funil_atual", "sdr")
      .lte("created_at", mesAnterior.end),
    // Follow-ups hoje
    supabase
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .eq("criado_por_id", userId)
      .eq("concluido", false)
      .gte("data_programada", hoje.start)
      .lte("data_programada", hoje.end),
    // Agendamentos mês atual
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("sdr_responsavel_id", userId)
      .eq("etapa_sdr", "reuniao_agendada")
      .gte("data_agendamento", mesAtual.start)
      .lte("data_agendamento", mesAtual.end),
    // Agendamentos mês anterior
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("sdr_responsavel_id", userId)
      .eq("etapa_sdr", "reuniao_agendada")
      .gte("data_agendamento", mesAnterior.start)
      .lte("data_agendamento", mesAnterior.end),
    // Leads sem atividade há 24h
    supabase
      .from("leads")
      .select(`
        id,
        nome,
        empresa,
        updated_at
      `)
      .eq("sdr_responsavel_id", userId)
      .eq("funil_atual", "sdr")
      .lt("updated_at", ha24h)
      .order("updated_at", { ascending: true })
      .limit(5),
    // Leads frios
    supabase
      .from("leads")
      .select(`
        id,
        nome,
        empresa,
        updated_at
      `)
      .eq("sdr_responsavel_id", userId)
      .eq("funil_atual", "frios")
      .neq("etapa_frios", "descartado")
      .order("updated_at", { ascending: true })
      .limit(5),
  ]);

  const horasDesdeAtividade = (date: string) => {
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  };

  return {
    meusLeads: {
      valor: meusLeadsAtual.count || 0,
      variacao: calcVariacao(meusLeadsAtual.count || 0, meusLeadsAnterior.count || 0),
    },
    followupsHoje: {
      valor: followupsHoje.count || 0,
    },
    agendamentosMes: {
      valor: agendamentosAtual.count || 0,
      variacao: calcVariacao(agendamentosAtual.count || 0, agendamentosAnterior.count || 0),
    },
    leadsSemAtividade: (leadsSemAtividade.data || []).map((l) => {
      const horas = horasDesdeAtividade(l.updated_at);
      return {
        id: l.id,
        primary: l.nome,
        secondary: `Última atividade: ${horas}h`,
        badge: horas > 48 
          ? { text: "Urgente", variant: "destructive" as const }
          : { text: "Atenção", variant: "warning" as const },
      };
    }),
    leadsFrios: (leadsFrios.data || []).map((l) => {
      const dias = Math.floor((now.getTime() - new Date(l.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: l.id,
        primary: l.nome,
        secondary: `Sem contato há ${dias} dias`,
      };
    }),
    metaAgendamentos: { current: agendamentosAtual.count || 0, target: 25 },
  };
}

// ============= Closer Dashboard =============
export async function fetchCloserDashboard(userId: string): Promise<CloserDashboardData> {
  const now = new Date();
  const mesAtual = getMonthRange(now);
  const mesAnterior = getMonthRange(subMonths(now, 1));
  const hoje = getTodayRange();

  // Buscar dados dos últimos 6 meses para evolução
  const ultimos6Meses = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    return {
      mes: date.toLocaleDateString("pt-BR", { month: "short" }),
      range: getMonthRange(date),
    };
  });

  const [
    reunioesHojeAtual,
    reunioesHojeAnterior,
    propostasPendentes,
    propostasPendentesAnterior,
    fechamentosAtual,
    fechamentosAnterior,
    comissaoAtual,
    comissaoAnterior,
    propostasSemResposta,
    proximasReunioes,
    // Dados para métricas avançadas
    leadsConvertidosMesAtual,
    leadsConvertidosMesAnterior,
    totalLeadsRecebidosMesAtual,
    totalLeadsRecebidosMesAnterior,
    leadsPerdidosMesAtual,
    leadsEmNegociacao,
    leadsComOrigemMes,
    evolucaoMensalData,
  ] = await Promise.all([
    // Reuniões hoje
    supabase
      .from("reunioes")
      .select("id", { count: "exact", head: true })
      .eq("organizador_id", userId)
      .gte("data_inicio", hoje.start)
      .lte("data_inicio", hoje.end)
      .eq("status", "agendada"),
    // Reuniões ontem (para variação)
    supabase
      .from("reunioes")
      .select("id", { count: "exact", head: true })
      .eq("organizador_id", userId)
      .gte("data_inicio", subHours(new Date(hoje.start), 24).toISOString())
      .lt("data_inicio", hoje.start)
      .eq("status", "agendada"),
    // Propostas pendentes
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("closer_responsavel_id", userId)
      .eq("etapa_closer", "proposta_enviada"),
    // Propostas pendentes anterior
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("closer_responsavel_id", userId)
      .eq("etapa_closer", "proposta_enviada")
      .lte("updated_at", mesAnterior.end),
    // Fechamentos mês
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("closer_responsavel_id", userId)
      .eq("etapa_closer", "fechado_ganho")
      .gte("data_conversao", mesAtual.start)
      .lte("data_conversao", mesAtual.end),
    // Fechamentos mês anterior
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("closer_responsavel_id", userId)
      .eq("etapa_closer", "fechado_ganho")
      .gte("data_conversao", mesAnterior.start)
      .lte("data_conversao", mesAnterior.end),
    // Comissão acumulada pendente
    supabase
      .from("comissoes")
      .select("valor")
      .eq("colaborador_id", userId)
      .eq("status", "pendente"),
    // Comissão mês anterior (para variação)
    supabase
      .from("comissoes")
      .select("valor")
      .eq("colaborador_id", userId)
      .eq("status", "pendente")
      .lte("created_at", mesAnterior.end),
    // Propostas sem resposta (mais de 48h)
    supabase
      .from("leads")
      .select(`
        id,
        nome,
        empresa,
        valor_proposta,
        updated_at
      `)
      .eq("closer_responsavel_id", userId)
      .eq("etapa_closer", "proposta_enviada")
      .lt("updated_at", subHours(now, 48).toISOString())
      .order("updated_at", { ascending: true })
      .limit(5),
    // Próximas reuniões
    supabase
      .from("reunioes")
      .select(`
        id,
        titulo,
        data_inicio,
        leads(nome, etapa_closer)
      `)
      .eq("organizador_id", userId)
      .gte("data_inicio", now.toISOString())
      .eq("status", "agendada")
      .order("data_inicio", { ascending: true })
      .limit(5),
    // === MÉTRICAS AVANÇADAS ===
    // Leads convertidos mês atual (com valor para ticket médio e tempo ciclo)
    supabase
      .from("leads")
      .select("id, valor_proposta, created_at, data_conversao")
      .eq("closer_responsavel_id", userId)
      .eq("etapa_closer", "fechado_ganho")
      .gte("data_conversao", mesAtual.start)
      .lte("data_conversao", mesAtual.end),
    // Leads convertidos mês anterior (para variação)
    supabase
      .from("leads")
      .select("id, valor_proposta, created_at, data_conversao")
      .eq("closer_responsavel_id", userId)
      .eq("etapa_closer", "fechado_ganho")
      .gte("data_conversao", mesAnterior.start)
      .lte("data_conversao", mesAnterior.end),
    // Total leads recebidos mês atual (para taxa conversão)
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("closer_responsavel_id", userId)
      .eq("funil_atual", "closer")
      .or(`etapa_closer.eq.fechado_ganho,etapa_closer.eq.perdido,etapa_closer.neq.null`)
      .gte("created_at", mesAtual.start)
      .lte("created_at", mesAtual.end),
    // Total leads recebidos mês anterior
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("closer_responsavel_id", userId)
      .eq("funil_atual", "closer")
      .or(`etapa_closer.eq.fechado_ganho,etapa_closer.eq.perdido,etapa_closer.neq.null`)
      .gte("created_at", mesAnterior.start)
      .lte("created_at", mesAnterior.end),
    // Leads perdidos mês atual
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("closer_responsavel_id", userId)
      .eq("etapa_closer", "perdido")
      .gte("data_perda", mesAtual.start)
      .lte("data_perda", mesAtual.end),
    // Leads em negociação (para forecast)
    supabase
      .from("leads")
      .select("id, valor_proposta, etapa_closer")
      .eq("closer_responsavel_id", userId)
      .eq("funil_atual", "closer")
      .in("etapa_closer", ["reuniao_realizada", "proposta_enviada", "negociacao"]),
    // Leads com origem para Win Rate por Origem
    supabase
      .from("leads")
      .select(`
        id,
        etapa_closer,
        origem:origens_lead(nome)
      `)
      .eq("closer_responsavel_id", userId)
      .in("etapa_closer", ["fechado_ganho", "perdido"])
      .gte("updated_at", subMonths(now, 3).toISOString()),
    // Evolução mensal (fechamentos e perdas dos últimos 6 meses)
    Promise.all(
      ultimos6Meses.map(async ({ mes, range }) => {
        const [ganhos, perdas] = await Promise.all([
          supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("closer_responsavel_id", userId)
            .eq("etapa_closer", "fechado_ganho")
            .gte("data_conversao", range.start)
            .lte("data_conversao", range.end),
          supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("closer_responsavel_id", userId)
            .eq("etapa_closer", "perdido")
            .gte("data_perda", range.start)
            .lte("data_perda", range.end),
        ]);
        return {
          name: mes.charAt(0).toUpperCase() + mes.slice(1).replace(".", ""),
          value: ganhos.count || 0,
          value2: perdas.count || 0,
        };
      })
    ),
  ]);

  const comissaoAtualSum = (comissaoAtual.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);
  const comissaoAnteriorSum = (comissaoAnterior.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);

  // Calcular métricas avançadas
  const leadsConvertidosAtualData = leadsConvertidosMesAtual.data || [];
  const leadsConvertidosAnteriorData = leadsConvertidosMesAnterior.data || [];
  
  // Taxa de Conversão = Ganhos / (Ganhos + Perdidos)
  const ganhosAtual = fechamentosAtual.count || 0;
  const perdidosAtual = leadsPerdidosMesAtual.count || 0;
  const totalFinalizadosAtual = ganhosAtual + perdidosAtual;
  const taxaConversaoAtual = totalFinalizadosAtual > 0 ? (ganhosAtual / totalFinalizadosAtual) * 100 : 0;
  
  const ganhosAnterior = fechamentosAnterior.count || 0;
  const totalRecebidosAnterior = totalLeadsRecebidosMesAnterior.count || 0;
  const taxaConversaoAnterior = totalRecebidosAnterior > 0 ? (ganhosAnterior / totalRecebidosAnterior) * 100 : 0;
  
  // Ticket Médio
  const somaValoresAtual = leadsConvertidosAtualData.reduce((sum, l) => sum + (l.valor_proposta || 0), 0);
  const ticketMedioAtual = leadsConvertidosAtualData.length > 0 ? somaValoresAtual / leadsConvertidosAtualData.length : 0;
  
  const somaValoresAnterior = leadsConvertidosAnteriorData.reduce((sum, l) => sum + (l.valor_proposta || 0), 0);
  const ticketMedioAnterior = leadsConvertidosAnteriorData.length > 0 ? somaValoresAnterior / leadsConvertidosAnteriorData.length : 0;
  
  // Tempo de Ciclo Médio (dias entre criação e conversão)
  const temposCicloAtual = leadsConvertidosAtualData
    .filter(l => l.created_at && l.data_conversao)
    .map(l => {
      const inicio = new Date(l.created_at!);
      const fim = new Date(l.data_conversao!);
      return Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    });
  const tempoCicloMedioAtual = temposCicloAtual.length > 0 
    ? temposCicloAtual.reduce((sum, t) => sum + t, 0) / temposCicloAtual.length 
    : 0;
  
  const temposCicloAnterior = leadsConvertidosAnteriorData
    .filter(l => l.created_at && l.data_conversao)
    .map(l => {
      const inicio = new Date(l.created_at!);
      const fim = new Date(l.data_conversao!);
      return Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    });
  const tempoCicloMedioAnterior = temposCicloAnterior.length > 0 
    ? temposCicloAnterior.reduce((sum, t) => sum + t, 0) / temposCicloAnterior.length 
    : 0;
  
  // Forecast Mensal (valor potencial ponderado por etapa)
  const pesosPorEtapa: Record<string, number> = {
    reuniao_realizada: 0.3,
    proposta_enviada: 0.5,
    negociacao: 0.7,
  };
  const forecastAtual = (leadsEmNegociacao.data || []).reduce((sum, l) => {
    const peso = pesosPorEtapa[l.etapa_closer || ""] || 0.3;
    return sum + (l.valor_proposta || 0) * peso;
  }, 0);
  
  // Win Rate por Origem
  const leadsOrigemData = leadsComOrigemMes.data || [];
  const origemStats: Record<string, { total: number; ganhos: number }> = {};
  leadsOrigemData.forEach(l => {
    const origemNome = (l.origem as any)?.nome || "Sem origem";
    if (!origemStats[origemNome]) {
      origemStats[origemNome] = { total: 0, ganhos: 0 };
    }
    origemStats[origemNome].total++;
    if (l.etapa_closer === "fechado_ganho") {
      origemStats[origemNome].ganhos++;
    }
  });
  
  const winRatePorOrigem: WinRateByOrigem[] = Object.entries(origemStats)
    .map(([origem, stats]) => ({
      origem,
      total: stats.total,
      ganhos: stats.ganhos,
      taxa: stats.total > 0 ? Math.round((stats.ganhos / stats.total) * 100) : 0,
    }))
    .sort((a, b) => b.taxa - a.taxa)
    .slice(0, 5);

  return {
    reunioesHoje: {
      valor: reunioesHojeAtual.count || 0,
      variacao: calcVariacao(reunioesHojeAtual.count || 0, reunioesHojeAnterior.count || 0),
    },
    propostasPendentes: {
      valor: propostasPendentes.count || 0,
      variacao: calcVariacao(propostasPendentes.count || 0, propostasPendentesAnterior.count || 0),
    },
    fechamentosMes: {
      valor: fechamentosAtual.count || 0,
      variacao: calcVariacao(fechamentosAtual.count || 0, fechamentosAnterior.count || 0),
    },
    comissaoAcumulada: {
      valor: comissaoAtualSum,
      variacao: calcVariacao(comissaoAtualSum, comissaoAnteriorSum),
      prefix: "R$ ",
    },
    // Métricas avançadas
    taxaConversao: {
      valor: Math.round(taxaConversaoAtual * 10) / 10,
      variacao: calcVariacao(taxaConversaoAtual, taxaConversaoAnterior),
      suffix: "%",
    },
    ticketMedio: {
      valor: Math.round(ticketMedioAtual),
      variacao: calcVariacao(ticketMedioAtual, ticketMedioAnterior),
      prefix: "R$ ",
    },
    tempoCicloMedio: {
      valor: Math.round(tempoCicloMedioAtual),
      variacao: calcVariacao(tempoCicloMedioAnterior, tempoCicloMedioAtual), // Invertido: menos é melhor
      suffix: " dias",
    },
    forecastMensal: {
      valor: Math.round(forecastAtual),
      prefix: "R$ ",
    },
    winRatePorOrigem,
    evolucaoMensal: evolucaoMensalData,
    propostasSemResposta: (propostasSemResposta.data || []).map((p) => {
      const horas = Math.floor((now.getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60));
      return {
        id: p.id,
        primary: `${p.nome}${p.empresa ? ` - ${p.empresa}` : ""}`,
        secondary: `Enviada há ${horas}h`,
        badge: p.valor_proposta 
          ? { text: `R$ ${p.valor_proposta.toLocaleString("pt-BR")}`, variant: "info" as const }
          : undefined,
      };
    }),
    proximasReunioes: (proximasReunioes.data || []).map((r) => {
      const dataFormatada = new Date(r.data_inicio);
      const isHoje = dataFormatada.toDateString() === now.toDateString();
      return {
        id: r.id,
        primary: r.leads?.nome || r.titulo,
        secondary: `${isHoje ? "Hoje" : dataFormatada.toLocaleDateString("pt-BR")} ${dataFormatada.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - ${r.titulo}`,
        badge: r.leads?.etapa_closer === "reuniao_realizada" 
          ? { text: "Qualificado", variant: "success" as const }
          : undefined,
      };
    }),
  };
}

// ============= Operacional Dashboard =============
export async function fetchOperacionalDashboard(userId: string): Promise<OperacionalDashboardData> {
  const now = new Date();
  const mesAtual = getMonthRange(now);
  const mesAnterior = getMonthRange(subMonths(now, 1));
  const hoje = getTodayRange();
  const ultimos14Dias = subHours(now, 14 * 24).toISOString();

  const [
    meusClientesAtual,
    meusClientesAnterior,
    tarefasPendentes,
    tarefasPendentesAnterior,
    tarefasAtrasadas,
    tarefasAtrasadasAnterior,
    onboardings,
    tarefasVencendoHoje,
    tarefasConcluidasMes,
  ] = await Promise.all([
    // Meus clientes (via cliente_servicos)
    supabase
      .from("cliente_servicos")
      .select("cliente_id", { count: "exact", head: true })
      .eq("responsavel_id", userId)
      .eq("status", "ativo"),
    // Meus clientes anterior
    supabase
      .from("cliente_servicos")
      .select("cliente_id", { count: "exact", head: true })
      .eq("responsavel_id", userId)
      .eq("status", "ativo")
      .lte("created_at", mesAnterior.end),
    // Tarefas pendentes
    supabase
      .from("tarefas")
      .select("id", { count: "exact", head: true })
      .eq("responsavel_id", userId)
      .eq("concluida", false),
    // Tarefas pendentes anterior
    supabase
      .from("tarefas")
      .select("id", { count: "exact", head: true })
      .eq("responsavel_id", userId)
      .eq("concluida", false)
      .lte("created_at", mesAnterior.end),
    // Tarefas atrasadas
    supabase
      .from("tarefas")
      .select("id", { count: "exact", head: true })
      .eq("responsavel_id", userId)
      .eq("concluida", false)
      .lt("data_vencimento", now.toISOString()),
    // Tarefas atrasadas anterior
    supabase
      .from("tarefas")
      .select("id", { count: "exact", head: true })
      .eq("responsavel_id", userId)
      .eq("concluida", false)
      .lt("data_vencimento", mesAnterior.end),
    // Onboardings recentes
    supabase
      .from("projetos")
      .select(`
        id,
        nome,
        created_at,
        status,
        clientes(razao_social)
      `)
      .eq("status", "ativo")
      .gte("created_at", ultimos14Dias)
      .order("created_at", { ascending: false })
      .limit(5),
    // Tarefas vencendo hoje
    supabase
      .from("tarefas")
      .select(`
        id,
        titulo,
        data_vencimento,
        prioridade,
        clientes(razao_social)
      `)
      .eq("responsavel_id", userId)
      .eq("concluida", false)
      .gte("data_vencimento", hoje.start)
      .lte("data_vencimento", hoje.end)
      .order("data_vencimento", { ascending: true })
      .limit(5),
    // Entregas do mês (tarefas concluídas)
    supabase
      .from("tarefas")
      .select("id", { count: "exact", head: true })
      .eq("responsavel_id", userId)
      .eq("concluida", true)
      .gte("concluida_em", mesAtual.start)
      .lte("concluida_em", mesAtual.end),
  ]);

  const diasDesdeInicio = (date: string) => {
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return {
    meusClientes: {
      valor: meusClientesAtual.count || 0,
      variacao: calcVariacao(meusClientesAtual.count || 0, meusClientesAnterior.count || 0),
    },
    tarefasPendentes: {
      valor: tarefasPendentes.count || 0,
      variacao: calcVariacao(tarefasPendentes.count || 0, tarefasPendentesAnterior.count || 0),
    },
    tarefasAtrasadas: {
      valor: tarefasAtrasadas.count || 0,
      variacao: calcVariacao(tarefasAtrasadas.count || 0, tarefasAtrasadasAnterior.count || 0),
    },
    onboardings: (onboardings.data || []).map((p) => {
      const dia = diasDesdeInicio(p.created_at);
      return {
        id: p.id,
        primary: p.clientes?.razao_social || p.nome,
        secondary: `Dia ${dia} de 7`,
        badge: dia <= 2
          ? { text: "Iniciando", variant: "warning" as const }
          : { text: "Em andamento", variant: "info" as const },
      };
    }),
    tarefasVencendoHoje: (tarefasVencendoHoje.data || []).map((t) => ({
      id: t.id,
      primary: t.titulo,
      secondary: `Vence às ${new Date(t.data_vencimento).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}${t.clientes ? ` - ${t.clientes.razao_social}` : ""}`,
      badge: t.prioridade === "alta" || t.prioridade === "urgente"
        ? { text: "Alta", variant: "destructive" as const }
        : undefined,
    })),
    entregasMes: { current: tarefasConcluidasMes.count || 0, target: 60 },
  };
}

// ============= Financeiro Dashboard =============
export async function fetchFinanceiroDashboard(): Promise<FinanceiroDashboardData> {
  const now = new Date();
  const mesAtual = getMonthRange(now);
  const mesAnterior = getMonthRange(subMonths(now, 1));
  const hoje = getTodayRange();

  const [
    cobrancasHojeAtual,
    cobrancasHojeAnterior,
    inadimplentes,
    inadimplentesAnterior,
    comissoesAPagar,
    comissoesAPagarAnterior,
    receitaMes,
    despesaMes,
    receitaMesAnterior,
    despesaMesAnterior,
    cobrancasFalhadas,
    receitaUltimos5Meses,
    despesaUltimos5Meses,
  ] = await Promise.all([
    // Cobranças vencendo hoje
    supabase
      .from("cobrancas")
      .select("id", { count: "exact", head: true })
      .gte("data_vencimento", hoje.start)
      .lte("data_vencimento", hoje.end)
      .in("status", ["pendente", "atrasado"]),
    // Cobranças ontem
    supabase
      .from("cobrancas")
      .select("id", { count: "exact", head: true })
      .gte("data_vencimento", subHours(new Date(hoje.start), 24).toISOString())
      .lt("data_vencimento", hoje.start)
      .in("status", ["pendente", "atrasado"]),
    // Clientes inadimplentes
    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("status", "inadimplente"),
    // Inadimplentes anterior
    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("status", "inadimplente")
      .lte("updated_at", mesAnterior.end),
    // Comissões a pagar
    supabase
      .from("comissoes")
      .select("valor")
      .eq("status", "pendente"),
    // Comissões a pagar anterior
    supabase
      .from("comissoes")
      .select("valor")
      .eq("status", "pendente")
      .lte("created_at", mesAnterior.end),
    // Receita mês
    supabase
      .from("cobrancas")
      .select("valor")
      .eq("status", "pago")
      .gte("data_pagamento", mesAtual.start)
      .lte("data_pagamento", mesAtual.end),
    // Despesa mês (custos fixos + variáveis)
    supabase.from("custos_fixos").select("valor").eq("ativo", true),
    // Receita mês anterior
    supabase
      .from("cobrancas")
      .select("valor")
      .eq("status", "pago")
      .gte("data_pagamento", mesAnterior.start)
      .lte("data_pagamento", mesAnterior.end),
    // Despesa mês anterior
    supabase.from("custos_fixos").select("valor").eq("ativo", true),
    // Cobranças falhadas
    supabase
      .from("cobrancas")
      .select(`
        id,
        valor,
        tentativas,
        clientes(razao_social),
        forma_pagamento
      `)
      .eq("status", "falhou")
      .order("updated_at", { ascending: false })
      .limit(5),
    // Receita últimos 5 meses
    Promise.all(
      Array.from({ length: 5 }, (_, i) => {
        const mes = subMonths(now, 4 - i);
        const range = getMonthRange(mes);
        return supabase
          .from("cobrancas")
          .select("valor")
          .eq("status", "pago")
          .gte("data_pagamento", range.start)
          .lte("data_pagamento", range.end);
      })
    ),
    // Despesa últimos 5 meses (usando custos variáveis + fixos)
    Promise.all(
      Array.from({ length: 5 }, (_, i) => {
        const mes = subMonths(now, 4 - i);
        const range = getMonthRange(mes);
        return supabase
          .from("custos_variaveis")
          .select("valor")
          .gte("data_referencia", range.start)
          .lte("data_referencia", range.end);
      })
    ),
  ]);

  const comissoesAPagarSum = (comissoesAPagar.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);
  const comissoesAPagarAnteriorSum = (comissoesAPagarAnterior.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);
  const receitaMesSum = (receitaMes.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);
  const despesaMesSum = (despesaMes.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);
  const receitaMesAnteriorSum = (receitaMesAnterior.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);
  const despesaMesAnteriorSum = (despesaMesAnterior.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);

  const lucroMesVal = receitaMesSum - despesaMesSum;
  const lucroMesAnteriorVal = receitaMesAnteriorSum - despesaMesAnteriorSum;

  // Build chart data
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const chartData: ChartDataPoint[] = receitaUltimos5Meses.map((res, i) => {
    const mesIndex = subMonths(now, 4 - i).getMonth();
    const receitaSum = (res.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);
    const despesaSum = (despesaUltimos5Meses[i].data || []).reduce((sum, c) => sum + (c.valor || 0), 0) + despesaMesSum;
    return {
      name: meses[mesIndex],
      value: receitaSum,
      value2: despesaSum,
    };
  });

  return {
    cobrancasHoje: {
      valor: cobrancasHojeAtual.count || 0,
      variacao: calcVariacao(cobrancasHojeAtual.count || 0, cobrancasHojeAnterior.count || 0),
    },
    inadimplentes: {
      valor: inadimplentes.count || 0,
      variacao: calcVariacao(inadimplentes.count || 0, inadimplentesAnterior.count || 0),
    },
    comissoesAPagar: {
      valor: comissoesAPagarSum,
      variacao: calcVariacao(comissoesAPagarSum, comissoesAPagarAnteriorSum),
      prefix: "R$ ",
    },
    lucroMes: {
      valor: lucroMesVal,
      variacao: calcVariacao(lucroMesVal, lucroMesAnteriorVal),
      prefix: "R$ ",
    },
    receitaVsDespesas: chartData,
    cobrancasFalhadas: (cobrancasFalhadas.data || []).map((c) => {
      const motivo = c.forma_pagamento === "cartao" ? "Cartão recusado" : "Pagamento falhou";
      return {
        id: c.id,
        primary: `${c.clientes?.razao_social || "Cliente"} - ${motivo}`,
        secondary: `R$ ${c.valor?.toLocaleString("pt-BR")} - ${c.tentativas || 0} tentativas`,
        badge: (c.tentativas || 0) >= 3
          ? { text: "Falha", variant: "destructive" as const }
          : { text: "Pendente", variant: "warning" as const },
      };
    }),
  };
}
