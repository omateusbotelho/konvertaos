import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Umbrella, Briefcase, Check, Clock, X } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMinhasAusencias, useCreateAusencia, useCancelarAusencia } from '@/hooks/useCalendario';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  tipo: z.enum(['ferias', 'ausencia']),
  data_inicio: z.date(),
  data_fim: z.date(),
  motivo: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Ausencias() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: ausencias = [], isLoading } = useMinhasAusencias();
  const createAusencia = useCreateAusencia();
  const cancelarAusencia = useCancelarAusencia();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: 'ausencia',
      data_inicio: new Date(),
      data_fim: new Date(),
      motivo: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    await createAusencia.mutateAsync({
      tipo: data.tipo,
      data_inicio: data.data_inicio.toISOString().split('T')[0],
      data_fim: data.data_fim.toISOString().split('T')[0],
      motivo: data.motivo,
    });
    form.reset();
    setIsModalOpen(false);
  };

  const handleCancelar = async (id: string) => {
    await cancelarAusencia.mutateAsync(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'aprovada':
        return <Badge variant="outline" className="text-green-600 border-green-600"><Check className="h-3 w-3 mr-1" />Aprovada</Badge>;
      case 'recusada':
        return <Badge variant="outline" className="text-red-600 border-red-600"><X className="h-3 w-3 mr-1" />Recusada</Badge>;
      case 'cancelada':
        return <Badge variant="outline" className="text-muted-foreground border-muted-foreground"><X className="h-3 w-3 mr-1" />Cancelada</Badge>;
      default:
        return null;
    }
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Minhas Ausências</h1>
            <p className="text-muted-foreground">Solicite férias e ausências</p>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Solicitar Ausência
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Solicitação</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ferias">🏖️ Férias</SelectItem>
                            <SelectItem value="ausencia">🏥 Ausência</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="data_inicio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Início</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                  {format(field.value, 'dd/MM/yyyy')}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="data_fim"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Fim</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                  {format(field.value, 'dd/MM/yyyy')}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="motivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo (opcional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descreva o motivo..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createAusencia.isPending}>
                      {createAusencia.isPending ? 'Enviando...' : 'Solicitar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de ausências */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : ausencias.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Umbrella className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma ausência solicitada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ausencias.map(ausencia => {
              const dias = differenceInDays(new Date(ausencia.data_fim), new Date(ausencia.data_inicio)) + 1;
              
              return (
                <Card key={ausencia.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getTipoIcon(ausencia.tipo)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{getTipoLabel(ausencia.tipo)}</h3>
                            {getStatusBadge(ausencia.status)}
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
                          {ausencia.status !== 'pendente' && ausencia.aprovado_por && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {ausencia.status === 'aprovada' ? 'Aprovado' : 'Recusado'} por {ausencia.aprovado_por.nome}
                              {ausencia.aprovado_em && <> em {format(new Date(ausencia.aprovado_em), 'dd/MM/yyyy')}</>}
                            </p>
                          )}
                          {ausencia.observacoes && (
                            <p className="text-sm text-muted-foreground mt-1 italic">
                              "{ausencia.observacoes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {ausencia.status === 'pendente' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Cancelar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar Solicitação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja cancelar esta solicitação de {getTipoLabel(ausencia.tipo).toLowerCase()}?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Voltar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelar(ausencia.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Confirmar Cancelamento
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
