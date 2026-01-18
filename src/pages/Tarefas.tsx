import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, LayoutGrid, List, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AppLayout } from '@/components/layout/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { KonvertaAvatar } from '@/components/ui/konverta-avatar';
import { cn } from '@/lib/utils';
import {
  TarefaCard,
  TarefaKanbanColumn,
  TarefaDrawer,
  NovaTarefaModal,
  FiltrosTarefas,
} from '@/components/tarefas';
import {
  useTarefas,
  useEtapasKanban,
  useMoveTarefa,
  Tarefa,
  TarefaFilters,
  coresPrioridade,
} from '@/hooks/useTarefas';
import { useToast } from '@/hooks/use-toast';

export default function Tarefas() {
  const [filters, setFilters] = useState<TarefaFilters>({});
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [novaTarefaOpen, setNovaTarefaOpen] = useState(false);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const { toast } = useToast();
  const { data: tarefas, isLoading: tarefasLoading } = useTarefas(filters);
  const { data: etapas, isLoading: etapasLoading } = useEtapasKanban();
  const moveTarefa = useMoveTarefa();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Agrupar tarefas por etapa
  const tarefasPorEtapa = useMemo(() => {
    if (!tarefas || !etapas) return {};
    
    const grouped: Record<string, Tarefa[]> = {};
    etapas.forEach(etapa => {
      grouped[etapa.id] = [];
    });
    
    tarefas.forEach(tarefa => {
      if (grouped[tarefa.etapa_id]) {
        grouped[tarefa.etapa_id].push(tarefa);
      }
    });

    // Ordenar por ordem dentro de cada etapa
    Object.keys(grouped).forEach(etapaId => {
      grouped[etapaId].sort((a, b) => a.ordem - b.ordem);
    });

    return grouped;
  }, [tarefas, etapas]);

  const activeTarefa = useMemo(() => {
    if (!activeDragId || !tarefas) return null;
    return tarefas.find(t => t.id === activeDragId) || null;
  }, [activeDragId, tarefas]);

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    // Handled by dnd-kit
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const tarefaId = active.id as string;
    const overId = over.id as string;

    // Encontrar a tarefa sendo arrastada
    const tarefa = tarefas?.find(t => t.id === tarefaId);
    if (!tarefa) return;

    // Determinar a etapa de destino
    let novaEtapaId: string;
    let novaOrdem: number;

    // Verificar se over é uma etapa ou uma tarefa
    const etapaDestino = etapas?.find(e => e.id === overId);
    
    if (etapaDestino) {
      // Solto diretamente na coluna
      novaEtapaId = etapaDestino.id;
      novaOrdem = (tarefasPorEtapa[novaEtapaId]?.length || 0);
    } else {
      // Solto em cima de outra tarefa
      const tarefaOver = tarefas?.find(t => t.id === overId);
      if (!tarefaOver) return;
      
      novaEtapaId = tarefaOver.etapa_id;
      novaOrdem = tarefaOver.ordem;
    }

    // Se não mudou de etapa e ordem, não fazer nada
    if (tarefa.etapa_id === novaEtapaId && tarefa.ordem === novaOrdem) return;

    // Verificar se a etapa destino é "Concluído"
    const etapa = etapas?.find(e => e.id === novaEtapaId);
    const concluir = etapa?.is_done ? true : (tarefa.concluida && !etapa?.is_done ? false : undefined);

    // Se tem subtarefas incompletas e está movendo para concluído
    if (concluir === true && (tarefa._count?.subtarefas || 0) > (tarefa._count?.subtarefas_concluidas || 0)) {
      const confirmar = confirm(
        'Esta tarefa possui subtarefas incompletas. Deseja concluí-la mesmo assim?'
      );
      if (!confirmar) return;
    }

    await moveTarefa.mutateAsync({
      tarefaId,
      etapaId: novaEtapaId,
      ordem: novaOrdem,
      concluir,
    });

    if (concluir === true) {
      toast({
        title: '✓ Tarefa concluída!',
        description: tarefa.titulo,
      });
    }
  }

  function handleTarefaClick(tarefa: Tarefa) {
    setTarefaSelecionada(tarefa);
    setDrawerOpen(true);
  }

  function handleEditTarefa() {
    setDrawerOpen(false);
    setEditModalOpen(true);
  }

  const isLoading = tarefasLoading || etapasLoading;

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tarefas</h1>
          <p className="text-muted-foreground">
            Gerencie as tarefas dos seus projetos
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle View */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'lista' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode('lista')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={() => setNovaTarefaOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <FiltrosTarefas filters={filters} onFiltersChange={setFilters} />

      {/* Kanban */}
      {isLoading ? (
        <div className="flex gap-4 mt-6 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[280px] space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      ) : viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea className="flex-1 mt-6">
            <div className="flex gap-4 pb-4 min-h-[500px]">
              {etapas?.map((etapa) => (
                <TarefaKanbanColumn
                  key={etapa.id}
                  etapa={etapa}
                  tarefas={tarefasPorEtapa[etapa.id] || []}
                  onTarefaClick={handleTarefaClick}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <DragOverlay>
            {activeTarefa && (
              <TarefaCard
                tarefa={activeTarefa}
                onClick={() => {}}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="mt-6 border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </TableHead>
                <TableHead>Tarefa</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tarefas?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma tarefa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                tarefas?.map((tarefa) => {
                  const isOverdue = tarefa.data_vencimento && !tarefa.concluida && new Date(tarefa.data_vencimento) < new Date();
                  const isToday = tarefa.data_vencimento && format(new Date(tarefa.data_vencimento), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  
                  return (
                    <TableRow
                      key={tarefa.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleTarefaClick(tarefa)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={tarefa.concluida || false}
                          onCheckedChange={async (checked) => {
                            const etapaConcluida = etapas?.find(e => e.is_done);
                            const etapaPadrao = etapas?.find(e => e.is_default);
                            
                            if (checked && etapaConcluida) {
                              await moveTarefa.mutateAsync({
                                tarefaId: tarefa.id,
                                etapaId: etapaConcluida.id,
                                ordem: 0,
                                concluir: true,
                              });
                              toast({
                                title: '✓ Tarefa concluída!',
                                description: tarefa.titulo,
                              });
                            } else if (!checked && etapaPadrao) {
                              await moveTarefa.mutateAsync({
                                tarefaId: tarefa.id,
                                etapaId: etapaPadrao.id,
                                ordem: 0,
                                concluir: false,
                              });
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-1 h-8 rounded-full"
                            style={{ backgroundColor: coresPrioridade[tarefa.prioridade || 'media'] }}
                          />
                          <div>
                            <p className={cn(
                              "font-medium",
                              tarefa.concluida && "line-through text-muted-foreground"
                            )}>
                              {tarefa.titulo}
                            </p>
                            {(tarefa._count?.subtarefas || 0) > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {tarefa._count?.subtarefas_concluidas || 0}/{tarefa._count?.subtarefas} subtarefas
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {tarefa.cliente?.nome_fantasia || tarefa.cliente?.razao_social || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{tarefa.projeto?.nome || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <KonvertaAvatar
                            name={tarefa.responsavel?.nome}
                            src={tarefa.responsavel?.avatar_url}
                            size="sm"
                          />
                          <span className="text-sm">{tarefa.responsavel?.nome || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: coresPrioridade[tarefa.prioridade || 'media'],
                            color: coresPrioridade[tarefa.prioridade || 'media'],
                          }}
                        >
                          {tarefa.prioridade || 'média'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tarefa.data_vencimento ? (
                          <span className={cn(
                            "text-sm",
                            isOverdue && "text-destructive font-medium",
                            isToday && !tarefa.concluida && "text-warning font-medium"
                          )}>
                            {format(new Date(tarefa.data_vencimento), 'dd/MM/yyyy')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tarefa.concluida ? 'default' : 'secondary'}>
                          {tarefa.concluida 
                            ? 'Concluída' 
                            : etapas?.find(e => e.id === tarefa.etapa_id)?.nome || 'Pendente'
                          }
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal Nova Tarefa */}
      <NovaTarefaModal
        open={novaTarefaOpen}
        onOpenChange={setNovaTarefaOpen}
      />

      {/* Modal Editar Tarefa */}
      <NovaTarefaModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        tarefa={tarefaSelecionada}
      />

      {/* Drawer Detalhes */}
      <TarefaDrawer
        tarefaId={tarefaSelecionada?.id || null}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEdit={handleEditTarefa}
      />
      </div>
    </AppLayout>
  );
}
