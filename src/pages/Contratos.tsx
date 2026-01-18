import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Search,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  MoreHorizontal,
  Download,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useClientes } from '@/hooks/useClientes';
import {
  useContratos,
  useCreateContrato,
  useEnviarContrato,
  useAssinarContrato,
  useCancelarContrato,
  useContratoTemplates,
  statusContratoConfig,
  type Contrato,
  type StatusContrato,
  type ContratoFilters,
} from '@/hooks/useContratos';
import { cn } from '@/lib/utils';

export default function Contratos() {
  const [filters, setFilters] = useState<ContratoFilters>({ status: 'todos' });
  const [searchTerm, setSearchTerm] = useState('');
  const [novoContratoOpen, setNovoContratoOpen] = useState(false);
  const [visualizarContrato, setVisualizarContrato] = useState<Contrato | null>(null);
  const [assinarDialogOpen, setAssinarDialogOpen] = useState(false);
  const [contratoParaAssinar, setContratoParaAssinar] = useState<Contrato | null>(null);
  const [assinadoPor, setAssinadoPor] = useState('');
  const [cancelarDialogOpen, setCancelarDialogOpen] = useState(false);
  const [contratoParaCancelar, setContratoParaCancelar] = useState<Contrato | null>(null);

  const { data: contratos, isLoading } = useContratos(filters);
  const { data: clientes } = useClientes();
  const { data: templates } = useContratoTemplates();
  const createContrato = useCreateContrato();
  const enviarContrato = useEnviarContrato();
  const assinarContrato = useAssinarContrato();
  const cancelarContrato = useCancelarContrato();

  // Form state for new contract
  const [novoContrato, setNovoContrato] = useState({
    cliente_id: '',
    titulo: '',
    conteudo: '',
    valor: '',
    data_inicio: '',
    data_fim: '',
    template_id: '',
  });

  const filteredContratos = contratos?.filter((contrato) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      contrato.titulo.toLowerCase().includes(search) ||
      contrato.cliente?.razao_social.toLowerCase().includes(search) ||
      contrato.cliente?.nome_fantasia?.toLowerCase().includes(search)
    );
  });

  const handleCreateContrato = async () => {
    if (!novoContrato.cliente_id || !novoContrato.titulo || !novoContrato.conteudo) return;

    await createContrato.mutateAsync({
      cliente_id: novoContrato.cliente_id,
      titulo: novoContrato.titulo,
      conteudo: novoContrato.conteudo,
      valor: novoContrato.valor ? parseFloat(novoContrato.valor) : undefined,
      data_inicio: novoContrato.data_inicio || undefined,
      data_fim: novoContrato.data_fim || undefined,
    });

    setNovoContratoOpen(false);
    setNovoContrato({
      cliente_id: '',
      titulo: '',
      conteudo: '',
      valor: '',
      data_inicio: '',
      data_fim: '',
      template_id: '',
    });
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      setNovoContrato((prev) => ({
        ...prev,
        template_id: templateId,
        conteudo: template.conteudo,
        titulo: prev.titulo || template.nome,
      }));
    }
  };

  const handleEnviar = async (contrato: Contrato) => {
    await enviarContrato.mutateAsync(contrato.id);
  };

  const handleAssinar = async () => {
    if (!contratoParaAssinar || !assinadoPor) return;
    await assinarContrato.mutateAsync({
      id: contratoParaAssinar.id,
      assinado_por: assinadoPor,
    });
    setAssinarDialogOpen(false);
    setContratoParaAssinar(null);
    setAssinadoPor('');
  };

  const handleCancelar = async () => {
    if (!contratoParaCancelar) return;
    await cancelarContrato.mutateAsync(contratoParaCancelar.id);
    setCancelarDialogOpen(false);
    setContratoParaCancelar(null);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contratos</h1>
            <p className="text-muted-foreground">
              Gerencie os contratos dos seus clientes
            </p>
          </div>
          <Button onClick={() => setNovoContratoOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contratos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.status || 'todos'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                status: value as StatusContrato | 'todos',
              }))
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="assinado">Assinado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.cliente_id || 'todos'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                cliente_id: value === 'todos' ? undefined : value,
              }))
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os clientes</SelectItem>
              {clientes?.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nome_fantasia || cliente.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredContratos?.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum contrato encontrado"
            description="Crie um novo contrato para começar."
          />
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContratos?.map((contrato) => (
                  <TableRow key={contrato.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{contrato.titulo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contrato.cliente?.nome_fantasia || contrato.cliente?.razao_social}
                    </TableCell>
                    <TableCell>{formatCurrency(contrato.valor)}</TableCell>
                    <TableCell>
                      {contrato.data_inicio && contrato.data_fim ? (
                        <span className="text-sm">
                          {format(new Date(contrato.data_inicio), 'dd/MM/yyyy')} -{' '}
                          {format(new Date(contrato.data_fim), 'dd/MM/yyyy')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'font-normal',
                          statusContratoConfig[contrato.status].color
                        )}
                      >
                        {statusContratoConfig[contrato.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(contrato.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setVisualizarContrato(contrato)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          {contrato.url_pdf && (
                            <DropdownMenuItem asChild>
                              <a href={contrato.url_pdf} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {contrato.status === 'rascunho' && (
                            <DropdownMenuItem onClick={() => handleEnviar(contrato)}>
                              <Send className="h-4 w-4 mr-2" />
                              Enviar para Assinatura
                            </DropdownMenuItem>
                          )}
                          {contrato.status === 'enviado' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setContratoParaAssinar(contrato);
                                setAssinarDialogOpen(true);
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Marcar como Assinado
                            </DropdownMenuItem>
                          )}
                          {(contrato.status === 'rascunho' || contrato.status === 'enviado') && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setContratoParaCancelar(contrato);
                                setCancelarDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Modal Novo Contrato */}
        <Dialog open={novoContratoOpen} onOpenChange={setNovoContratoOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Contrato</DialogTitle>
              <DialogDescription>
                Crie um novo contrato para um cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={novoContrato.cliente_id}
                    onValueChange={(value) =>
                      setNovoContrato((prev) => ({ ...prev, cliente_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes?.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome_fantasia || cliente.razao_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select
                    value={novoContrato.template_id}
                    onValueChange={handleTemplateChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={novoContrato.titulo}
                  onChange={(e) =>
                    setNovoContrato((prev) => ({ ...prev, titulo: e.target.value }))
                  }
                  placeholder="Ex: Contrato de Prestação de Serviços"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    value={novoContrato.valor}
                    onChange={(e) =>
                      setNovoContrato((prev) => ({ ...prev, valor: e.target.value }))
                    }
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={novoContrato.data_inicio}
                    onChange={(e) =>
                      setNovoContrato((prev) => ({ ...prev, data_inicio: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={novoContrato.data_fim}
                    onChange={(e) =>
                      setNovoContrato((prev) => ({ ...prev, data_fim: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Conteúdo *</Label>
                <Textarea
                  value={novoContrato.conteudo}
                  onChange={(e) =>
                    setNovoContrato((prev) => ({ ...prev, conteudo: e.target.value }))
                  }
                  placeholder="Conteúdo do contrato..."
                  rows={12}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNovoContratoOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateContrato}
                disabled={
                  !novoContrato.cliente_id ||
                  !novoContrato.titulo ||
                  !novoContrato.conteudo ||
                  createContrato.isPending
                }
              >
                Criar Contrato
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Visualizar Contrato */}
        <Dialog
          open={!!visualizarContrato}
          onOpenChange={(open) => !open && setVisualizarContrato(null)}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{visualizarContrato?.titulo}</DialogTitle>
              <DialogDescription>
                Cliente: {visualizarContrato?.cliente?.nome_fantasia || visualizarContrato?.cliente?.razao_social}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 text-sm">
                <Badge
                  className={cn(
                    'font-normal',
                    visualizarContrato && statusContratoConfig[visualizarContrato.status].color
                  )}
                >
                  {visualizarContrato && statusContratoConfig[visualizarContrato.status].label}
                </Badge>
                {visualizarContrato?.valor && (
                  <span>Valor: {formatCurrency(visualizarContrato.valor)}</span>
                )}
                {visualizarContrato?.data_inicio && visualizarContrato?.data_fim && (
                  <span>
                    Vigência: {format(new Date(visualizarContrato.data_inicio), 'dd/MM/yyyy')} -{' '}
                    {format(new Date(visualizarContrato.data_fim), 'dd/MM/yyyy')}
                  </span>
                )}
              </div>
              {visualizarContrato?.assinado_em && (
                <p className="text-sm text-muted-foreground">
                  Assinado por {visualizarContrato.assinado_por} em{' '}
                  {format(new Date(visualizarContrato.assinado_em), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm font-sans">
                  {visualizarContrato?.conteudo}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Marcar como Assinado */}
        <Dialog open={assinarDialogOpen} onOpenChange={setAssinarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar como Assinado</DialogTitle>
              <DialogDescription>
                Informe quem assinou o contrato.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Assinado por *</Label>
                <Input
                  value={assinadoPor}
                  onChange={(e) => setAssinadoPor(e.target.value)}
                  placeholder="Nome de quem assinou"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssinarDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAssinar}
                disabled={!assinadoPor || assinarContrato.isPending}
              >
                Confirmar Assinatura
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alert Dialog Cancelar */}
        <AlertDialog open={cancelarDialogOpen} onOpenChange={setCancelarDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Contrato</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar este contrato? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelar}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Cancelar Contrato
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
