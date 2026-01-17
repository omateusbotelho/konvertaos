import { useState } from 'react';
import { X, Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TarefaFilters, gerarCorCliente } from '@/hooks/useTarefas';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface FiltrosTarefasProps {
  filters: TarefaFilters;
  onFiltersChange: (filters: TarefaFilters) => void;
}

export function FiltrosTarefas({ filters, onFiltersChange }: FiltrosTarefasProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clientePopoverOpen, setClientePopoverOpen] = useState(false);

  // Buscar clientes
  const { data: clientes } = useQuery({
    queryKey: ['clientes-filtro'],
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

  // Buscar colaboradores
  const { data: colaboradores } = useQuery({
    queryKey: ['colaboradores-filtro'],
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

  const clientesSelecionados = clientes?.filter(c => filters.clienteIds?.includes(c.id)) || [];

  function handleToggleMinhasTarefas() {
    onFiltersChange({
      ...filters,
      minhasTarefas: !filters.minhasTarefas,
    });
  }

  function handleAddCliente(clienteId: string) {
    const clienteIds = filters.clienteIds || [];
    if (!clienteIds.includes(clienteId)) {
      onFiltersChange({
        ...filters,
        clienteIds: [...clienteIds, clienteId],
      });
    }
    setClientePopoverOpen(false);
  }

  function handleRemoveCliente(clienteId: string) {
    onFiltersChange({
      ...filters,
      clienteIds: filters.clienteIds?.filter(id => id !== clienteId) || [],
    });
  }

  function handleToggleResponsavel(responsavelId: string) {
    const responsavelIds = filters.responsavelIds || [];
    if (responsavelIds.includes(responsavelId)) {
      onFiltersChange({
        ...filters,
        responsavelIds: responsavelIds.filter(id => id !== responsavelId),
      });
    } else {
      onFiltersChange({
        ...filters,
        responsavelIds: [...responsavelIds, responsavelId],
      });
    }
  }

  function handleTogglePrioridade(prioridade: string) {
    const prioridades = filters.prioridades || [];
    if (prioridades.includes(prioridade)) {
      onFiltersChange({
        ...filters,
        prioridades: prioridades.filter(p => p !== prioridade),
      });
    } else {
      onFiltersChange({
        ...filters,
        prioridades: [...prioridades, prioridade],
      });
    }
  }

  function handleSetPrazo(prazo: TarefaFilters['prazo']) {
    onFiltersChange({
      ...filters,
      prazo: filters.prazo === prazo ? undefined : prazo,
    });
  }

  function handleClearAll() {
    onFiltersChange({});
  }

  const hasActiveFilters = 
    filters.minhasTarefas ||
    (filters.clienteIds && filters.clienteIds.length > 0) ||
    (filters.responsavelIds && filters.responsavelIds.length > 0) ||
    (filters.prioridades && filters.prioridades.length > 0) ||
    filters.prazo;

  return (
    <div className="space-y-3">
      {/* Barra de Filtros Rápidos */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Toggle Minhas Tarefas */}
        <div className="flex items-center gap-2">
          <Switch
            id="minhas-tarefas"
            checked={filters.minhasTarefas || false}
            onCheckedChange={handleToggleMinhasTarefas}
          />
          <Label htmlFor="minhas-tarefas" className="text-sm">
            Minhas tarefas
          </Label>
        </div>

        {/* Clientes Selecionados */}
        {clientesSelecionados.map((cliente) => (
          <Badge
            key={cliente.id}
            variant="secondary"
            className="gap-1 cursor-pointer"
            style={{
              backgroundColor: `${gerarCorCliente(cliente.id)}20`,
              color: gerarCorCliente(cliente.id),
            }}
            onClick={() => handleRemoveCliente(cliente.id)}
          >
            {cliente.nome_fantasia || cliente.razao_social}
            <X className="h-3 w-3" />
          </Badge>
        ))}

        {/* Adicionar Cliente */}
        <Popover open={clientePopoverOpen} onOpenChange={setClientePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7">
              + Cliente
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar cliente..." />
              <CommandList>
                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                <CommandGroup>
                  {clientes?.filter(c => !filters.clienteIds?.includes(c.id)).map((cliente) => (
                    <CommandItem
                      key={cliente.id}
                      onSelect={() => handleAddCliente(cliente.id)}
                    >
                      {cliente.nome_fantasia || cliente.razao_social}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Botão Mais Filtros */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1">
              <Filter className="h-3 w-3" />
              Mais filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  !
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            
            <ScrollArea className="h-[calc(100vh-120px)] mt-6">
              <div className="space-y-6 pr-4">
                {/* Responsáveis */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Responsável</h4>
                  <div className="space-y-2">
                    {colaboradores?.map((colab) => (
                      <div key={colab.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`resp-${colab.id}`}
                          checked={filters.responsavelIds?.includes(colab.id) || false}
                          onCheckedChange={() => handleToggleResponsavel(colab.id)}
                        />
                        <Label htmlFor={`resp-${colab.id}`} className="text-sm">
                          {colab.nome}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prioridade */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Prioridade</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'baixa', label: 'Baixa', color: '#64748B' },
                      { value: 'media', label: 'Média', color: '#3B82F6' },
                      { value: 'alta', label: 'Alta', color: '#F59E0B' },
                      { value: 'urgente', label: 'Urgente', color: '#EF4444' },
                    ].map((prioridade) => (
                      <div key={prioridade.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`prio-${prioridade.value}`}
                          checked={filters.prioridades?.includes(prioridade.value) || false}
                          onCheckedChange={() => handleTogglePrioridade(prioridade.value)}
                        />
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: prioridade.color }}
                        />
                        <Label htmlFor={`prio-${prioridade.value}`} className="text-sm">
                          {prioridade.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prazo */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Prazo</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'atrasadas' as const, label: 'Atrasadas' },
                      { value: 'hoje' as const, label: 'Hoje' },
                      { value: 'semana' as const, label: 'Esta semana' },
                      { value: 'mes' as const, label: 'Este mês' },
                      { value: 'sem_prazo' as const, label: 'Sem prazo' },
                    ].map((prazo) => (
                      <div key={prazo.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`prazo-${prazo.value}`}
                          checked={filters.prazo === prazo.value}
                          onCheckedChange={() => handleSetPrazo(prazo.value)}
                        />
                        <Label htmlFor={`prazo-${prazo.value}`} className="text-sm">
                          {prazo.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Limpar */}
                {hasActiveFilters && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm"
                    onClick={handleClearAll}
                  >
                    Limpar todos os filtros
                  </Button>
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Limpar todos */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-muted-foreground"
            onClick={handleClearAll}
          >
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
