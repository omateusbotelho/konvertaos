import { Users, Phone, Calendar } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ListWidget, ListItem } from "@/components/dashboard/ListWidget";
import { ProgressWidget } from "@/components/dashboard/ProgressWidget";

interface StatData {
  valor: number;
  variacao?: number;
}

interface SDRDashboardData {
  meusLeads: StatData;
  followupsHoje: StatData;
  agendamentosMes: StatData;
  leadsSemAtividade: ListItem[];
  leadsFrios: ListItem[];
  metaAgendamentos: { current: number; target: number };
}

interface SDRDashboardProps {
  data: SDRDashboardData;
}

export default function SDRDashboard({ data }: SDRDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Meus Leads"
          value={data.meusLeads.valor}
          variacao={data.meusLeads.variacao}
          href="/leads"
        />
        <StatCard
          icon={Phone}
          label="Follow-ups Hoje"
          value={data.followupsHoje.valor}
          variacao={data.followupsHoje.variacao}
          href="/tarefas"
        />
        <StatCard
          icon={Calendar}
          label="Agendamentos do Mês"
          value={data.agendamentosMes.valor}
          variacao={data.agendamentosMes.variacao}
          href="/agenda"
        />
      </div>

      {/* Row 2: Lists and Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ListWidget
          title="Leads sem Atividade 24h"
          items={data.leadsSemAtividade}
          viewAllHref="/leads?filter=sem-atividade"
          emptyMessage="Todos os leads estão em dia!"
        />
        <ListWidget
          title="Leads Frios para Reativar"
          items={data.leadsFrios}
          viewAllHref="/leads?filter=frios"
          emptyMessage="Nenhum lead frio"
        />
        <ProgressWidget
          title="Meta de Agendamentos"
          current={data.metaAgendamentos.current}
          target={data.metaAgendamentos.target}
          label="agendamentos no mês"
        />
      </div>
    </div>
  );
}
