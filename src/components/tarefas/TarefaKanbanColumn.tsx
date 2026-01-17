import { memo } from 'react';
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

function TarefaKanbanColumnComponent({ 
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
        'flex flex-col h-full min-w-[280px] w-[280px] bg-muted/30 rounded-lg border transition-all duration-200',
        isOver && 'ring-2 ring-primary/50 bg-primary/5 scale-[1.01]',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-background/50 rounded-t-lg">
        <div 
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: etapa.cor || '#64748B' }}
          aria-hidden="true"
        />
        <h3 className="font-medium text-sm truncate flex-1">
          {etapa.nome}
        </h3>
        <span 
          className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
          aria-label={`${tarefas.length} tarefas nesta etapa`}
        >
          {tarefas.length}
        </span>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1">
        <div 
          ref={setNodeRef}
          className="p-2 space-y-2 min-h-[200px]"
          role="list"
          aria-label={`Lista de tarefas em ${etapa.nome}`}
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
            <div className="flex items-center justify-center h-32 text-xs text-muted-foreground border-2 border-dashed border-border/30 rounded-lg">
              Arraste tarefas aqui
            </div>
          )}

          {isOver && tarefas.length > 0 && (
            <div className="h-16 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center text-sm text-primary animate-pulse">
              Soltar aqui
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Memoize column - re-render only when tarefas change
export const TarefaKanbanColumn = memo(TarefaKanbanColumnComponent, (prevProps, nextProps) => {
  const sameTarefas = 
    prevProps.tarefas.length === nextProps.tarefas.length &&
    prevProps.tarefas.every((t, idx) => 
      t.id === nextProps.tarefas[idx]?.id &&
      t.titulo === nextProps.tarefas[idx]?.titulo &&
      t.prioridade === nextProps.tarefas[idx]?.prioridade &&
      t.concluida === nextProps.tarefas[idx]?.concluida &&
      t.data_vencimento === nextProps.tarefas[idx]?.data_vencimento
    );

  return (
    prevProps.etapa.id === nextProps.etapa.id &&
    prevProps.etapa.nome === nextProps.etapa.nome &&
    prevProps.etapa.cor === nextProps.etapa.cor &&
    sameTarefas
  );
});
