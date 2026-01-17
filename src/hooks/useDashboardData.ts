import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Database } from "@/integrations/supabase/types";
import {
  fetchAdminDashboard,
  fetchSDRDashboard,
  fetchCloserDashboard,
  fetchOperacionalDashboard,
  fetchFinanceiroDashboard,
  AdminDashboardData,
  SDRDashboardData,
  CloserDashboardData,
  OperacionalDashboardData,
  FinanceiroDashboardData,
} from "@/services/dashboard.service";

type CargoTipo = Database["public"]["Enums"]["cargo_tipo"];

// Re-export types for external use
export type { AdminDashboardData, SDRDashboardData, CloserDashboardData, OperacionalDashboardData, FinanceiroDashboardData };

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

// Dashboard data union type
export type DashboardData =
  | { tipo: "admin"; data: AdminDashboardData }
  | { tipo: "sdr"; data: SDRDashboardData }
  | { tipo: "closer"; data: CloserDashboardData }
  | { tipo: "operacional"; data: OperacionalDashboardData }
  | { tipo: "financeiro"; data: FinanceiroDashboardData };

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

// Fetch dashboard data based on type
async function fetchDashboardData(
  dashboardType: DashboardData["tipo"],
  userId?: string
): Promise<DashboardData> {
  switch (dashboardType) {
    case "sdr":
      if (!userId) throw new Error("User ID required for SDR dashboard");
      return { tipo: "sdr", data: await fetchSDRDashboard(userId) };
    case "closer":
      if (!userId) throw new Error("User ID required for Closer dashboard");
      return { tipo: "closer", data: await fetchCloserDashboard(userId) };
    case "operacional":
      if (!userId) throw new Error("User ID required for Operacional dashboard");
      return { tipo: "operacional", data: await fetchOperacionalDashboard(userId) };
    case "financeiro":
      return { tipo: "financeiro", data: await fetchFinanceiroDashboard() };
    case "admin":
    default:
      return { tipo: "admin", data: await fetchAdminDashboard() };
  }
}

// Default empty data for loading state
const emptyAdminData: AdminDashboardData = {
  receitaMes: { valor: 0, prefix: "R$ " },
  leadsNovos: { valor: 0 },
  tarefasAtrasadas: { valor: 0 },
  inadimplencia: { valor: 0, prefix: "R$ " },
  churnMes: { valor: 0 },
  clientesAtivos: { valor: 0 },
  reunioesHoje: [],
  aprovacoesPendentes: [],
  alertasCriticos: [],
};

const emptySDRData: SDRDashboardData = {
  meusLeads: { valor: 0 },
  followupsHoje: { valor: 0 },
  agendamentosMes: { valor: 0 },
  leadsSemAtividade: [],
  leadsFrios: [],
  metaAgendamentos: { current: 0, target: 25 },
};

const emptyCloserData: CloserDashboardData = {
  reunioesHoje: { valor: 0 },
  propostasPendentes: { valor: 0 },
  fechamentosMes: { valor: 0 },
  comissaoAcumulada: { valor: 0, prefix: "R$ " },
  propostasSemResposta: [],
  proximasReunioes: [],
};

const emptyOperacionalData: OperacionalDashboardData = {
  meusClientes: { valor: 0 },
  tarefasPendentes: { valor: 0 },
  tarefasAtrasadas: { valor: 0 },
  onboardings: [],
  tarefasVencendoHoje: [],
  entregasMes: { current: 0, target: 60 },
};

const emptyFinanceiroData: FinanceiroDashboardData = {
  cobrancasHoje: { valor: 0 },
  inadimplentes: { valor: 0 },
  comissoesAPagar: { valor: 0, prefix: "R$ " },
  lucroMes: { valor: 0, prefix: "R$ " },
  receitaVsDespesas: [],
  cobrancasFalhadas: [],
};

function getEmptyDashboardData(tipo: DashboardData["tipo"]): DashboardData {
  switch (tipo) {
    case "sdr":
      return { tipo: "sdr", data: emptySDRData };
    case "closer":
      return { tipo: "closer", data: emptyCloserData };
    case "operacional":
      return { tipo: "operacional", data: emptyOperacionalData };
    case "financeiro":
      return { tipo: "financeiro", data: emptyFinanceiroData };
    case "admin":
    default:
      return { tipo: "admin", data: emptyAdminData };
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
  const { profile, user, isAdmin } = useAuth();
  const cargo = profile?.cargo as CargoTipo | null | undefined;

  // For admin users, always show admin dashboard
  const dashboardType = isAdmin ? "admin" : getDashboardTypeForCargo(cargo);
  const userId = profile?.id;

  const userName = profile?.nome || user?.email?.split("@")[0] || "Usuário";
  const greeting = getGreeting();
  const formattedDate = getFormattedDate();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", dashboardType, userId],
    queryFn: () => fetchDashboardData(dashboardType, userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    enabled: !!profile, // Only fetch when profile is loaded
  });

  return {
    dashboardData: data ?? getEmptyDashboardData(dashboardType),
    isLoading: isLoading || !profile,
    userName,
    greeting,
    formattedDate,
    isAdmin,
  };
}
