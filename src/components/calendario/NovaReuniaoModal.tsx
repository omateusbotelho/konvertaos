import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateReuniao } from '@/hooks/useCalendario';
import { useProjetos } from '@/hooks/useProjetos';
import { useClientes } from '@/hooks/useClientes';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  tipo: z.enum(['weekly', '1:1', 'projeto', 'cliente', 'outro']),
  data: z.date(),
  horaInicio: z.string(),
  horaFim: z.string(),
  local: z.string().optional(),
  descricao: z.string().optional(),
  projeto_id: z.string().optional(),
  cliente_id: z.string().optional(),
  recorrente: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface NovaReuniaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NovaReuniaoModal({ open, onOpenChange }: NovaReuniaoModalProps) {
  const [participantes, setParticipantes] = useState<Array<{ id: string; nome: string }>>([]);
  const [colaboradores, setColaboradores] = useState<Array<{ id: string; nome: string }>>([]);
  const [searchColaborador, setSearchColaborador] = useState('');

  const createReuniao = useCreateReuniao();
  const { data: projetos = [] } = useProjetos();
  const { data: clientes = [] } = useClientes();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      tipo: 'outro',
      data: new Date(),
      horaInicio: '14:00',
      horaFim: '15:00',
      local: '',
      descricao: '',
      recorrente: false,
    },
  });

  useEffect(() => {
    async function fetchColaboradores() {
      const { data } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      if (data) setColaboradores(data);
    }
    if (open) fetchColaboradores();
  }, [open]);

  const filteredColaboradores = colaboradores.filter(c => 
    !participantes.find(p => p.id === c.id) &&
    c.nome.toLowerCase().includes(searchColaborador.toLowerCase())
  );

  const addParticipante = (colaborador: { id: string; nome: string }) => {
    setParticipantes([...participantes, colaborador]);
    setSearchColaborador('');
  };

  const removeParticipante = (id: string) => {
    setParticipantes(participantes.filter(p => p.id !== id));
  };

  const onSubmit = async (data: FormData) => {
    const dataInicio = new Date(data.data);
    const [horaI, minI] = data.horaInicio.split(':');
    dataInicio.setHours(parseInt(horaI), parseInt(minI));

    const dataFim = new Date(data.data);
    const [horaF, minF] = data.horaFim.split(':');
    dataFim.setHours(parseInt(horaF), parseInt(minF));

    await createReuniao.mutateAsync({
      titulo: data.titulo,
      tipo: data.tipo,
      data_inicio: dataInicio.toISOString(),
      data_fim: dataFim.toISOString(),
      local: data.local,
      descricao: data.descricao,
      projeto_id: data.projeto_id || undefined,
      cliente_id: data.cliente_id || undefined,
      recorrente: data.recorrente,
      participantes: participantes.map(p => p.id),
    });

    form.reset();
    setParticipantes([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Reunião</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da reunião" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weekly">Reunião Equipe (Weekly)</SelectItem>
                      <SelectItem value="1:1">1:1</SelectItem>
                      <SelectItem value="projeto">Projeto</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, 'dd/MM/yyyy') : 'Selecione'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="horaInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="horaFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="local"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local / Link</FormLabel>
                  <FormControl>
                    <Input placeholder="https://meet.google.com/xxx ou Sala 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Pauta da reunião..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Participantes */}
            <div className="space-y-2">
              <FormLabel>Participantes</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {participantes.map(p => (
                  <Badge key={p.id} variant="secondary" className="gap-1">
                    {p.nome}
                    <button type="button" onClick={() => removeParticipante(p.id)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    + Adicionar participante
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <Input
                    placeholder="Buscar colaborador..."
                    value={searchColaborador}
                    onChange={(e) => setSearchColaborador(e.target.value)}
                    className="mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredColaboradores.map(c => (
                      <Button
                        key={c.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => addParticipante(c)}
                      >
                        {c.nome}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Vínculos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projeto_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projeto (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projetos.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome_fantasia || c.razao_social}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="recorrente"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Reunião recorrente</FormLabel>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createReuniao.isPending}>
                {createReuniao.isPending ? 'Criando...' : 'Criar Reunião'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
