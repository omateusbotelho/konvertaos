import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KonvertaCard } from "@/components/ui/konverta-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useComissoes, useAprovarComissoes, useMarcarComissoesPagas } from "@/hooks/useFinanceiro";

const statusColors: Record<string, string> = {
  pendente: "bg-warning text-warning-foreground",
  aprovada: "bg-info text-info-foreground",
  paga: "bg-success text-success-foreground",
  cancelada: "bg-muted text-muted-foreground",
};

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

export default function Comissoes() {
  const currentDate = new Date();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [mes, setMes] = useState(String(currentDate.getMonth() + 1));
  const [ano, setAno] = useState(String(currentDate.getFullYear()));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: comissoes, isLoading } = useComissoes({
    status: statusFilter || undefined,
    mes: Number(mes),
    ano: Number(ano),
  });

  const aprovarComissoes = useAprovarComissoes();
  const marcarPagas = useMarcarComissoesPagas();

  const filteredComissoes = comissoes?.filter(c => {
    if (!search) return true;
    const colaborador = c.colaborador?.nome || "";
    const cliente = c.cliente?.nome_fantasia || c.cliente?.razao_social || "";
    return (
      colaborador.toLowerCase().includes(search.toLowerCase()) ||
      cliente.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredComissoes?.map(c => c.id) || []);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(cid => cid !== id));
    }
  };

  const totalSelecionado = filteredComissoes
    ?.filter(c => selectedIds.includes(c.id))
    .reduce((sum, c) => sum + c.valor, 0) || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/financeiro">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1>Comissões</h1>
            <p className="text-muted-foreground">Gerencie as comissões dos colaboradores</p>
          </div>
        </div>

        {/* Filters */}
        <KonvertaCard>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por colaborador ou cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovada">Aprovada</SelectItem>
                <SelectItem value="paga">Paga</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
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
                {[2024, 2025, 2026, 2027].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </KonvertaCard>

        {/* Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-primary/10 p-4 rounded-lg">
            <p className="text-sm">
              {selectedIds.length} comissões selecionadas • Total: R$ {totalSelecionado.toLocaleString("pt-BR")}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => aprovarComissoes.mutate(selectedIds)}
                disabled={aprovarComissoes.isPending}
              >
                Aprovar Selecionadas
              </Button>
              <Button
                size="sm"
                onClick={() => marcarPagas.mutate(selectedIds)}
                disabled={marcarPagas.isPending}
              >
                Marcar como Pagas
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <KonvertaCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.length === (filteredComissoes?.length || 0) && filteredComissoes?.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredComissoes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma comissão encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredComissoes?.map(comissao => (
                  <TableRow key={comissao.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(comissao.id)}
                        onCheckedChange={(checked) => handleSelect(comissao.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{comissao.colaborador?.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">
                        {comissao.tipo_colaborador}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {comissao.cliente?.nome_fantasia || comissao.cliente?.razao_social}
                    </TableCell>
                    <TableCell>R$ {comissao.valor.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      {format(new Date(comissao.data_referencia), "MMM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[comissao.status]}>
                        {comissao.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {comissao.data_pagamento
                        ? format(new Date(comissao.data_pagamento), "dd/MM/yyyy")
                        : "-"}
                    </TableCell>
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
