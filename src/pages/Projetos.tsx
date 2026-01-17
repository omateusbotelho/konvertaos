import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  useProjetos,
  useProjetosStats,
  type UseProjetosFilters,
} from "@/hooks/useProjetos";
import { useClientes } from "@/hooks/useClientes";
import {
  Search,
  LayoutGrid,
  LayoutList,
  Plus,
  MoreVertical,
  FolderKanban,
  CheckSquare,
  AlertCircle,
  Rocket,
  Loader2,
  X,
  Eye,
  Pencil,
  Pause,
  CheckCircle2,
  Archive,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ViewMode = "cards" | "table";
type StatusFilter = "todos" | "ativo" | "pausado" | "concluido" | "cancelado";

const STATUS_CONFIG = {
  ativo: { label: "Ativo", color: "bg-success/10 text-success border-success/20", icon: "🟢" },
  pausado: { label: "Pausado", color: "bg-warning/10 text-warning border-warning/20", icon: "⏸️" },
  concluido: { label: "Concluído", color: "bg-primary/10 text-primary border-primary/20", icon: "✅" },
  cancelado: { label: "Cancelado", color: "bg-destructive/10 text-destructive border-destructive/20", icon: "❌" },
};

export default function Projetos() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [busca, setBusca] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [clienteFilter, setClienteFilter] = useState<string>("");
  const [comAtrasadas, setComAtrasadas] = useState(false);

  const filters = useMemo((): UseProjetosFilters => ({
    busca: busca || undefined,
    status: statusFilter !== "todos" ? statusFilter : undefined,
    clienteId: clienteFilter || undefined,
    comAtrasadas: comAtrasadas || undefined,
  }), [busca, statusFilter, clienteFilter, comAtrasadas]);

  const { data: projetos, isLoading } = useProjetos(filters);
  const { data: stats } = useProjetosStats();
  const { data: clientes } = useClientes({});

  const hasFilters = busca || statusFilter !== "todos" || clienteFilter || comAtrasadas;

  const clearFilters = () => {
    setBusca("");
    setStatusFilter("todos");
    setClienteFilter("");
    setComAtrasadas(false);
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Projetos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie projetos e acompanhe o progresso
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-8 w-8 p-0"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 w-8 p-0"
              >
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={() => navigate("/projetos/novo")}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.projetosAtivos || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.tarefasPendentes || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats?.tarefasAtrasadas || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Onboardings</CardTitle>
              <Rocket className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats?.onboardings || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card/50 rounded-lg border border-border/20">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={clienteFilter} onValueChange={setClienteFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os clientes</SelectItem>
              {clientes?.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nome_fantasia || cliente.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="pausado">Pausados</SelectItem>
              <SelectItem value="concluido">Concluídos</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch
              id="com-atrasadas"
              checked={comAtrasadas}
              onCheckedChange={setComAtrasadas}
            />
            <Label htmlFor="com-atrasadas" className="text-sm cursor-pointer">
              Com atrasadas
            </Label>
          </div>

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
        ) : viewMode === "cards" ? (
          <ProjetosCards projetos={projetos || []} onView={(id) => navigate(`/projetos/${id}`)} />
        ) : (
          <ProjetosTable projetos={projetos || []} onView={(id) => navigate(`/projetos/${id}`)} />
        )}
      </div>
    </AppLayout>
  );
}

function ProjetosCards({ projetos, onView }: { projetos: any[]; onView: (id: string) => void }) {
  if (projetos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum projeto encontrado
      </div>
    );
  }

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projetos.map((projeto) => {
        const progress = projeto.total_tarefas > 0
          ? Math.round((projeto.tarefas_concluidas / projeto.total_tarefas) * 100)
          : 0;

        return (
          <Card
            key={projeto.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onView(projeto.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-base line-clamp-1">
                      {projeto.nome}
                    </CardTitle>
                    {projeto.is_onboarding && (
                      <Badge variant="secondary" className="text-xs">
                        <Rocket className="w-3 h-3 mr-1" />
                        Onboarding
                      </Badge>
                    )}
                  </div>
                  {projeto.servico_nome && (
                    <Badge variant="outline" className="text-xs">
                      {projeto.servico_nome}
                    </Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(projeto.id)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pause className="w-4 h-4 mr-2" />
                      Pausar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Concluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p>Cliente: <span className="text-foreground">{projeto.cliente_nome_fantasia || projeto.cliente_nome}</span></p>
                {projeto.responsavel_nome && (
                  <p className="flex items-center gap-1 mt-1">
                    Responsável: 
                    <Avatar className="w-4 h-4">
                      <AvatarFallback className="text-[8px]">
                        {projeto.responsavel_nome?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground">{projeto.responsavel_nome}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso das Tarefas</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {projeto.tarefas_concluidas}/{projeto.total_tarefas} tarefas
                </p>
              </div>

              {projeto.tarefas_atrasadas > 0 && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {projeto.tarefas_atrasadas} tarefa{projeto.tarefas_atrasadas > 1 ? "s" : ""} atrasada{projeto.tarefas_atrasadas > 1 ? "s" : ""}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <Badge
                  variant="outline"
                  className={cn("text-xs", STATUS_CONFIG[projeto.status as keyof typeof STATUS_CONFIG]?.color)}
                >
                  {STATUS_CONFIG[projeto.status as keyof typeof STATUS_CONFIG]?.icon}{" "}
                  {STATUS_CONFIG[projeto.status as keyof typeof STATUS_CONFIG]?.label}
                </Badge>
                {projeto.data_inicio && (
                  <span className="text-xs text-muted-foreground">
                    Início: {formatDate(projeto.data_inicio)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ProjetosTable({ projetos, onView }: { projetos: any[]; onView: (id: string) => void }) {
  if (projetos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum projeto encontrado
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projeto</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead>Atrasadas</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projetos.map((projeto) => {
            const progress = projeto.total_tarefas > 0
              ? Math.round((projeto.tarefas_concluidas / projeto.total_tarefas) * 100)
              : 0;

            return (
              <TableRow
                key={projeto.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(projeto.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{projeto.nome}</span>
                    {projeto.is_onboarding && (
                      <Badge variant="secondary" className="text-xs">
                        <Rocket className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {projeto.cliente_nome_fantasia || projeto.cliente_nome}
                </TableCell>
                <TableCell>
                  {projeto.servico_nome || "-"}
                </TableCell>
                <TableCell>
                  {projeto.responsavel_nome || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-2 w-16" />
                    <span className="text-sm">{progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {projeto.tarefas_atrasadas > 0 ? (
                    <span className="text-destructive font-medium">{projeto.tarefas_atrasadas}</span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", STATUS_CONFIG[projeto.status as keyof typeof STATUS_CONFIG]?.color)}
                  >
                    {STATUS_CONFIG[projeto.status as keyof typeof STATUS_CONFIG]?.icon}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(projeto.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="w-4 h-4 mr-2" />
                        Arquivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
