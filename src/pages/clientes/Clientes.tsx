import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  useClientes,
  useClientesStats,
  type UseClientesFilters,
} from "@/hooks/useClientes";
import {
  Search,
  LayoutGrid,
  LayoutList,
  Plus,
  MoreVertical,
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  Loader2,
  X,
  CalendarIcon,
  Eye,
  Pencil,
  PlusCircle,
  XCircle,
} from "lucide-react";
import { TableEmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

type ViewMode = "table" | "cards";
type StatusFilter = "todos" | "ativo" | "inadimplente" | "cancelado";

const STATUS_CONFIG = {
  ativo: { label: "Ativo", color: "bg-success/10 text-success border-success/20" },
  inadimplente: { label: "Inadimplente", color: "bg-warning/10 text-warning border-warning/20" },
  cancelado: { label: "Cancelado", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function Clientes() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [busca, setBusca] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [feeRange, setFeeRange] = useState<[number, number]>([0, 50000]);

  const filters = useMemo((): UseClientesFilters => ({
    busca: busca || undefined,
    status: statusFilter !== "todos" ? statusFilter : undefined,
    dataInicio: dateRange?.from,
    dataFim: dateRange?.to,
    feeMin: feeRange[0] > 0 ? feeRange[0] : undefined,
    feeMax: feeRange[1] < 50000 ? feeRange[1] : undefined,
  }), [busca, statusFilter, dateRange, feeRange]);

  const { data: clientes, isLoading } = useClientes(filters);
  const { data: stats } = useClientesStats();

  const hasFilters = busca || statusFilter !== "todos" || dateRange || feeRange[0] > 0 || feeRange[1] < 50000;

  const clearFilters = () => {
    setBusca("");
    setStatusFilter("todos");
    setDateRange(undefined);
    setFeeRange([0, 50000]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM/yyyy", { locale: ptBR });
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie sua base de clientes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 w-8 p-0"
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-8 w-8 p-0"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={() => navigate("/clientes/novo")}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAtivos || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.mrr || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inadimplentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats?.inadimplentes || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos este mês</CardTitle>
              <PlusCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats?.novosEsteMes || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card/50 rounded-lg border border-border/20">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ, e-mail..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inadimplente">Inadimplentes</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[220px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yy", { locale: ptBR })
                  )
                ) : (
                  "Período ativação"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[160px] justify-start text-left font-normal",
                  (feeRange[0] === 0 && feeRange[1] === 50000) && "text-muted-foreground"
                )}
              >
                {feeRange[0] === 0 && feeRange[1] === 50000
                  ? "Fee mensal"
                  : `${formatCurrency(feeRange[0])} - ${formatCurrency(feeRange[1])}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <p className="text-sm font-medium">Fee Mensal</p>
                <Slider
                  min={0}
                  max={50000}
                  step={500}
                  value={feeRange}
                  onValueChange={(v) => setFeeRange(v as [number, number])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(feeRange[0])}</span>
                  <span>{formatCurrency(feeRange[1])}</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="w-4 h-4" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "table" ? (
          <ClientesTable clientes={clientes || []} onView={(id) => navigate(`/clientes/${id}`)} />
        ) : (
          <ClientesCards clientes={clientes || []} onView={(id) => navigate(`/clientes/${id}`)} />
        )}
      </div>
    </AppLayout>
  );
}

function ClientesTable({ clientes, onView }: { clientes: any[]; onView: (id: string) => void }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM/yyyy", { locale: ptBR });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>CNPJ/CPF</TableHead>
            <TableHead>Fee Mensal</TableHead>
            <TableHead>Serviços</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Desde</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="p-0 border-0">
                <TableEmptyState
                  title="Nenhum cliente encontrado"
                  description="Ajuste os filtros ou cadastre um novo cliente para começar"
                />
              </TableCell>
            </TableRow>
          ) : (
            clientes.map((cliente) => (
              <TableRow key={cliente.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onView(cliente.id)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{cliente.nome_fantasia || cliente.razao_social}</p>
                      {cliente.nome_fantasia && (
                        <p className="text-xs text-muted-foreground">{cliente.razao_social}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {cliente.cnpj || cliente.cpf || "-"}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(cliente.fee_mensal)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {cliente.servicos?.filter((s: any) => s.status === "ativo").slice(0, 2).map((s: any) => (
                      <Badge key={s.id} variant="secondary" className="text-xs">
                        {s.servico_nome}
                      </Badge>
                    ))}
                    {cliente.servicos?.filter((s: any) => s.status === "ativo").length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{cliente.servicos.filter((s: any) => s.status === "ativo").length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs", STATUS_CONFIG[cliente.status as keyof typeof STATUS_CONFIG]?.color)}>
                    {STATUS_CONFIG[cliente.status as keyof typeof STATUS_CONFIG]?.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {cliente.data_ativacao ? formatDate(cliente.data_ativacao) : "-"}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(cliente.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Adicionar serviço
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelar cliente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ClientesCards({ clientes, onView }: { clientes: any[]; onView: (id: string) => void }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM/yyyy", { locale: ptBR });
  };

  if (clientes.length === 0) {
    return (
      <TableEmptyState
        title="Nenhum cliente encontrado"
        description="Ajuste os filtros ou cadastre um novo cliente para começar"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clientes.map((cliente) => (
        <Card
          key={cliente.id}
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => onView(cliente.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">
                    {cliente.nome_fantasia || cliente.razao_social}
                  </CardTitle>
                  {cliente.cnpj && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      CNPJ: {cliente.cnpj}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(cliente.id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Fee Mensal</p>
              <p className="text-lg font-semibold">{formatCurrency(cliente.fee_mensal)}</p>
            </div>

            <div className="flex flex-wrap gap-1">
              {cliente.servicos?.filter((s: any) => s.status === "ativo").map((s: any) => (
                <Badge key={s.id} variant="secondary" className="text-xs">
                  {s.servico_nome}
                </Badge>
              ))}
            </div>

            {cliente.servicos?.filter((s: any) => s.status === "ativo").map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{s.responsavel_nome} ({s.servico_nome})</span>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2 border-t">
              <Badge
                variant="outline"
                className={cn("text-xs", STATUS_CONFIG[cliente.status as keyof typeof STATUS_CONFIG]?.color)}
              >
                {STATUS_CONFIG[cliente.status as keyof typeof STATUS_CONFIG]?.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Desde {cliente.data_ativacao ? formatDate(cliente.data_ativacao) : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
