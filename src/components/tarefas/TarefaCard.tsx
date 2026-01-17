import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  AlertTriangle,
  CheckSquare,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tarefa, gerarCorCliente, coresPrioridade } from '@/hooks/useTarefas';

interface TarefaCardProps {
  tarefa: Tarefa;
  onClick: () => void;
  isDragging?: boolean;
}

function TarefaCardComponent({ tarefa, onClick, isDragging: externalDragging }: TarefaCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarefa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = isDragging || externalDragging;
  const clienteNome = tarefa.cliente?.nome_fantasia || tarefa.cliente?.razao_social || 'Cliente';
  const clienteCor = tarefa.cliente?.id ? gerarCorCliente(tarefa.cliente.id) : '#64748B';
  const prioridadeCor = coresPrioridade[tarefa.prioridade];

  const dataVencimento = tarefa.data_vencimento ? new Date(tarefa.data_vencimento) : null;
  const atrasada = dataVencimento && isPast(dataVencimento) && !tarefa.concluida && !isToday(dataVencimento);
  const venceHoje = dataVencimento && isToday(dataVencimento) && !tarefa.concluida;
  const isUrgente = tarefa.prioridade === 'urgente';

  const temSubtarefas = (tarefa._count?.subtarefas || 0) > 0;
  const progressoSubtarefas = temSubtarefas 
    ? Math.round((tarefa._count!.subtarefas_concluidas / tarefa._count!.subtarefas) * 100)
    : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      role="listitem"
      aria-label={`Tarefa: ${tarefa.titulo}${atrasada ? ', atrasada' : ''}${venceHoje ? ', vence hoje' : ''}`}
      className={cn(
        'group relative bg-card rounded-lg border shadow-sm cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md hover:border-border/60',
        isCurrentlyDragging && 'opacity-90 shadow-2xl shadow-primary/20 rotate-2 scale-105 z-[100] ring-2 ring-primary/30',
        tarefa.concluida && 'opacity-60',
        isUrgente && !isCurrentlyDragging && 'animate-pulse',
      )}
    >
      {/* Borda de prioridade */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: prioridadeCor }}
        aria-hidden="true"
      />

      <div className="p-3 pl-4">
        {/* Título */}
        <h4 className={cn(
          'font-medium text-sm line-clamp-2 mb-2',
          tarefa.concluida && 'line-through text-muted-foreground',
        )}>
          {tarefa.titulo}
        </h4>

        {/* Cliente e Projeto */}
        <div className="flex flex-col gap-1 mb-3">
          <Badge 
            variant="secondary" 
            className="w-fit text-xs"
            style={{ 
              backgroundColor: `${clienteCor}20`,
              color: clienteCor,
              borderColor: clienteCor,
            }}
          >
            {clienteNome}
          </Badge>
          {tarefa.projeto && (
            <span className="text-xs text-muted-foreground truncate">
              {tarefa.projeto.nome}
            </span>
          )}
        </div>

        {/* Data de Vencimento */}
        {dataVencimento && (
          <div className={cn(
            'flex items-center gap-1.5 text-xs mb-2',
            atrasada && 'text-destructive font-medium',
            venceHoje && 'text-warning font-medium',
            !atrasada && !venceHoje && 'text-muted-foreground',
          )}>
            <Calendar className="h-3 w-3" aria-hidden="true" />
            <span>
              Vence: {format(dataVencimento, "dd/MM", { locale: ptBR })}
            </span>
            {(atrasada || venceHoje) && (
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            )}
          </div>
        )}

        {/* Subtarefas */}
        {temSubtarefas && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <CheckSquare className="h-3 w-3" aria-hidden="true" />
              <span>
                {tarefa._count?.subtarefas_concluidas}/{tarefa._count?.subtarefas} subtarefas
              </span>
            </div>
            <Progress value={progressoSubtarefas} className="h-1" aria-label={`${progressoSubtarefas}% das subtarefas concluídas`} />
          </div>
        )}

        {/* Footer: Comentários, Anexos, Avatar */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {(tarefa._count?.comentarios || 0) > 0 && (
              <span className="flex items-center gap-1" aria-label={`${tarefa._count?.comentarios} comentários`}>
                <MessageSquare className="h-3 w-3" aria-hidden="true" />
                {tarefa._count?.comentarios}
              </span>
            )}
            {(tarefa._count?.anexos || 0) > 0 && (
              <span className="flex items-center gap-1" aria-label={`${tarefa._count?.anexos} anexos`}>
                <Paperclip className="h-3 w-3" aria-hidden="true" />
                {tarefa._count?.anexos}
              </span>
            )}
          </div>

          {tarefa.responsavel ? (
            <Avatar className="h-6 w-6">
              <AvatarImage src={tarefa.responsavel.avatar_url || undefined} alt={tarefa.responsavel.nome} />
              <AvatarFallback className="text-[10px]">
                {tarefa.responsavel.nome?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Memoize with custom comparison - only re-render when tarefa data changes
export const TarefaCard = memo(TarefaCardComponent, (prevProps, nextProps) => {
  const prevTarefa = prevProps.tarefa;
  const nextTarefa = nextProps.tarefa;

  return (
    prevTarefa.id === nextTarefa.id &&
    prevTarefa.titulo === nextTarefa.titulo &&
    prevTarefa.prioridade === nextTarefa.prioridade &&
    prevTarefa.concluida === nextTarefa.concluida &&
    prevTarefa.data_vencimento === nextTarefa.data_vencimento &&
    prevTarefa.etapa_id === nextTarefa.etapa_id &&
    prevTarefa._count?.comentarios === nextTarefa._count?.comentarios &&
    prevTarefa._count?.anexos === nextTarefa._count?.anexos &&
    prevTarefa._count?.subtarefas === nextTarefa._count?.subtarefas &&
    prevTarefa._count?.subtarefas_concluidas === nextTarefa._count?.subtarefas_concluidas &&
    prevTarefa.responsavel?.id === nextTarefa.responsavel?.id
  );
});
