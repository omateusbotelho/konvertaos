import { AppLayout } from "@/components/layout/AppLayout";
import { KonvertaCard } from "@/components/ui/konverta-card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Clock, CalendarDays, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMinhasComissoes } from "@/hooks/useFinanceiro";

const statusColors: Record<string, string> = {
  pendente: "bg-warning text-warning-foreground",
  aprovada: "bg-info text-info-foreground",
  paga: "bg-success text-success-foreground",
  cancelada: "bg-muted text-muted-foreground",
};

export default function MinhasComissoes() {
  const { data: comissoes, isLoading } = useMinhasComissoes();

  const totalGeral = comissoes?.filter(c => c.status === "paga").reduce((sum, c) => sum + c.valor, 0) || 0;
  const pendente = comissoes?.filter(c => c.status === "pendente" || c.status === "aprovada").reduce((sum, c) => sum + c.valor, 0) || 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const esteMes = comissoes?.filter(c => {
    const d = new Date(c.data_referencia);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, c) => sum + c.valor, 0) || 0;

  const esteAno = comissoes?.filter(c => {
    const d = new Date(c.data_referencia);
    return d.getFullYear() === currentYear && c.status === "paga";
  }).reduce((sum, c) => sum + c.valor, 0) || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1>Minhas Comissões</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Total Recebido" value={totalGeral} prefix="R$ " isLoading={isLoading} />
          <StatCard icon={Clock} label="Pendente" value={pendente} prefix="R$ " isLoading={isLoading} />
          <StatCard icon={CalendarDays} label="Este Mês" value={esteMes} prefix="R$ " isLoading={isLoading} />
          <StatCard icon={TrendingUp} label="Este Ano" value={esteAno} prefix="R$ " isLoading={isLoading} />
        </div>

        {/* History */}
        <KonvertaCard>
          <h3 className="mb-4">Histórico</h3>
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
                    <TableCell><Badge className={statusColors[c.status]}>{c.status}</Badge></TableCell>
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
