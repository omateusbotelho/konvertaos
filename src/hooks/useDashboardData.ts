import { useAuth } from "@/hooks/use-auth";
import { ListItem } from "@/components/dashboard/ListWidget";
import { AlertItem } from "@/components/dashboard/AlertWidget";
import { ChartDataPoint } from "@/components/dashboard/ChartWidget";
import { Database } from "@/integrations/supabase/types";

type CargoTipo = Database["public"]["Enums"]["cargo_tipo"];

// Helper to get greeting based on time
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

// Helper to format current date
export function getFormattedDate(): string {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Types for dashboard data
interface StatData {
  valor: number;
  variacao?: number;
  prefix?: string;
  suffix?: string;
  sparklineData?: { value: number }[];
}

interface AdminDashboardData {
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

interface SDRDashboardData {
  meusLeads: StatData;
  followupsHoje: StatData;
  agendamentosMes: StatData;
  leadsSemAtividade: ListItem[];
  leadsFrios: ListItem[];
  metaAgendamentos: { current: number; target: number };
}

interface CloserDashboardData {
  reunioesHoje: StatData;
  propostasPendentes: StatData;
  fechamentosMes: StatData;
  comissaoAcumulada: StatData;
  propostasSemResposta: ListItem[];
  proximasReunioes: ListItem[];
}

interface OperacionalDashboardData {
  meusClientes: StatData;
  tarefasPendentes: StatData;
  tarefasAtrasadas: StatData;
  onboardings: ListItem[];
  tarefasVencendoHoje: ListItem[];
  entregasMes: { current: number; target: number };
}

interface FinanceiroDashboardData {
  cobrancasHoje: StatData;
  inadimplentes: StatData;
  comissoesAPagar: StatData;
  lucroMes: StatData;
  receitaVsDespesas: ChartDataPoint[];
  cobrancasFalhadas: ListItem[];
}

export type DashboardData = 
  | { tipo: "admin"; data: AdminDashboardData }
  | { tipo: "sdr"; data: SDRDashboardData }
  | { tipo: "closer"; data: CloserDashboardData }
  | { tipo: "operacional"; data: OperacionalDashboardData }
  | { tipo: "financeiro"; data: FinanceiroDashboardData };

// Mock data generators
const mockAdminData: AdminDashboardData = {
  receitaMes: { valor: 125000, variacao: 12.5, prefix: "R$ " },
  leadsNovos: { valor: 47, variacao: 8.3 },
  tarefasAtrasadas: { valor: 12, variacao: -15 },
  inadimplencia: { valor: 8500, variacao: -5.2, prefix: "R$ " },
  churnMes: { valor: 3, variacao: -25 },
  clientesAtivos: { valor: 42, variacao: 7.1 },
  reunioesHoje: [
    { id: 1, primary: "TechStart Solutions", secondary: "10:00 - Onboarding", badge: { text: "Novo", variant: "success" as const } },
    { id: 2, primary: "FoodCorp Brasil", secondary: "14:30 - Revisão mensal" },
    { id: 3, primary: "HealthPlus", secondary: "16:00 - Apresentação proposta", badge: { text: "Proposta", variant: "info" as const } },
  ],
  aprovacoesPendentes: [
    { id: 1, primary: "Férias - João Silva", secondary: "15/02 a 22/02", badge: { text: "Pendente", variant: "warning" as const } },
    { id: 2, primary: "Férias - Maria Santos", secondary: "01/03 a 08/03", badge: { text: "Pendente", variant: "warning" as const } },
  ],
  alertasCriticos: [
    { id: 1, title: "SLA Crítico", description: "3 clientes com SLA estourando hoje", variant: "error", actionLabel: "Ver clientes", actionHref: "/clientes" },
    { id: 2, title: "Detratores NPS", description: "2 novos detratores identificados essa semana", variant: "warning", actionLabel: "Analisar", actionHref: "/nps" },
    { id: 3, title: "Cobranças Falhadas", description: "5 cobranças com erro de cartão", variant: "warning", actionLabel: "Resolver", actionHref: "/financeiro" },
  ],
};

const mockSDRData: SDRDashboardData = {
  meusLeads: { valor: 34, variacao: 15.2 },
  followupsHoje: { valor: 12, variacao: 0 },
  agendamentosMes: { valor: 18, variacao: 22.5 },
  leadsSemAtividade: [
    { id: 1, primary: "Carlos Mendes", secondary: "Última atividade: 26h", badge: { text: "Urgente", variant: "destructive" as const } },
    { id: 2, primary: "Ana Paula Tech", secondary: "Última atividade: 25h", badge: { text: "Urgente", variant: "destructive" as const } },
    { id: 3, primary: "StartupXYZ", secondary: "Última atividade: 24h", badge: { text: "Atenção", variant: "warning" as const } },
  ],
  leadsFrios: [
    { id: 1, primary: "MegaCorp SA", secondary: "Sem contato há 15 dias" },
    { id: 2, primary: "Digital Solutions", secondary: "Sem contato há 12 dias" },
    { id: 3, primary: "E-commerce Plus", secondary: "Sem contato há 10 dias" },
  ],
  metaAgendamentos: { current: 18, target: 25 },
};

const mockCloserData: CloserDashboardData = {
  reunioesHoje: { valor: 4, variacao: 33.3 },
  propostasPendentes: { valor: 7, variacao: -12.5 },
  fechamentosMes: { valor: 5, variacao: 25 },
  comissaoAcumulada: { valor: 8500, variacao: 18.3, prefix: "R$ " },
  propostasSemResposta: [
    { id: 1, primary: "TechStart - Plano Pro", secondary: "Enviada há 52h", badge: { text: "R$ 2.500", variant: "info" as const } },
    { id: 2, primary: "FoodCorp - Tráfego", secondary: "Enviada há 49h", badge: { text: "R$ 1.800", variant: "info" as const } },
    { id: 3, primary: "HealthPlus - Full", secondary: "Enviada há 48h", badge: { text: "R$ 4.200", variant: "info" as const } },
  ],
  proximasReunioes: [
    { id: 1, primary: "MegaCorp SA", secondary: "Hoje 15:00 - Apresentação", badge: { text: "Qualificado", variant: "success" as const } },
    { id: 2, primary: "StartupABC", secondary: "Hoje 17:00 - Follow-up" },
    { id: 3, primary: "Digital Agency", secondary: "Amanhã 10:00 - Demo" },
  ],
};

const mockOperacionalData: OperacionalDashboardData = {
  meusClientes: { valor: 8, variacao: 14.3 },
  tarefasPendentes: { valor: 23, variacao: -8.0 },
  tarefasAtrasadas: { valor: 4, variacao: -50.0 },
  onboardings: [
    { id: 1, primary: "TechStart Solutions", secondary: "Dia 3 de 7", badge: { text: "Em andamento", variant: "info" as const } },
    { id: 2, primary: "NewClient Corp", secondary: "Dia 1 de 7", badge: { text: "Iniciando", variant: "warning" as const } },
  ],
  tarefasVencendoHoje: [
    { id: 1, primary: "Criar criativos - FoodCorp", secondary: "Vence às 18:00", badge: { text: "Alta", variant: "destructive" as const } },
    { id: 2, primary: "Revisar copy - HealthPlus", secondary: "Vence às 17:00" },
    { id: 3, primary: "Configurar pixel - StartupXYZ", secondary: "Vence às 19:00" },
  ],
  entregasMes: { current: 45, target: 60 },
};

const mockFinanceiroData: FinanceiroDashboardData = {
  cobrancasHoje: { valor: 15, variacao: 7.1 },
  inadimplentes: { valor: 6, variacao: -14.3 },
  comissoesAPagar: { valor: 12500, variacao: 22.0, prefix: "R$ " },
  lucroMes: { valor: 45000, variacao: 15.8, prefix: "R$ " },
  receitaVsDespesas: [
    { name: "Jan", value: 95000, value2: 65000 },
    { name: "Fev", value: 102000, value2: 68000 },
    { name: "Mar", value: 98000, value2: 62000 },
    { name: "Abr", value: 115000, value2: 70000 },
    { name: "Mai", value: 125000, value2: 72000 },
  ],
  cobrancasFalhadas: [
    { id: 1, primary: "TechStart - Cartão expirado", secondary: "R$ 2.500 - 3 tentativas", badge: { text: "Falha", variant: "destructive" as const } },
    { id: 2, primary: "FoodCorp - Limite insuficiente", secondary: "R$ 1.800 - 2 tentativas", badge: { text: "Falha", variant: "destructive" as const } },
    { id: 3, primary: "HealthPlus - Cartão recusado", secondary: "R$ 4.200 - 1 tentativa", badge: { text: "Pendente", variant: "warning" as const } },
  ],
};

// Map cargo to dashboard type
function getDashboardTypeForCargo(cargo: CargoTipo | null | undefined): DashboardData["tipo"] {
  switch (cargo) {
    case "sdr":
      return "sdr";
    case "closer":
      return "closer";
    case "gestor_trafego":
    case "social_media":
      return "operacional";
    case "financeiro":
      return "financeiro";
    default:
      return "admin";
  }
}

export function useDashboardData(): {
  dashboardData: DashboardData;
  isLoading: boolean;
  userName: string;
  greeting: string;
  formattedDate: string;
  isAdmin: boolean;
} {
  const { profile, role, user, isAdmin } = useAuth();
  const cargo = profile?.cargo as CargoTipo | null | undefined;
  
  // For admin users, always show admin dashboard
  const dashboardType = isAdmin ? "admin" : getDashboardTypeForCargo(cargo);
  
  const userName = profile?.nome || user?.email?.split("@")[0] || "Usuário";
  const greeting = getGreeting();
  const formattedDate = getFormattedDate();

  // Return mock data based on dashboard type
  let dashboardData: DashboardData;
  
  switch (dashboardType) {
    case "sdr":
      dashboardData = { tipo: "sdr", data: mockSDRData };
      break;
    case "closer":
      dashboardData = { tipo: "closer", data: mockCloserData };
      break;
    case "operacional":
      dashboardData = { tipo: "operacional", data: mockOperacionalData };
      break;
    case "financeiro":
      dashboardData = { tipo: "financeiro", data: mockFinanceiroData };
      break;
    case "admin":
    default:
      dashboardData = { tipo: "admin", data: mockAdminData };
      break;
  }

  return {
    dashboardData,
    isLoading: false, // In the future, this would be from React Query
    userName,
    greeting,
    formattedDate,
    isAdmin,
  };
}
