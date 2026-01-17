import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Pencil,
  MoreVertical,
  Trash2,
  Copy,
  Calendar,
  User,
  Flag,
  Layers,
  Plus,
  Paperclip,
  Download,
  ChevronDown,
  ChevronUp,
  Send,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  useTarefa,
  useTarefaComentarios,
  useTarefaAnexos,
  useTarefaHistorico,
  useUpdateTarefa,
  useToggleSubtarefa,
  useCreateSubtarefa,
  useAddComentario,
  useDeleteTarefa,
  useEtapasKanban,
  gerarCorCliente,
  coresPrioridade,
} from '@/hooks/useTarefas';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface TarefaDrawerProps {
  tarefaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export function TarefaDrawer({ 
  tarefaId, 
  open, 
  onOpenChange,
  onEdit,
}: TarefaDrawerProps) {
  const [novaSubtarefa, setNovaSubtarefa] = useState('');
  const [adicionandoSubtarefa, setAdicionandoSubtarefa] = useState(false);
  const [novoComentario, setNovoComentario] = useState('');
  const [historicoAberto, setHistoricoAberto] = useState(false);
  
  const { toast } = useToast();
  const { data: tarefa, isLoading } = useTarefa(tarefaId);
  const { data: comentarios } = useTarefaComentarios(tarefaId);
  const { data: anexos } = useTarefaAnexos(tarefaId);
  const { data: historico } = useTarefaHistorico(tarefaId);
  const { data: etapas } = useEtapasKanban();
  
  const updateTarefa = useUpdateTarefa();
  const toggleSubtarefa = useToggleSubtarefa();
  const createSubtarefa = useCreateSubtarefa();
  const addComentario = useAddComentario();
  const deleteTarefa = useDeleteTarefa();

  // Buscar colaboradores
  const { data: colaboradores } = useQuery({
    queryKey: ['colaboradores-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  if (!tarefa) return null;

  const clienteNome = tarefa.cliente?.nome_fantasia || tarefa.cliente?.razao_social || 'Cliente';
  const clienteCor = tarefa.cliente?.id ? gerarCorCliente(tarefa.cliente.id) : '#64748B';

  const subtarefas = tarefa.subtarefas || [];
  const subtarefasConcluidas = subtarefas.filter(s => s.concluida).length;
  const progressoSubtarefas = subtarefas.length > 0 
    ? Math.round((subtarefasConcluidas / subtarefas.length) * 100) 
    : 0;

  async function handleToggleConcluida() {
    await updateTarefa.mutateAsync({
      id: tarefa.id,
      concluida: !tarefa.concluida,
    });
  }

  async function handleAddSubtarefa() {
    if (!novaSubtarefa.trim()) return;
    
    await createSubtarefa.mutateAsync({
      tarefaPaiId: tarefa.id,
      titulo: novaSubtarefa,
    });
    
    setNovaSubtarefa('');
    setAdicionandoSubtarefa(false);
  }

  async function handleAddComentario() {
    if (!novoComentario.trim()) return;
    
    await addComentario.mutateAsync({
      tarefaId: tarefa.id,
      conteudo: novoComentario,
    });
    
    setNovoComentario('');
  }

  async function handleDelete() {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      await deleteTarefa.mutateAsync(tarefa.id);
      onOpenChange(false);
    }
  }

  async function handleUpdateResponsavel(responsavelId: string) {
    await updateTarefa.mutateAsync({
      id: tarefa.id,
      responsavel_id: responsavelId || null,
    });
  }

  async function handleUpdateEtapa(etapaId: string) {
    const etapa = etapas?.find(e => e.id === etapaId);
    await updateTarefa.mutateAsync({
      id: tarefa.id,
      etapa_id: etapaId,
      concluida: etapa?.is_done || false,
    });
  }

  async function handleUpdatePrioridade(prioridade: string) {
    await updateTarefa.mutateAsync({
      id: tarefa.id,
      prioridade: prioridade as 'baixa' | 'media' | 'alta' | 'urgente',
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Header */}
            <SheetHeader className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={tarefa.concluida}
                  onCheckedChange={handleToggleConcluida}
                  className="h-6 w-6 mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h2 className={cn(
                    'text-lg font-semibold',
                    tarefa.concluida && 'line-through text-muted-foreground'
                  )}>
                    {tarefa.titulo}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `${clienteCor}20`,
                        color: clienteCor,
                      }}
                    >
                      {clienteNome}
                    </Badge>
                    {tarefa.projeto && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {tarefa.projeto.nome}
                        </span>
                      </>
                    )}
                  </div>
                  {tarefa.created_by && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Criada por {tarefa.created_by.nome} em{' '}
                      {format(new Date(tarefa.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={onEdit}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast({ title: 'Em breve!', description: 'Funcionalidade de duplicar em desenvolvimento.' })}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </SheetHeader>

            <Separator />

            {/* Detalhes */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Detalhes</h3>
              
              <div className="grid gap-3">
                {/* Responsável */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    Responsável
                  </div>
                  <Select
                    value={tarefa.responsavel_id || ''}
                    onValueChange={handleUpdateResponsavel}
                  >
                    <SelectTrigger className="w-48 h-8">
                      <SelectValue placeholder="Não atribuído">
                        {tarefa.responsavel && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={tarefa.responsavel.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {tarefa.responsavel.nome?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{tarefa.responsavel.nome}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradores?.map((colab) => (
                        <SelectItem key={colab.id} value={colab.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={colab.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {colab.nome?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {colab.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Etapa */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Layers className="h-4 w-4" />
                    Etapa
                  </div>
                  <Select
                    value={tarefa.etapa_id}
                    onValueChange={handleUpdateEtapa}
                  >
                    <SelectTrigger className="w-48 h-8">
                      <SelectValue />
                    </SelectTrigger>
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
                </div>

                {/* Prioridade */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Flag className="h-4 w-4" />
                    Prioridade
                  </div>
                  <Select
                    value={tarefa.prioridade}
                    onValueChange={handleUpdatePrioridade}
                  >
                    <SelectTrigger className="w-48 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: coresPrioridade.baixa }} />
                          Baixa
                        </div>
                      </SelectItem>
                      <SelectItem value="media">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: coresPrioridade.media }} />
                          Média
                        </div>
                      </SelectItem>
                      <SelectItem value="alta">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: coresPrioridade.alta }} />
                          Alta
                        </div>
                      </SelectItem>
                      <SelectItem value="urgente">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: coresPrioridade.urgente }} />
                          Urgente
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Prazo */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Prazo
                  </div>
                  <span className="text-sm">
                    {tarefa.data_vencimento 
                      ? format(new Date(tarefa.data_vencimento), "dd/MM/yyyy", { locale: ptBR })
                      : 'Sem prazo'
                    }
                  </span>
                </div>

                {/* Recorrência */}
                {tarefa.recorrente && tarefa.recorrencia_config && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 1l4 4-4 4" />
                        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                        <path d="M7 23l-4-4 4-4" />
                        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                      </svg>
                      Recorrência
                    </div>
                    <span className="text-sm capitalize">
                      {(tarefa.recorrencia_config as { tipo: string }).tipo}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Descrição */}
            {tarefa.descricao && (
              <>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Descrição</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {tarefa.descricao}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {/* Subtarefas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Subtarefas</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setAdicionandoSubtarefa(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {subtarefas.length > 0 && (
                <div className="space-y-2">
                  <Progress value={progressoSubtarefas} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {progressoSubtarefas}% concluído
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {subtarefas.map((subtarefa) => (
                  <div 
                    key={subtarefa.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={subtarefa.concluida}
                      onCheckedChange={(checked) => 
                        toggleSubtarefa.mutate({ id: subtarefa.id, concluida: !!checked })
                      }
                    />
                    <span className={cn(
                      'flex-1 text-sm',
                      subtarefa.concluida && 'line-through text-muted-foreground'
                    )}>
                      {subtarefa.titulo}
                    </span>
                    {subtarefa.responsavel && (
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={subtarefa.responsavel.avatar_url || undefined} />
                        <AvatarFallback className="text-[8px]">
                          {subtarefa.responsavel.nome?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {adicionandoSubtarefa && (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Digite a subtarefa..."
                      value={novaSubtarefa}
                      onChange={(e) => setNovaSubtarefa(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSubtarefa();
                        if (e.key === 'Escape') {
                          setNovaSubtarefa('');
                          setAdicionandoSubtarefa(false);
                        }
                      }}
                      autoFocus
                    />
                    <Button 
                      size="icon" 
                      onClick={handleAddSubtarefa}
                      disabled={!novaSubtarefa.trim()}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Anexos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Anexos</h3>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {anexos && anexos.length > 0 ? (
                <div className="space-y-2">
                  {anexos.map((anexo) => (
                    <div 
                      key={anexo.id}
                      className="flex items-center gap-3 p-2 rounded-md border"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{anexo.nome}</p>
                        {anexo.tamanho && (
                          <p className="text-xs text-muted-foreground">
                            {(anexo.tamanho / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={anexo.url} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum anexo</p>
              )}
            </div>

            <Separator />

            {/* Comentários */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">
                Comentários {comentarios && comentarios.length > 0 && `(${comentarios.length})`}
              </h3>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Adicione um comentário..."
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  size="sm"
                  onClick={handleAddComentario}
                  disabled={!novoComentario.trim() || addComentario.isPending}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Enviar
                </Button>
              </div>

              {comentarios && comentarios.length > 0 && (
                <div className="space-y-4 mt-4">
                  {comentarios.map((comentario) => (
                    <div key={comentario.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comentario.autor?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {comentario.autor?.nome?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {comentario.autor?.nome}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {formatDistanceToNow(new Date(comentario.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                        </span>
                      </div>
                      <p className="text-sm pl-8 whitespace-pre-wrap">
                        {comentario.conteudo}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Histórico */}
            <Collapsible open={historicoAberto} onOpenChange={setHistoricoAberto}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="text-sm font-medium">Histórico</span>
                  {historicoAberto ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {historico && historico.length > 0 ? (
                  historico.map((item) => (
                    <div key={item.id} className="flex gap-2 text-sm">
                      <span className="text-muted-foreground">•</span>
                      <div>
                        <span>{item.descricao}</span>
                        <span className="text-muted-foreground">
                          {' - '}{item.realizado_por?.nome},{' '}
                          {format(new Date(item.created_at), "dd/MM", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sem histórico</p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
