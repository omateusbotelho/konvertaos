import { useState } from 'react';
import { format, differenceInDays, eachDayOfInterval, isSameMonth, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, X, Clock, Umbrella, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAusencias, useUpdateAusenciaStatus, Ausencia } from '@/hooks/useCalendario';
import { cn } from '@/lib/utils';

export default function GerenciarAusencias() {
  const [statusFilter, setStatusFilter] = useState('pendente');
  const [selectedAusencia, setSelectedAusencia] = useState<Ausencia | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: ausencias = [], isLoading } = useAusencias({ status: statusFilter });
  const updateStatus = useUpdateAusenciaStatus();

  const pendentes = ausencias.filter(a => a.status === 'pendente');

  const handleAprovar = async (ausencia: Ausencia) => {
    await updateStatus.mutateAsync({ id: ausencia.id, status: 'aprovada', observacoes });
    setSelectedAusencia(null);
    setObservacoes('');
  };

  const handleRecusar = async (ausencia: Ausencia) => {
    await updateStatus.mutateAsync({ id: ausencia.id, status: 'recusada', observacoes });
    setSelectedAusencia(null);
    setObservacoes('');
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === 'ferias' ? (
      <Umbrella className="h-5 w-5 text-blue-500" />
    ) : (
      <Briefcase className="h-5 w-5 text-orange-500" />
    );
  };

  const getTipoLabel = (tipo: string) => {
    return tipo === 'ferias' ? 'Férias' : 'Ausência';
  };

  // Generate mini calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Map absences to dates
  const ausenciasPorDia = new Map<string, Ausencia[]>();
  ausencias.filter(a => a.status === 'aprovada').forEach(ausencia => {
    const days = eachDayOfInterval({
      start: new Date(ausencia.data_inicio),
      end: new Date(ausencia.data_fim),
    });
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      if (!ausenciasPorDia.has(key)) {
        ausenciasPorDia.set(key, []);
      }
      ausenciasPorDia.get(key)!.push(ausencia);
    });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Solicitações de Ausência</h1>
        <p className="text-muted-foreground">Gerencie férias e ausências da equipe</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="aprovada">Aprovadas</SelectItem>
            <SelectItem value="recusada">Recusadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de solicitações */}
        <div className="lg:col-span-2 space-y-4">
          {pendentes.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-medium text-lg">Pendentes ({pendentes.length})</h2>
              {pendentes.map(ausencia => {
                const dias = differenceInDays(new Date(ausencia.data_fim), new Date(ausencia.data_inicio)) + 1;
                
                return (
                  <Card key={ausencia.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={ausencia.colaborador?.avatar_url || undefined} />
                          <AvatarFallback>{ausencia.colaborador?.nome?.[0]}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{ausencia.colaborador?.nome}</h3>
                            {getTipoIcon(ausencia.tipo)}
                            <span className="text-sm text-muted-foreground">{getTipoLabel(ausencia.tipo)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(ausencia.data_inicio), 'dd/MM/yyyy')}
                            {ausencia.data_inicio !== ausencia.data_fim && (
                              <> a {format(new Date(ausencia.data_fim), 'dd/MM/yyyy')}</>
                            )}
                            {' '}({dias} {dias === 1 ? 'dia' : 'dias'})
                          </p>
                          {ausencia.motivo && (
                            <p className="text-sm mt-2">Motivo: {ausencia.motivo}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAusencia(ausencia);
                              handleAprovar(ausencia);
                            }}
                            disabled={updateStatus.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAusencia(ausencia)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Recusar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : ausencias.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
              </CardContent>
            </Card>
          ) : (
            statusFilter !== 'pendente' && (
              <div className="space-y-3">
                {ausencias.filter(a => a.status !== 'pendente').map(ausencia => {
                  const dias = differenceInDays(new Date(ausencia.data_fim), new Date(ausencia.data_inicio)) + 1;
                  
                  return (
                    <Card key={ausencia.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={ausencia.colaborador?.avatar_url || undefined} />
                            <AvatarFallback>{ausencia.colaborador?.nome?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{ausencia.colaborador?.nome}</span>
                              {getTipoIcon(ausencia.tipo)}
                              <Badge variant={ausencia.status === 'aprovada' ? 'default' : 'destructive'}>
                                {ausencia.status === 'aprovada' ? 'Aprovada' : 'Recusada'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(ausencia.data_inicio), 'dd/MM/yyyy')} - {format(new Date(ausencia.data_fim), 'dd/MM/yyyy')} ({dias} dias)
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Calendário de ausências */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Calendário de Ausências</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[100px] text-center">
                  {format(currentMonth, 'MMM yyyy', { locale: ptBR })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                <div key={i} className="p-1 text-muted-foreground font-medium">{d}</div>
              ))}
              
              {/* Empty cells for days before month start */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="p-1" />
              ))}

              {calendarDays.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                const dayAusencias = ausenciasPorDia.get(key) || [];
                const hasAusencia = dayAusencias.length > 0;

                return (
                  <div
                    key={key}
                    className={cn(
                      'p-1 text-center rounded-md relative',
                      hasAusencia && 'bg-red-100 dark:bg-red-900/30'
                    )}
                    title={dayAusencias.map(a => a.colaborador?.nome).join(', ')}
                  >
                    <span className={cn(hasAusencia && 'font-medium text-red-600 dark:text-red-400')}>
                      {format(day, 'd')}
                    </span>
                    {dayAusencias.length > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                        {dayAusencias.length}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30" />
                <span>Dias com ausência</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de recusa */}
      <Dialog open={!!selectedAusencia} onOpenChange={() => setSelectedAusencia(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você está recusando a solicitação de <strong>{selectedAusencia?.colaborador?.nome}</strong>.
            </p>
            <Textarea
              placeholder="Motivo da recusa (opcional)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAusencia(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedAusencia && handleRecusar(selectedAusencia)}
              disabled={updateStatus.isPending}
            >
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
