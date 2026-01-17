import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCreateTarefa, useUpdateTarefa, useEtapasKanban, Tarefa, RecorrenciaConfig } from '@/hooks/useTarefas';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const tarefaSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  projeto_id: z.string().min(1, 'Projeto é obrigatório'),
  responsavel_id: z.string().optional(),
  etapa_id: z.string().min(1, 'Etapa é obrigatória'),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
  data_vencimento: z.date().optional(),
  recorrente: z.boolean().default(false),
  recorrencia_tipo: z.enum(['diaria', 'semanal', 'mensal']).optional(),
  recorrencia_intervalo: z.number().min(1).optional(),
});

type TarefaFormData = z.infer<typeof tarefaSchema>;

interface NovaTarefaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarefa?: Tarefa | null;
  defaultClienteId?: string;
  defaultProjetoId?: string;
}

export function NovaTarefaModal({ 
  open, 
  onOpenChange, 
  tarefa,
  defaultClienteId,
  defaultProjetoId,
}: NovaTarefaModalProps) {
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  
  const createTarefa = useCreateTarefa();
  const updateTarefa = useUpdateTarefa();
  const { data: etapas } = useEtapasKanban();
  
  const isEditing = !!tarefa;

  // Buscar clientes
  const { data: clientes } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome_fantasia, razao_social')
        .eq('status', 'ativo')
        .order('razao_social');
      if (error) throw error;
      return data;
    },
  });

  // Buscar projetos filtrados por cliente
  const { data: projetos } = useQuery({
    queryKey: ['projetos-select', selectedClienteId],
    queryFn: async () => {
      if (!selectedClienteId) return [];
      const { data, error } = await supabase
        .from('projetos')
        .select('id, nome')
        .eq('cliente_id', selectedClienteId)
        .eq('status', 'ativo')
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClienteId,
  });

  // Buscar colaboradores
  const { data: colaboradores } = useQuery({
    queryKey: ['colaboradores-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  const etapaPadrao = etapas?.find(e => e.is_default)?.id || etapas?.[0]?.id;

  const form = useForm<TarefaFormData>({
    resolver: zodResolver(tarefaSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      cliente_id: defaultClienteId || '',
      projeto_id: defaultProjetoId || '',
      responsavel_id: '',
      etapa_id: etapaPadrao || '',
      prioridade: 'media',
      recorrente: false,
      recorrencia_tipo: 'semanal',
      recorrencia_intervalo: 1,
    },
  });

  // Atualizar valores quando tarefa muda
  useEffect(() => {
    if (tarefa) {
      setSelectedClienteId(tarefa.cliente_id);
      form.reset({
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || '',
        cliente_id: tarefa.cliente_id,
        projeto_id: tarefa.projeto_id,
        responsavel_id: tarefa.responsavel_id || '',
        etapa_id: tarefa.etapa_id,
        prioridade: tarefa.prioridade,
        data_vencimento: tarefa.data_vencimento ? new Date(tarefa.data_vencimento) : undefined,
        recorrente: tarefa.recorrente,
        recorrencia_tipo: (tarefa.recorrencia_config as RecorrenciaConfig)?.tipo || 'semanal',
        recorrencia_intervalo: (tarefa.recorrencia_config as RecorrenciaConfig)?.intervalo || 1,
      });
    } else {
      setSelectedClienteId(defaultClienteId || '');
      form.reset({
        titulo: '',
        descricao: '',
        cliente_id: defaultClienteId || '',
        projeto_id: defaultProjetoId || '',
        responsavel_id: '',
        etapa_id: etapaPadrao || '',
        prioridade: 'media',
        recorrente: false,
        recorrencia_tipo: 'semanal',
        recorrencia_intervalo: 1,
      });
    }
  }, [tarefa, defaultClienteId, defaultProjetoId, etapaPadrao, form]);

  // Atualizar selectedClienteId quando o campo mudar
  const watchedClienteId = form.watch('cliente_id');
  useEffect(() => {
    if (watchedClienteId !== selectedClienteId) {
      setSelectedClienteId(watchedClienteId);
      if (!tarefa) {
        form.setValue('projeto_id', '');
      }
    }
  }, [watchedClienteId, selectedClienteId, form, tarefa]);

  async function onSubmit(data: TarefaFormData) {
    const recorrenciaConfig: RecorrenciaConfig | undefined = data.recorrente 
      ? {
          tipo: data.recorrencia_tipo || 'semanal',
          intervalo: data.recorrencia_intervalo || 1,
        }
      : undefined;

    if (isEditing && tarefa) {
      await updateTarefa.mutateAsync({
        id: tarefa.id,
        titulo: data.titulo,
        descricao: data.descricao,
        projeto_id: data.projeto_id,
        cliente_id: data.cliente_id,
        responsavel_id: data.responsavel_id || null,
        etapa_id: data.etapa_id,
        prioridade: data.prioridade,
        data_vencimento: data.data_vencimento?.toISOString() || null,
        recorrente: data.recorrente,
        recorrencia_config: recorrenciaConfig,
      });
    } else {
      await createTarefa.mutateAsync({
        titulo: data.titulo,
        descricao: data.descricao,
        projeto_id: data.projeto_id,
        cliente_id: data.cliente_id,
        responsavel_id: data.responsavel_id,
        etapa_id: data.etapa_id,
        prioridade: data.prioridade,
        data_vencimento: data.data_vencimento?.toISOString(),
        recorrente: data.recorrente,
        recorrencia_config: recorrenciaConfig,
      });
    }

    onOpenChange(false);
  }

  const isRecorrente = form.watch('recorrente');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Título */}
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título da tarefa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva a tarefa..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cliente e Projeto */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes?.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome_fantasia || cliente.razao_social}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projeto_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projeto *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedClienteId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            selectedClienteId 
                              ? "Selecione o projeto" 
                              : "Selecione um cliente primeiro"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projetos?.map((projeto) => (
                          <SelectItem key={projeto.id} value={projeto.id}>
                            {projeto.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Responsável e Etapa */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsavel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colaboradores?.map((colab) => (
                          <SelectItem key={colab.id} value={colab.id}>
                            {colab.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="etapa_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a etapa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {etapas?.map((etapa) => (
                          <SelectItem key={etapa.id} value={etapa.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: etapa.cor || '#64748B' }}
                              />
                              {etapa.nome}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Prioridade e Data */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baixa">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-500" />
                            Baixa
                          </div>
                        </SelectItem>
                        <SelectItem value="media">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            Média
                          </div>
                        </SelectItem>
                        <SelectItem value="alta">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            Alta
                          </div>
                        </SelectItem>
                        <SelectItem value="urgente">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            Urgente
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Recorrência */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="recorrente">Tarefa Recorrente</Label>
                <FormField
                  control={form.control}
                  name="recorrente"
                  render={({ field }) => (
                    <Switch
                      id="recorrente"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {isRecorrente && (
                <div className="flex items-center gap-4">
                  <span className="text-sm">Repetir:</span>
                  <FormField
                    control={form.control}
                    name="recorrencia_tipo"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diaria">Diária</SelectItem>
                          <SelectItem value="semanal">Semanal</SelectItem>
                          <SelectItem value="mensal">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <span className="text-sm">a cada</span>
                  <FormField
                    control={form.control}
                    name="recorrencia_intervalo"
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={1}
                        className="w-16"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    )}
                  />
                  <span className="text-sm text-muted-foreground">
                    {form.watch('recorrencia_tipo') === 'diaria' && 'dia(s)'}
                    {form.watch('recorrencia_tipo') === 'semanal' && 'semana(s)'}
                    {form.watch('recorrencia_tipo') === 'mensal' && 'mês(es)'}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createTarefa.isPending || updateTarefa.isPending}
              >
                {isEditing ? 'Salvar Alterações' : 'Criar Tarefa'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
