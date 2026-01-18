import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KonvertaCard } from "@/components/ui/konverta-card";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartWidget } from "@/components/dashboard/ChartWidget";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Clock, CalendarDays, TrendingUp, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMinhasComissoes } from "@/hooks/useFinanceiro";

const statusColors: Record<string, string> = {
  pendente: "bg-warning/10 text-warning border-warning/20",
  aprovada: "bg-info/10 text-info border-info/20",
  paga: "bg-success/10 text-success border-success/20",
  cancelada: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function MinhasComissoes() {
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const { data: comissoes, isLoading } = useMinhasComissoes();

  const totalRecebido = comissoes?.filter(c => c.status === "paga").reduce((sum, c) => sum + c.valor, 0) || 0;
  const pendente = comissoes?.filter(c => c.status === "pendente" || c.status === "aprovada").reduce((sum, c) => sum + c.valor, 0) || 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const esteMes = comissoes?.filter(c => {
    const d = new Date(c.data_referencia);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, c) => sum + c.valor, 0) || 0;

  const totalAno = comissoes?.filter(c => {
    const d = new Date(c.data_referencia);
    return d.getFullYear() === Number(ano) && c.status === "paga";
  }).reduce((sum, c) => sum + c.valor, 0) || 0;

  // Dados para gráfico de evolução (últimos 6 meses)
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const mes = date.getMonth();
    const anoRef = date.getFullYear();
    
    const valor = comissoes?.filter(c => {
      const d = new Date(c.data_referencia);
      return d.getMonth() === mes && d.getFullYear() === anoRef && c.status === 'paga';
    }).reduce((sum, c) => sum + c.valor, 0) || 0;
    
    return {
      name: format(date, "MMM", { locale: ptBR }),
      value: valor,
    };
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Minhas Comissões</h1>
            <p className="text-muted-foreground">Acompanhe suas comissões e ganhos</p>
          </div>
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(a => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={CheckCircle} label="Total Recebido" value={totalRecebido} prefix="R$ " isLoading={isLoading} />
          <StatCard icon={Clock} label="Pendente" value={pendente} prefix="R$ " isLoading={isLoading} />
          <StatCard icon={CalendarDays} label="Este Mês" value={esteMes} prefix="R$ " isLoading={isLoading} />
          <StatCard icon={TrendingUp} label={`Total ${ano}`} value={totalAno} prefix="R$ " isLoading={isLoading} />
        </div>

        {/* Gráfico de evolução */}
        <ChartWidget
          title="Evolução das Comissões (Últimos 6 meses)"
          data={chartData}
          type="bar"
          config={{ value: { label: "Comissões Pagas", color: "hsl(var(--primary))" } }}
        />

        {/* Histórico */}
        <KonvertaCard>
          <h3 className="text-lg font-semibold mb-4">Histórico de Comissões</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : comissoes?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma comissão encontrada</TableCell></TableRow>
              ) : (
                comissoes?.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.cliente?.nome_fantasia || c.cliente?.razao_social}</TableCell>
                    <TableCell>{format(new Date(c.data_referencia), "MMM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>R$ {c.valor.toLocaleString("pt-BR")}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[c.status]}>{c.status}</Badge></TableCell>
                    <TableCell>{c.data_pagamento ? format(new Date(c.data_pagamento), "dd/MM/yyyy") : "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </KonvertaCard>
      </div>
    </AppLayout>
  );
}
