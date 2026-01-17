import { Calendar, FileText, Target, DollarSign } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ListWidget, ListItem } from "@/components/dashboard/ListWidget";

interface StatData {
  valor: number;
  variacao?: number;
  prefix?: string;
}

interface CloserDashboardData {
  reunioesHoje: StatData;
  propostasPendentes: StatData;
  fechamentosMes: StatData;
  comissaoAcumulada: StatData;
  propostasSemResposta: ListItem[];
  proximasReunioes: ListItem[];
}

interface CloserDashboardProps {
  data: CloserDashboardData;
}

export default function CloserDashboard({ data }: CloserDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Reuniões Hoje"
          value={data.reunioesHoje.valor}
          variacao={data.reunioesHoje.variacao}
          href="/agenda"
        />
        <StatCard
          icon={FileText}
          label="Propostas Pendentes"
          value={data.propostasPendentes.valor}
          variacao={data.propostasPendentes.variacao}
          href="/propostas"
        />
        <StatCard
          icon={Target}
          label="Fechamentos do Mês"
          value={data.fechamentosMes.valor}
          variacao={data.fechamentosMes.variacao}
          href="/clientes"
        />
        <StatCard
          icon={DollarSign}
          label="Comissão Acumulada"
          value={data.comissaoAcumulada.valor.toLocaleString("pt-BR")}
          prefix="R$ "
          variacao={data.comissaoAcumulada.variacao}
          href="/financeiro"
        />
      </div>

      {/* Row 2: Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListWidget
          title="Propostas sem Resposta 48h"
          items={data.propostasSemResposta}
          viewAllHref="/propostas?filter=sem-resposta"
          emptyMessage="Todas as propostas foram respondidas!"
        />
        <ListWidget
          title="Próximas Reuniões"
          items={data.proximasReunioes}
          viewAllHref="/agenda"
          emptyMessage="Nenhuma reunião agendada"
        />
      </div>
    </div>
  );
}
