import { Calendar, FileText, Target, DollarSign, TrendingUp, Clock, Crosshair, BarChart3 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ListWidget, ListItem } from "@/components/dashboard/ListWidget";
import { ChartWidget, ChartDataPoint } from "@/components/dashboard/ChartWidget";
import { KonvertaCard, KonvertaCardHeader, KonvertaCardTitle } from "@/components/ui/konverta-card";
import { Progress } from "@/components/ui/progress";

interface StatData {
  valor: number;
  variacao?: number;
  prefix?: string;
  suffix?: string;
}

interface WinRateByOrigem {
  origem: string;
  total: number;
  ganhos: number;
  taxa: number;
}

interface CloserDashboardData {
  reunioesHoje: StatData;
  propostasPendentes: StatData;
  fechamentosMes: StatData;
  comissaoAcumulada: StatData;
  taxaConversao: StatData;
  ticketMedio: StatData;
  tempoCicloMedio: StatData;
  forecastMensal: StatData;
  winRatePorOrigem: WinRateByOrigem[];
  evolucaoMensal: ChartDataPoint[];
  propostasSemResposta: ListItem[];
  proximasReunioes: ListItem[];
}

interface CloserDashboardProps {
  data: CloserDashboardData;
}

const chartConfig = {
  value: {
    label: "Fechados",
    color: "hsl(var(--primary))",
  },
  value2: {
    label: "Perdidos",
    color: "hsl(var(--destructive))",
  },
};

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
          href="/calendario"
        />
        <StatCard
          icon={FileText}
          label="Propostas Pendentes"
          value={data.propostasPendentes.valor}
          variacao={data.propostasPendentes.variacao}
          href="/comercial/closer"
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
          href="/minhas-comissoes"
        />
      </div>

      {/* Row 2: Advanced Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Taxa de Conversão"
          value={data.taxaConversao.valor}
          suffix="%"
          variacao={data.taxaConversao.variacao}
        />
        <StatCard
          icon={BarChart3}
          label="Ticket Médio"
          value={data.ticketMedio.valor.toLocaleString("pt-BR")}
          prefix="R$ "
          variacao={data.ticketMedio.variacao}
        />
        <StatCard
          icon={Clock}
          label="Tempo de Ciclo"
          value={data.tempoCicloMedio.valor}
          suffix=" dias"
          variacao={data.tempoCicloMedio.variacao}
        />
        <StatCard
          icon={Crosshair}
          label="Forecast Mensal"
          value={data.forecastMensal.valor.toLocaleString("pt-BR")}
          prefix="R$ "
        />
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Evolução Mensal - Ganhos vs Perdas */}
        <ChartWidget
          title="Evolução Mensal (Ganhos vs Perdas)"
          type="bar"
          data={data.evolucaoMensal}
          config={chartConfig}
          height={220}
        />

        {/* Win Rate por Origem */}
        <WinRateCard data={data.winRatePorOrigem} />
      </div>

      {/* Row 4: Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListWidget
          title="Propostas sem Resposta 48h"
          items={data.propostasSemResposta}
          viewAllHref="/comercial/closer?filter=sem-resposta"
          emptyMessage="Todas as propostas foram respondidas!"
        />
        <ListWidget
          title="Próximas Reuniões"
          items={data.proximasReunioes}
          viewAllHref="/calendario"
          emptyMessage="Nenhuma reunião agendada"
        />
      </div>
    </div>
  );
}

// Componente para Win Rate por Origem
function WinRateCard({ data }: { data: WinRateByOrigem[] }) {
  const maxTaxa = Math.max(...data.map(d => d.taxa), 1);

  return (
    <KonvertaCard className="h-full flex flex-col">
      <KonvertaCardHeader>
        <KonvertaCardTitle>Win Rate por Origem</KonvertaCardTitle>
      </KonvertaCardHeader>

      <div className="flex-1 space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Sem dados suficientes
          </p>
        ) : (
          data.map((item, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground truncate max-w-[140px]">
                  {item.origem}
                </span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">
                    {item.ganhos}/{item.total}
                  </span>
                  <span className="font-semibold text-foreground min-w-[45px] text-right">
                    {item.taxa}%
                  </span>
                </div>
              </div>
              <Progress 
                value={(item.taxa / maxTaxa) * 100} 
                className="h-2"
              />
            </div>
          ))
        )}
      </div>
    </KonvertaCard>
  );
}
