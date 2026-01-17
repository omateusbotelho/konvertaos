import { CreditCard, AlertCircle, DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ListWidget, ListItem } from "@/components/dashboard/ListWidget";
import { ChartWidget, ChartDataPoint } from "@/components/dashboard/ChartWidget";

interface StatData {
  valor: number;
  variacao?: number;
  prefix?: string;
}

interface FinanceiroDashboardData {
  cobrancasHoje: StatData;
  inadimplentes: StatData;
  comissoesAPagar: StatData;
  lucroMes: StatData;
  receitaVsDespesas: ChartDataPoint[];
  cobrancasFalhadas: ListItem[];
}

interface FinanceiroDashboardProps {
  data: FinanceiroDashboardData;
}

const chartConfig = {
  value: {
    label: "Receita",
    color: "hsl(var(--primary))",
  },
  value2: {
    label: "Despesas",
    color: "hsl(var(--chart-2))",
  },
};

export default function FinanceiroDashboard({ data }: FinanceiroDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CreditCard}
          label="Cobranças Hoje"
          value={data.cobrancasHoje.valor}
          variacao={data.cobrancasHoje.variacao}
          href="/financeiro/cobrancas"
        />
        <StatCard
          icon={AlertCircle}
          label="Inadimplentes"
          value={data.inadimplentes.valor}
          variacao={data.inadimplentes.variacao}
          href="/financeiro/inadimplentes"
        />
        <StatCard
          icon={DollarSign}
          label="Comissões a Pagar"
          value={data.comissoesAPagar.valor.toLocaleString("pt-BR")}
          prefix="R$ "
          variacao={data.comissoesAPagar.variacao}
          href="/financeiro/comissoes"
        />
        <StatCard
          icon={TrendingUp}
          label="Lucro do Mês"
          value={data.lucroMes.valor.toLocaleString("pt-BR")}
          prefix="R$ "
          variacao={data.lucroMes.variacao}
          href="/financeiro/relatorios"
        />
      </div>

      {/* Row 2: Chart and List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartWidget
          title="Receita vs Despesas"
          type="bar"
          data={data.receitaVsDespesas}
          config={chartConfig}
          height={220}
        />
        <ListWidget
          title="Cobranças Falhadas"
          items={data.cobrancasFalhadas}
          viewAllHref="/financeiro/cobrancas?filter=falhadas"
          emptyMessage="Nenhuma cobrança falhada"
        />
      </div>
    </div>
  );
}
