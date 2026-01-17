import { Users, ClipboardList, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ListWidget, ListItem } from "@/components/dashboard/ListWidget";
import { ProgressWidget } from "@/components/dashboard/ProgressWidget";

interface StatData {
  valor: number;
  variacao?: number;
}

interface OperacionalDashboardData {
  meusClientes: StatData;
  tarefasPendentes: StatData;
  tarefasAtrasadas: StatData;
  onboardings: ListItem[];
  tarefasVencendoHoje: ListItem[];
  entregasMes: { current: number; target: number };
}

interface OperacionalDashboardProps {
  data: OperacionalDashboardData;
}

export default function OperacionalDashboard({ data }: OperacionalDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Meus Clientes"
          value={data.meusClientes.valor}
          variacao={data.meusClientes.variacao}
          href="/clientes"
        />
        <StatCard
          icon={ClipboardList}
          label="Tarefas Pendentes"
          value={data.tarefasPendentes.valor}
          variacao={data.tarefasPendentes.variacao}
          href="/tarefas"
        />
        <StatCard
          icon={AlertTriangle}
          label="Tarefas Atrasadas"
          value={data.tarefasAtrasadas.valor}
          variacao={data.tarefasAtrasadas.variacao}
          href="/tarefas?filter=atrasadas"
        />
      </div>

      {/* Row 2: Lists and Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ListWidget
          title="Onboardings em Andamento"
          items={data.onboardings}
          viewAllHref="/onboardings"
          emptyMessage="Nenhum onboarding ativo"
        />
        <ListWidget
          title="Tarefas Vencendo Hoje"
          items={data.tarefasVencendoHoje}
          viewAllHref="/tarefas?filter=hoje"
          emptyMessage="Nenhuma tarefa vencendo hoje"
        />
        <ProgressWidget
          title="Entregas do Mês"
          current={data.entregasMes.current}
          target={data.entregasMes.target}
          label="entregas concluídas"
        />
      </div>
    </div>
  );
}
