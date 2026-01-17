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
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AppLayout } from '@/components/layout/AppLayout';
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
        <div className="mt-6">
          <p className="text-muted-foreground">
            Visualização em lista em desenvolvimento...
          </p>
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
