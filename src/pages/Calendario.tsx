import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReunioes, useAusencias, Reuniao, Ausencia, coresReuniao, labelsReuniao } from '@/hooks/useCalendario';
import NovaReuniaoModal from '@/components/calendario/NovaReuniaoModal';
import ReuniaoDrawer from '@/components/calendario/ReuniaoDrawer';
import { cn } from '@/lib/utils';

type ViewType = 'month' | 'week' | 'day';

export default function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [apenasMinhas, setApenasMinhas] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReuniao, setSelectedReuniao] = useState<string | null>(null);

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    if (view === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return {
        start: startOfWeek(monthStart, { weekStartsOn: 0 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
      };
    } else if (view === 'week') {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      };
    } else {
      return {
        start: currentDate,
        end: currentDate,
      };
    }
  }, [currentDate, view]);

  const { data: reunioes = [], isLoading: loadingReunioes } = useReunioes({
    dataInicio: dateRange.start.toISOString(),
    dataFim: dateRange.end.toISOString(),
    tipo: tipoFilter,
    apenasMinhas,
  });

  const { data: ausencias = [] } = useAusencias();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { reunioes: Reuniao[]; ausencias: Ausencia[] }>();

    reunioes.forEach(reuniao => {
      const dateKey = format(new Date(reuniao.data_inicio), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, { reunioes: [], ausencias: [] });
      }
      map.get(dateKey)!.reunioes.push(reuniao);
    });

    ausencias.forEach(ausencia => {
      if (ausencia.status !== 'aprovada') return;
      const start = new Date(ausencia.data_inicio);
      const end = new Date(ausencia.data_fim);
      const days = eachDayOfInterval({ start, end });
      days.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        if (!map.has(dateKey)) {
          map.set(dateKey, { reunioes: [], ausencias: [] });
        }
        if (!map.get(dateKey)!.ausencias.find(a => a.id === ausencia.id)) {
          map.get(dateKey)!.ausencias.push(ausencia);
        }
      });
    });

    return map;
  }, [reunioes, ausencias]);

  const navigatePrevious = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const navigateNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h to 19h

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendário</h1>
          <p className="text-muted-foreground">Gerencie reuniões e eventos</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Navigation and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {view === 'month' && format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            {view === 'week' && `${format(dateRange.start, 'dd/MM')} - ${format(dateRange.end, 'dd/MM/yyyy')}`}
            {view === 'day' && format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h2>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
          <TabsList>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="day">Dia</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros:</span>
        </div>

        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="weekly">Reunião Equipe</SelectItem>
            <SelectItem value="1:1">1:1</SelectItem>
            <SelectItem value="projeto">Projeto</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Switch id="minhas" checked={apenasMinhas} onCheckedChange={setApenasMinhas} />
          <Label htmlFor="minhas" className="text-sm">Apenas minhas reuniões</Label>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 ml-auto">
          {Object.entries(labelsReuniao).map(([tipo, label]) => (
            <Badge key={tipo} variant="outline" className="gap-1">
              <span className={cn('w-2 h-2 rounded-full', coresReuniao[tipo])} />
              {label}
            </Badge>
          ))}
          <Badge variant="outline" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Ausência
          </Badge>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === 'month' && (
        <div className="bg-card rounded-lg border overflow-hidden">
          {/* Days header */}
          <div className="grid grid-cols-7 border-b">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const events = eventsByDate.get(dateKey);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={idx}
                  className={cn(
                    'min-h-[120px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors',
                    !isCurrentMonth && 'bg-muted/30 text-muted-foreground'
                  )}
                  onClick={() => {
                    setCurrentDate(day);
                    setView('day');
                  }}
                >
                  <div className={cn(
                    'text-sm font-medium mb-1',
                    isToday(day) && 'bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center'
                  )}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {/* Ausências primeiro (multi-day events) */}
                    {events?.ausencias.slice(0, 1).map(ausencia => {
                      const isStart = isSameDay(day, new Date(ausencia.data_inicio));
                      const isEnd = isSameDay(day, new Date(ausencia.data_fim));
                      return (
                        <div 
                          key={ausencia.id} 
                          className={cn(
                            "text-xs p-1 bg-red-500/90 text-white truncate flex items-center gap-1",
                            isStart && "rounded-l",
                            isEnd && "rounded-r",
                            !isStart && !isEnd && "rounded-none",
                            isStart && isEnd && "rounded"
                          )}
                        >
                          {isStart && "🏖️"} {ausencia.colaborador?.nome} 
                          {isStart && <span className="opacity-75 text-[10px]">({ausencia.tipo})</span>}
                        </div>
                      );
                    })}
                    
                    {/* Reuniões com badges de tipo */}
                    {events?.reunioes.slice(0, 3).map(reuniao => (
                      <div
                        key={reuniao.id}
                        className={cn(
                          'text-xs p-1 rounded truncate text-white cursor-pointer flex items-center gap-1',
                          coresReuniao[reuniao.tipo]
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReuniao(reuniao.id);
                        }}
                      >
                        {/* Badge indicador de tipo */}
                        {reuniao.tipo === 'cliente' && (
                          <span className="bg-white/30 px-1 rounded text-[10px] font-semibold shrink-0">CLI</span>
                        )}
                        {reuniao.tipo === 'weekly' && (
                          <span className="bg-white/30 px-1 rounded text-[10px] font-semibold shrink-0">EQ</span>
                        )}
                        {reuniao.tipo === '1:1' && (
                          <span className="bg-white/30 px-1 rounded text-[10px] font-semibold shrink-0">1:1</span>
                        )}
                        {reuniao.tipo === 'projeto' && (
                          <span className="bg-white/30 px-1 rounded text-[10px] font-semibold shrink-0">PRJ</span>
                        )}
                        <span className="truncate">
                          {format(new Date(reuniao.data_inicio), 'HH:mm')} {reuniao.titulo}
                        </span>
                      </div>
                    ))}
                    
                    {events && (events.reunioes.length + events.ausencias.length) > 4 && (
                      <div className="text-xs text-muted-foreground">
                        +{events.reunioes.length + events.ausencias.length - 4} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="bg-card rounded-lg border overflow-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b">
              <div className="p-2 border-r" />
              {eachDayOfInterval({ start: dateRange.start, end: dateRange.end }).map(day => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'p-2 text-center border-r last:border-r-0',
                    isToday(day) && 'bg-primary/10'
                  )}
                >
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={cn(
                    'text-lg font-semibold',
                    isToday(day) && 'text-primary'
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time slots */}
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b min-h-[60px]">
                <div className="p-2 text-xs text-muted-foreground border-r text-right pr-3">
                  {hour}:00
                </div>
                {eachDayOfInterval({ start: dateRange.start, end: dateRange.end }).map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const events = eventsByDate.get(dateKey);
                  const hourEvents = events?.reunioes.filter(r => {
                    const eventHour = new Date(r.data_inicio).getHours();
                    return eventHour === hour;
                  }) || [];

                  return (
                    <div key={day.toISOString()} className="p-1 border-r last:border-r-0 relative">
                      {hourEvents.map(reuniao => (
                        <div
                          key={reuniao.id}
                          className={cn(
                            'text-xs p-1 rounded text-white cursor-pointer truncate',
                            coresReuniao[reuniao.tipo]
                          )}
                          onClick={() => setSelectedReuniao(reuniao.id)}
                        >
                          {reuniao.titulo}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="grid grid-cols-[80px_1fr]">
            {hours.map(hour => {
              const dateKey = format(currentDate, 'yyyy-MM-dd');
              const events = eventsByDate.get(dateKey);
              const hourEvents = events?.reunioes.filter(r => {
                const eventHour = new Date(r.data_inicio).getHours();
                return eventHour === hour;
              }) || [];

              return (
                <div key={hour} className="contents">
                  <div className="p-3 text-sm text-muted-foreground border-r border-b text-right">
                    {hour}:00
                  </div>
                  <div className="min-h-[80px] p-2 border-b">
                    {hourEvents.map(reuniao => (
                      <div
                        key={reuniao.id}
                        className={cn(
                          'p-2 rounded text-white cursor-pointer mb-1 border-l-4',
                          coresReuniao[reuniao.tipo]
                        )}
                        onClick={() => setSelectedReuniao(reuniao.id)}
                      >
                        <div className="font-medium">{reuniao.titulo}</div>
                        <div className="text-sm opacity-90">
                          {format(new Date(reuniao.data_inicio), 'HH:mm')} - {format(new Date(reuniao.data_fim), 'HH:mm')}
                        </div>
                        {reuniao.local && (
                          <div className="text-sm opacity-75 truncate">📍 {reuniao.local}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <NovaReuniaoModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <ReuniaoDrawer reuniaoId={selectedReuniao} onClose={() => setSelectedReuniao(null)} />
    </div>
  );
}
