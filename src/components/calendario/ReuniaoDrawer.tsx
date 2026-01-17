import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExternalLink, MapPin, User, FileText, Check, X, Edit, MoreVertical, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useReuniao, useReuniaoParticipantes, useReuniaoAta, useConfirmarPresenca, useSaveAta, useUpdateReuniao, coresReuniao, labelsReuniao } from '@/hooks/useCalendario';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface ReuniaoDrawerProps {
  reuniaoId: string | null;
  onClose: () => void;
}

export default function ReuniaoDrawer({ reuniaoId, onClose }: ReuniaoDrawerProps) {
  const [isEditingAta, setIsEditingAta] = useState(false);
  const [ataContent, setAtaContent] = useState('');

  const { user } = useAuth();
  const { data: reuniao, isLoading } = useReuniao(reuniaoId);
  const { data: participantes = [] } = useReuniaoParticipantes(reuniaoId);
  const { data: ata } = useReuniaoAta(reuniaoId);

  const confirmarPresenca = useConfirmarPresenca();
  const saveAta = useSaveAta();
  const updateReuniao = useUpdateReuniao();

  const minhaParticipacao = participantes.find(p => p.participante_id === user?.id);
  const isOrganizador = reuniao?.organizador_id === user?.id;

  const handleConfirmar = (confirmado: boolean) => {
    if (reuniaoId) {
      confirmarPresenca.mutate({ reuniaoId, confirmado });
    }
  };

  const handleSaveAta = async () => {
    if (reuniaoId && ataContent) {
      await saveAta.mutateAsync({
        reuniaoId,
        conteudo: ataContent,
        ataId: ata?.id,
      });
      setIsEditingAta(false);
    }
  };

  const handleEditAta = () => {
    setAtaContent(ata?.conteudo || '');
    setIsEditingAta(true);
  };

  const handleMarcarRealizada = () => {
    if (reuniaoId) {
      updateReuniao.mutate({ id: reuniaoId, status: 'realizada' });
    }
  };

  const handleCancelar = () => {
    if (reuniaoId) {
      updateReuniao.mutate({ id: reuniaoId, status: 'cancelada' });
    }
  };

  const getStatusIcon = (confirmado: boolean | null) => {
    if (confirmado === true) return <Check className="h-4 w-4 text-green-500" />;
    if (confirmado === false) return <X className="h-4 w-4 text-red-500" />;
    return <span className="text-muted-foreground">?</span>;
  };

  const getStatusLabel = (confirmado: boolean | null) => {
    if (confirmado === true) return 'Confirmado';
    if (confirmado === false) return 'Recusou';
    return 'Pendente';
  };

  if (!reuniaoId) return null;

  return (
    <Sheet open={!!reuniaoId} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : reuniao ? (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-xl">{reuniao.titulo}</SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn('text-white', coresReuniao[reuniao.tipo])}>
                      {labelsReuniao[reuniao.tipo]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(reuniao.data_inicio), "EEEE, dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(reuniao.data_inicio), 'HH:mm')} - {format(new Date(reuniao.data_fim), 'HH:mm')}
                    </span>
                  </div>
                </div>

                {isOrganizador && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleMarcarRealizada}>
                        <Check className="h-4 w-4 mr-2" />
                        Marcar como Realizada
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCancelar} className="text-destructive">
                        <X className="h-4 w-4 mr-2" />
                        Cancelar Reunião
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </SheetHeader>

            {reuniao.status !== 'agendada' && (
              <Badge variant={reuniao.status === 'realizada' ? 'default' : 'destructive'}>
                {reuniao.status === 'realizada' ? 'Reunião Realizada' : 'Reunião Cancelada'}
              </Badge>
            )}

            {/* Local */}
            {reuniao.local && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Local
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{reuniao.local}</span>
                  {reuniao.local.startsWith('http') && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={reuniao.local} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Abrir link
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Organizador */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Organizador
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={reuniao.organizador?.avatar_url || undefined} />
                  <AvatarFallback>{reuniao.organizador?.nome?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{reuniao.organizador?.nome}</span>
              </div>
            </div>

            {/* Descrição */}
            {reuniao.descricao && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Descrição
                </div>
                <p className="text-sm whitespace-pre-wrap">{reuniao.descricao}</p>
              </div>
            )}

            <Separator />

            {/* Participantes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Participantes ({participantes.length})</h3>
              </div>
              <div className="space-y-2">
                {participantes.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.participante?.avatar_url || undefined} />
                        <AvatarFallback>{p.participante?.nome?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{p.participante?.nome}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {getStatusIcon(p.confirmado)}
                      <span className="text-muted-foreground">{getStatusLabel(p.confirmado)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {minhaParticipacao && minhaParticipacao.confirmado === null && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleConfirmar(true)}>
                    <Check className="h-4 w-4 mr-1" />
                    Confirmar presença
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleConfirmar(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Recusar
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Ata */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Ata da Reunião</h3>
                {!isEditingAta && (
                  <Button size="sm" variant="outline" onClick={handleEditAta}>
                    {ata ? (
                      <>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Criar Ata
                      </>
                    )}
                  </Button>
                )}
              </div>

              {isEditingAta ? (
                <div className="space-y-2">
                  <Textarea
                    value={ataContent}
                    onChange={(e) => setAtaContent(e.target.value)}
                    placeholder="## Discussões&#10;&#10;## Decisões&#10;&#10;## Próximos Passos"
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveAta} disabled={saveAta.isPending}>
                      {saveAta.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingAta(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : ata ? (
                <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                  {ata.conteudo}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma ata registrada</p>
              )}
            </div>

            {/* Ações finais */}
            {isOrganizador && reuniao.status === 'agendada' && (
              <>
                <Separator />
                <div className="flex gap-2">
                  <Button onClick={handleMarcarRealizada} className="flex-1">
                    <Check className="h-4 w-4 mr-1" />
                    Marcar como Realizada
                  </Button>
                  <Button variant="destructive" onClick={handleCancelar}>
                    Cancelar Reunião
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Reunião não encontrada
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
