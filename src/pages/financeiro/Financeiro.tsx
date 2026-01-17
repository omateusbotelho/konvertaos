import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KonvertaCard } from "@/components/ui/konverta-card";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartWidget } from "@/components/dashboard/ChartWidget";
import { ListWidget } from "@/components/dashboard/ListWidget";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, TrendingDown, BarChart3, AlertTriangle, Download, ChevronRight, CalendarDays, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useResumoFinanceiro, useCobrancas, useComissoes, useCustosFixos, useAprovarComissoes, useMarcarComissoesPagas } from "@/hooks/useFinanceiro";

const meses = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const anos = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() - 2 + i;
  return { value: String(year), label: String(year) };
});

const statusColors: Record<string, string> = {
  pendente: "bg-warning text-warning-foreground",
  pago: "bg-success text-success-foreground",
  atrasado: "bg-destructive text-destructive-foreground",
  cancelado: "bg-muted text-muted-foreground",
  falhou: "bg-destructive text-destructive-foreground",
  aprovada: "bg-info text-info-foreground",
};

export default function Financeiro() {
  const currentDate = new Date();
  const [mes, setMes] = useState(String(currentDate.getMonth() + 1));
  const [ano, setAno] = useState(String(currentDate.getFullYear()));
  const [periodoTipo, setPeriodoTipo] = useState("mes");
  const [selectedComissoes, setSelectedComissoes] = useState<string[]>([]);

  const { data: resumo, isLoading: resumoLoading } = useResumoFinanceiro(Number(mes), Number(ano));
  const { data: cobrancas, isLoading: cobrancasLoading } = useCobrancas({ mes: Number(mes), ano: Number(ano) });
  const { data: comissoes, isLoading: comissoesLoading } = useComissoes({ status: "pendente" });
  const { data: custosFixos, isLoading: custosFixosLoading } = useCustosFixos();

  const aprovarComissoes = useAprovarComissoes();
  const marcarPagas = useMarcarComissoesPagas();

  const proximasCobrancas = cobrancas?.filter(c => {
    const vencimento = new Date(c.data_vencimento);
    const hoje = new Date();
    const em7dias = new Date();
    em7dias.setDate(hoje.getDate() + 7);
    return c.status === "pendente" && vencimento >= hoje && vencimento <= em7dias;
  }).slice(0, 5);

  const custosFixosAtivos = custosFixos?.filter(c => c.ativo);
  const totalCustosFixos = custosFixosAtivos?.reduce((sum, c) => sum + c.valor, 0) || 0;

  const handleSelectAllComissoes = (checked: boolean) => {
    if (checked) {
      setSelectedComissoes(comissoes?.map(c => c.id) || []);
    } else {
      setSelectedComissoes([]);
    }
  };

  const handleSelectComissao = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedComissoes([...selectedComissoes, id]);
    } else {
      setSelectedComissoes(selectedComissoes.filter(cid => cid !== id));
    }
  };

  // Chart data for Receita vs Despesas
  const chartConfig = {
    receita: { label: "Receita", color: "hsl(var(--success))" },
    despesas: { label: "Despesas", color: "hsl(var(--destructive))" },
  };

  const receitaDespesasData = [
    { name: "Receita", value: resumo?.receita || 0 },
    { name: "Despesas", value: resumo?.despesa || 0 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1>Financeiro</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Período:</span>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map(a => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ToggleGroup type="single" value={periodoTipo} onValueChange={(v) => v && setPeriodoTipo(v)}>
              <ToggleGroupItem value="mes" size="sm">Mês</ToggleGroupItem>
              <ToggleGroupItem value="trimestre" size="sm">Trimestre</ToggleGroupItem>
              <ToggleGroupItem value="ano" size="sm">Ano</ToggleGroupItem>
            </ToggleGroup>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="Receita"
            value={resumo?.receita || 0}
            isLoading={resumoLoading}
            prefix="R$ "
          />
          <StatCard
            icon={TrendingDown}
            label="Despesas"
            value={resumo?.despesa || 0}
            isLoading={resumoLoading}
            prefix="R$ "
          />
          <StatCard
            icon={BarChart3}
            label="Lucro Líquido"
            value={resumo?.lucro || 0}
            isLoading={resumoLoading}
            prefix="R$ "
          />
          <StatCard
            icon={AlertTriangle}
            label="Inadimplência"
            value={resumo?.inadimplencia || 0}
            isLoading={resumoLoading}
            prefix="R$ "
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartWidget
            title="Receita vs Despesas"
            type="bar"
            data={receitaDespesasData}
            config={chartConfig}
            isLoading={resumoLoading}
          />
          <ChartWidget
            title="Distribuição de Receita por Serviço"
            type="pie"
            data={[
              { name: "Tráfego", value: 45 },
              { name: "Social Media", value: 35 },
              { name: "Outros", value: 20 },
            ]}
            config={{
              trafego: { label: "Tráfego", color: "hsl(var(--primary))" },
              social: { label: "Social Media", color: "hsl(var(--success))" },
              outros: { label: "Outros", color: "hsl(var(--warning))" },
            }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Tables */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cobranças */}
            <KonvertaCard>
              <div className="flex items-center justify-between mb-4">
                <h3>Cobranças do Período</h3>
                <Button size="sm" asChild>
                  <Link to="/financeiro/cobrancas">Ver todas</Link>
                </Button>
              </div>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Forma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cobrancasLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : cobrancas?.slice(0, 5).map(cobranca => (
                      <TableRow key={cobranca.id}>
                        <TableCell className="font-medium">
                          {cobranca.cliente?.nome_fantasia || cobranca.cliente?.razao_social}
                        </TableCell>
                        <TableCell>R$ {cobranca.valor.toLocaleString("pt-BR")}</TableCell>
                        <TableCell>{format(new Date(cobranca.data_vencimento), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[cobranca.status]}>
                            {cobranca.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{cobranca.forma_pagamento || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </KonvertaCard>

            {/* Comissões Pendentes */}
            <KonvertaCard>
              <div className="flex items-center justify-between mb-4">
                <h3>Comissões Pendentes</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selectedComissoes.length === 0}
                    onClick={() => aprovarComissoes.mutate(selectedComissoes)}
                  >
                    Aprovar Selecionadas
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selectedComissoes.length === 0}
                    onClick={() => marcarPagas.mutate(selectedComissoes)}
                  >
                    Marcar como Pagas
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedComissoes.length === (comissoes?.length || 0) && comissoes?.length > 0}
                          onCheckedChange={handleSelectAllComissoes}
                        />
                      </TableHead>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Referência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comissoesLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : comissoes?.slice(0, 5).map(comissao => (
                      <TableRow key={comissao.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedComissoes.includes(comissao.id)}
                            onCheckedChange={(checked) => handleSelectComissao(comissao.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{comissao.colaborador?.nome}</TableCell>
                        <TableCell className="uppercase">{comissao.tipo_colaborador}</TableCell>
                        <TableCell>
                          {comissao.cliente?.nome_fantasia || comissao.cliente?.razao_social}
                        </TableCell>
                        <TableCell>R$ {comissao.valor.toLocaleString("pt-BR")}</TableCell>
                        <TableCell>
                          {format(new Date(comissao.data_referencia), "MMM/yyyy", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="mt-4 pt-4 border-t border-border/20">
                <Link to="/financeiro/comissoes" className="flex items-center text-sm text-primary hover:underline">
                  Ver todas as comissões <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </KonvertaCard>
          </div>

          {/* Right: Widgets */}
          <div className="space-y-6">
            {/* Próximas Cobranças */}
            <KonvertaCard>
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h3>Próximas Cobranças (7 dias)</h3>
              </div>
              <div className="space-y-3">
                {proximasCobrancas?.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <div>
                      <p className="font-medium text-sm">
                        {c.cliente?.nome_fantasia || c.cliente?.razao_social}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(c.data_vencimento), "dd/MM")}
                      </p>
                    </div>
                    <p className="font-semibold">R$ {c.valor.toLocaleString("pt-BR")}</p>
                  </div>
                ))}
                {(!proximasCobrancas || proximasCobrancas.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma cobrança nos próximos 7 dias
                  </p>
                )}
              </div>
            </KonvertaCard>

            {/* Custos Fixos */}
            <KonvertaCard>
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="h-5 w-5 text-primary" />
                <h3>Custos Fixos do Mês</h3>
              </div>
              <div className="space-y-3">
                {custosFixosLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : (
                  <>
                    {custosFixosAtivos?.slice(0, 4).map(c => (
                      <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                        <p className="text-sm capitalize">{c.categoria}</p>
                        <p className="font-medium">R$ {c.valor.toLocaleString("pt-BR")}</p>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between font-semibold">
                      <p>Total</p>
                      <p>R$ {totalCustosFixos.toLocaleString("pt-BR")}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border/20">
                <Link to="/financeiro/custos" className="flex items-center text-sm text-primary hover:underline">
                  Gerenciar custos <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </KonvertaCard>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
