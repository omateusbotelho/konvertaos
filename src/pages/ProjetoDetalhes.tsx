import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjeto, useUpdateProjeto } from "@/hooks/useProjetos";
import { useTarefas } from "@/hooks/useTarefas";
import {
  ArrowLeft,
  MoreVertical,
  Pencil,
  Pause,
  Play,
  CheckCircle2,
  Archive,
  Loader2,
  Building2,
  User,
  Calendar,
  AlertCircle,
  CheckSquare,
  ListTodo,
  Clock,
  Plus,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Import Kanban components
import { TarefaKanbanColumn } from "@/components/tarefas/TarefaKanbanColumn";
import { TarefaDrawer } from "@/components/tarefas/TarefaDrawer";
import { NovaTarefaModal } from "@/components/tarefas/NovaTarefaModal";
import { useEtapasKanban, useMoveTarefa, type Tarefa } from "@/hooks/useTarefas";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { TarefaCard } from "@/components/tarefas/TarefaCard";

const STATUS_CONFIG = {
  ativo: { label: "Ativo", color: "bg-success/10 text-success border-success/20", icon: "🟢" },
  pausado: { label: "Pausado", color: "bg-warning/10 text-warning border-warning/20", icon: "⏸️" },
  concluido: { label: "Concluído", color: "bg-primary/10 text-primary border-primary/20", icon: "✅" },
  cancelado: { label: "Cancelado", color: "bg-destructive/10 text-destructive border-destructive/20", icon: "❌" },
};

export default function ProjetoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tarefas");
  const [selectedTarefaId, setSelectedTarefaId] = useState<string | null>(null);
  const [isNovaTarefaOpen, setIsNovaTarefaOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const { data: projeto, isLoading } = useProjeto(id || "");
  const { data: etapas } = useEtapasKanban();
  const { data: tarefas } = useTarefas({ projetoId: id });
  const moverTarefa = useMoveTarefa();
  const updateProjeto = useUpdateProjeto();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const tarefaId = active.id as string;
    const novaEtapaId = over.id as string;
    const tarefa = tarefas?.find((t) => t.id === tarefaId);

    if (tarefa && tarefa.etapa_id !== novaEtapaId) {
      const etapaDestino = etapas?.find((e) => e.id === novaEtapaId);
      moverTarefa.mutate({
        tarefaId,
        etapaId: novaEtapaId,
        ordem: 0,
        concluir: etapaDestino?.is_done || false,
      });
    }
  };

  const draggedTarefa = tarefas?.find((t) => t.id === activeDragId);

  const handleStatusChange = (newStatus: "ativo" | "pausado" | "concluido" | "cancelado") => {
    if (!id) return;
    updateProjeto.mutate({
      id,
      status: newStatus,
      ...(newStatus === "concluido" ? { data_conclusao: new Date().toISOString() } : {}),
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!projeto) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Projeto não encontrado</p>
          <Button variant="link" onClick={() => navigate("/projetos")}>
            Voltar para projetos
          </Button>
        </div>
      </AppLayout>
    );
  }

  const progress = projeto.total_tarefas && projeto.total_tarefas > 0
    ? Math.round(((projeto.tarefas_concluidas || 0) / projeto.total_tarefas) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => navigate("/projetos")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para projetos
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{projeto.nome}</h1>
                <Badge
                  variant="outline"
                  className={cn("text-xs", STATUS_CONFIG[projeto.status]?.color)}
                >
                  {STATUS_CONFIG[projeto.status]?.icon} {STATUS_CONFIG[projeto.status]?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {projeto.cliente_nome_fantasia || projeto.cliente_nome}
                </span>
                {projeto.servico_nome && (
                  <span>• {projeto.servico_nome}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {projeto.status === "ativo" && (
                    <DropdownMenuItem onClick={() => handleStatusChange("pausado")}>
                      <Pause className="w-4 h-4 mr-2" />
                      Pausar projeto
                    </DropdownMenuItem>
                  )}
                  {projeto.status === "pausado" && (
                    <DropdownMenuItem onClick={() => handleStatusChange("ativo")}>
                      <Play className="w-4 h-4 mr-2" />
                      Retomar projeto
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleStatusChange("concluido")}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Concluir projeto
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleStatusChange("cancelado")}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Arquivar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="tarefas" className="gap-2">
              <CheckSquare className="w-4 h-4" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="visao-geral" className="gap-2">
              <ListTodo className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="equipe" className="gap-2">
              <User className="w-4 h-4" />
              Equipe
            </TabsTrigger>
          </TabsList>

          {/* Tab: Tarefas (Kanban) */}
          <TabsContent value="tarefas" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Tarefas deste projeto
              </p>
              <Button onClick={() => setIsNovaTarefaOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 overflow-x-auto pb-4">
                {etapas?.map((etapa) => {
                  const etapaTarefas = tarefas?.filter((t) => t.etapa_id === etapa.id) || [];
                  return (
                    <TarefaKanbanColumn
                      key={etapa.id}
                      etapa={etapa}
                      tarefas={etapaTarefas}
                      onTarefaClick={(tarefa) => setSelectedTarefaId(tarefa.id)}
                    />
                  );
                })}
              </div>

              <DragOverlay>
                {draggedTarefa && (
                  <TarefaCard
                    tarefa={draggedTarefa}
                    onClick={() => {}}
                    isDragging
                  />
                )}
              </DragOverlay>
            </DndContext>
          </TabsContent>

          {/* Tab: Visão Geral */}
          <TabsContent value="visao-geral" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cliente</span>
                    <span className="text-sm font-medium">
                      {projeto.cliente_nome_fantasia || projeto.cliente_nome}
                    </span>
                  </div>
                  {projeto.servico_nome && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Serviço</span>
                      <span className="text-sm font-medium">{projeto.servico_nome}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Responsável</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-[10px]">
                          {projeto.responsavel_nome?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {projeto.responsavel_nome || "-"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Data Início</span>
                    <span className="text-sm font-medium">
                      {projeto.data_inicio
                        ? format(new Date(projeto.data_inicio), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </span>
                  </div>
                  {projeto.descricao && (
                    <div className="pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Descrição</span>
                      <p className="text-sm mt-1">{projeto.descricao}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Métricas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Métricas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de Tarefas</span>
                    <span className="text-sm font-medium">{projeto.total_tarefas || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Concluídas</span>
                    <span className="text-sm font-medium text-success">
                      {projeto.tarefas_concluidas || 0} ({progress}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Em Andamento</span>
                    <span className="text-sm font-medium">
                      {(projeto.total_tarefas || 0) - (projeto.tarefas_concluidas || 0) - (projeto.tarefas_atrasadas || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Atrasadas</span>
                    <span className="text-sm font-medium text-destructive">
                      {projeto.tarefas_atrasadas || 0}
                    </span>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Progresso</span>
                      <span className="text-sm font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Equipe */}
          <TabsContent value="equipe" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Membros da Equipe</CardTitle>
                <Button variant="outline" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar Colaborador
                </Button>
              </CardHeader>
              <CardContent>
                {projeto.equipe && projeto.equipe.length > 0 ? (
                  <div className="space-y-4">
                    {/* Responsável Principal */}
                    {projeto.responsavel_nome && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {projeto.responsavel_nome?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{projeto.responsavel_nome}</p>
                            <p className="text-sm text-muted-foreground">
                              Responsável Principal
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">Principal</Badge>
                      </div>
                    )}

                    {/* Outros membros */}
                    {projeto.equipe.map((membro: any) => (
                      <div
                        key={membro.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {membro.nome?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{membro.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {membro.cargo} • {membro.total_tarefas} tarefas ({membro.tarefas_concluidas} concluídas)
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <Progress
                            value={membro.total_tarefas > 0 ? (membro.tarefas_concluidas / membro.total_tarefas) * 100 : 0}
                            className="h-2 w-20"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum membro na equipe ainda
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Drawer de detalhes da tarefa */}
      <TarefaDrawer
        tarefaId={selectedTarefaId}
        open={!!selectedTarefaId}
        onOpenChange={(open) => !open && setSelectedTarefaId(null)}
        onEdit={() => {
          setSelectedTarefaId(null);
          setIsNovaTarefaOpen(true);
        }}
      />

      {/* Modal nova tarefa */}
      <NovaTarefaModal
        open={isNovaTarefaOpen}
        onOpenChange={setIsNovaTarefaOpen}
        defaultProjetoId={id}
        defaultClienteId={projeto.cliente_id}
      />
    </AppLayout>
  );
}
