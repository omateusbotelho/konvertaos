import {
  DollarSign,
  Users,
  UserPlus,
  AlertTriangle,
  UserMinus,
  ClipboardList,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ListWidget, ListItem } from "@/components/dashboard/ListWidget";
import { AlertWidget, AlertItem } from "@/components/dashboard/AlertWidget";

interface StatData {
  valor: number;
  variacao?: number;
  prefix?: string;
  suffix?: string;
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

interface AdminDashboardProps {
  data: AdminDashboardData;
}

export default function AdminDashboard({ data }: AdminDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          label="Receita do Mês"
          value={data.receitaMes.valor.toLocaleString("pt-BR")}
          prefix="R$ "
          variacao={data.receitaMes.variacao}
          href="/financeiro"
        />
        <StatCard
          icon={UserPlus}
          label="Leads Novos"
          value={data.leadsNovos.valor}
          variacao={data.leadsNovos.variacao}
          href="/comercial/sdr"
        />
        <StatCard
          icon={AlertTriangle}
          label="Tarefas Atrasadas"
          value={data.tarefasAtrasadas.valor}
          variacao={data.tarefasAtrasadas.variacao}
          href="/tarefas"
        />
      </div>

      {/* Row 2: Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          label="Inadimplência"
          value={data.inadimplencia.valor.toLocaleString("pt-BR")}
          prefix="R$ "
          variacao={data.inadimplencia.variacao}
          href="/financeiro"
        />
        <StatCard
          icon={UserMinus}
          label="Churn do Mês"
          value={data.churnMes.valor}
          variacao={data.churnMes.variacao}
          suffix=" clientes"
          href="/clientes"
        />
        <StatCard
          icon={Users}
          label="Clientes Ativos"
          value={data.clientesAtivos.valor}
          variacao={data.clientesAtivos.variacao}
          href="/clientes"
        />
      </div>

      {/* Row 3: Lists and Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ListWidget
          title="Reuniões de Hoje"
          items={data.reunioesHoje}
          viewAllHref="/calendario"
          emptyMessage="Nenhuma reunião agendada"
        />
        <ListWidget
          title="Aprovações Pendentes"
          items={data.aprovacoesPendentes}
          viewAllHref="/configuracoes/ausencias"
          emptyMessage="Nenhuma aprovação pendente"
        />
        <AlertWidget
          title="Alertas Críticos"
          alerts={data.alertasCriticos}
          emptyMessage="Tudo em ordem!"
        />
      </div>
    </div>
  );
}
