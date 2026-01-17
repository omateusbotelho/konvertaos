import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { EtapaKanban, Tarefa } from '@/hooks/useTarefas';
import { TarefaCard } from './TarefaCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TarefaKanbanColumnProps {
  etapa: EtapaKanban;
  tarefas: Tarefa[];
  onTarefaClick: (tarefa: Tarefa) => void;
}

export function TarefaKanbanColumn({ 
  etapa, 
  tarefas, 
  onTarefaClick,
}: TarefaKanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: etapa.id,
  });

  const tarefaIds = tarefas.map(t => t.id);

  return (
    <div 
      className={cn(
        'flex flex-col h-full min-w-[280px] w-[280px] bg-muted/30 rounded-lg border',
        isOver && 'ring-2 ring-primary/50 bg-primary/5',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-background/50 rounded-t-lg">
        <div 
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: etapa.cor || '#64748B' }}
        />
        <h3 className="font-medium text-sm truncate flex-1">
          {etapa.nome}
        </h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tarefas.length}
        </span>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1">
        <div 
          ref={setNodeRef}
          className="p-2 space-y-2 min-h-[200px]"
        >
          <SortableContext 
            items={tarefaIds} 
            strategy={verticalListSortingStrategy}
          >
            {tarefas.map((tarefa) => (
              <TarefaCard
                key={tarefa.id}
                tarefa={tarefa}
                onClick={() => onTarefaClick(tarefa)}
              />
            ))}
          </SortableContext>

          {tarefas.length === 0 && (
            <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
              Arraste tarefas aqui
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
