import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCliente,
  useClienteTimeline,
  useClienteAcessos,
  useClienteArquivos,
  useCancelarCliente,
  useCancelarServico,
} from "@/hooks/useClientes";
import {
  ArrowLeft,
  Building2,
  MoreVertical,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Download,
  Upload,
  Loader2,
  Calendar,
  DollarSign,
  User,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCcw,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STATUS_CONFIG = {
  ativo: { label: "Ativo", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  inadimplente: { label: "Inadimplente", color: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
  cancelado: { label: "Cancelado", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

const TIMELINE_ICONS: Record<string, any> = {
  criado: { icon: Plus, color: "text-success" },
  servico_adicionado: { icon: Plus, color: "text-primary" },
  servico_cancelado: { icon: XCircle, color: "text-destructive" },
  valor_alterado: { icon: DollarSign, color: "text-warning" },
  responsavel_alterado: { icon: User, color: "text-primary" },
  pagamento_confirmado: { icon: CheckCircle2, color: "text-success" },
  pagamento_atrasado: { icon: AlertTriangle, color: "text-destructive" },
  tarefa_concluida: { icon: CheckCircle2, color: "text-success" },
  comentario: { icon: MessageSquare, color: "text-muted-foreground" },
  contrato_enviado: { icon: FileText, color: "text-primary" },
  contrato_assinado: { icon: FileText, color: "text-success" },
  nps_recebido: { icon: MessageSquare, color: "text-primary" },
};

export default function ClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [confirmName, setConfirmName] = useState("");

  const { data: cliente, isLoading: loadingCliente } = useCliente(id || "");
  const { data: timeline, isLoading: loadingTimeline } = useClienteTimeline(id || "");
  const { data: acessos, isLoading: loadingAcessos } = useClienteAcessos(id || "");
  const { data: arquivos, isLoading: loadingArquivos } = useClienteArquivos(id || "");
  const cancelarCliente = useCancelarCliente();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: string, formatStr = "dd/MM/yyyy") => {
    return format(new Date(date), formatStr, { locale: ptBR });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const handleCancelCliente = async () => {
    if (!cliente || confirmName !== cliente.razao_social) {
      toast.error("Digite o nome do cliente corretamente para confirmar");
      return;
    }

    try {
      await cancelarCliente.mutateAsync({
        clienteId: cliente.id,
        motivo: cancelMotivo,
      });
      toast.success("Cliente cancelado com sucesso");
      setCancelModal(false);
      navigate("/clientes");
    } catch (error) {
      toast.error("Erro ao cancelar cliente");
    }
  };

  if (loadingCliente) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!cliente) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <p className="text-muted-foreground">Cliente não encontrado</p>
          <Button variant="outline" onClick={() => navigate("/clientes")}>
            Voltar para clientes
          </Button>
        </div>
      </AppLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[cliente.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig?.icon || CheckCircle2;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit -ml-2"
            onClick={() => navigate("/clientes")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {cliente.nome_fantasia || cliente.razao_social}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  {cliente.cnpj && <span>CNPJ: {cliente.cnpj}</span>}
                  {cliente.data_ativacao && (
                    <>
                      <span>•</span>
                      <span>Cliente desde {formatDate(cliente.data_ativacao, "MMM/yyyy")}</span>
                    </>
                  )}
                  <span>•</span>
                  <Badge variant="outline" className={cn("text-xs", statusConfig?.color)}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig?.label}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar serviço
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Registrar pagamento
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setCancelModal(true)}
                    disabled={cliente.status === "cancelado"}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar cliente
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="acessos">Acessos</TabsTrigger>
            <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="visao-geral" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Razão Social</p>
                    <p className="font-medium">{cliente.razao_social}</p>
                  </div>
                  {cliente.nome_fantasia && (
                    <div>
                      <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                      <p className="font-medium">{cliente.nome_fantasia}</p>
                    </div>
                  )}
                  {cliente.cnpj && (
                    <div>
                      <p className="text-sm text-muted-foreground">CNPJ</p>
                      <p className="font-medium">{cliente.cnpj}</p>
                    </div>
                  )}
                  {cliente.cpf && (
                    <div>
                      <p className="text-sm text-muted-foreground">CPF</p>
                      <p className="font-medium">{cliente.cpf}</p>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {cliente.telefone}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(cliente.telefone, "Telefone")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">E-mail</p>
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {cliente.email}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(cliente.email, "E-mail")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  {cliente.endereco && (
                    <div>
                      <p className="text-sm text-muted-foreground">Endereço</p>
                      <p className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {cliente.endereco}
                        {cliente.cidade && `, ${cliente.cidade}`}
                        {cliente.estado && ` - ${cliente.estado}`}
                        {cliente.cep && `, ${cliente.cep}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Financial Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo Financeiro</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Fee Mensal</p>
                      <p className="text-2xl font-bold">{formatCurrency(cliente.fee_mensal)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Modelo</p>
                        <p className="font-medium">
                          {cliente.modelo_cobranca === "fee"
                            ? "Fee Mensal"
                            : cliente.modelo_cobranca === "fee_percentual"
                            ? `Fee + ${cliente.percentual}%`
                            : "Avulso"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vencimento</p>
                        <p className="font-medium">
                          Todo dia {cliente.dia_vencimento || 10}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                      <p className="font-medium capitalize">{cliente.forma_pagamento}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Team */}
                <Card>
                  <CardHeader>
                    <CardTitle>Equipe Responsável</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {cliente.closer_nome && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Closer:</span>
                        <span className="font-medium">{cliente.closer_nome}</span>
                      </div>
                    )}
                    {cliente.sdr_nome && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">SDR:</span>
                        <span className="font-medium">{cliente.sdr_nome}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Serviços */}
          <TabsContent value="servicos" className="mt-6">
            <ServicosTab cliente={cliente} />
          </TabsContent>

          {/* Financeiro */}
          <TabsContent value="financeiro" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Histórico Financeiro</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Cobrança
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Integração com sistema de cobranças em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Acessos */}
          <TabsContent value="acessos" className="mt-6">
            <AcessosTab acessos={acessos || []} isLoading={loadingAcessos} clienteId={id || ""} />
          </TabsContent>

          {/* Arquivos */}
          <TabsContent value="arquivos" className="mt-6">
            <ArquivosTab arquivos={arquivos || []} isLoading={loadingArquivos} />
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline" className="mt-6">
            <TimelineTab timeline={timeline || []} isLoading={loadingTimeline} />
          </TabsContent>
        </Tabs>

        {/* Cancel Modal */}
        <Dialog open={cancelModal} onOpenChange={setCancelModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Cliente</DialogTitle>
              <DialogDescription>
                Esta ação irá cancelar o cliente e todos os serviços ativos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 space-y-2">
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Esta ação irá:
                </p>
                <ul className="text-sm text-destructive/80 list-disc list-inside space-y-1">
                  <li>Cancelar todos os serviços ativos</li>
                  <li>Interromper cobranças futuras</li>
                  <li>Encerrar projetos vinculados</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label>Motivo do cancelamento *</Label>
                <Textarea
                  value={cancelMotivo}
                  onChange={(e) => setCancelMotivo(e.target.value)}
                  placeholder="Descreva o motivo do cancelamento..."
                />
              </div>
              <div className="space-y-2">
                <Label>Para confirmar, digite o nome do cliente:</Label>
                <p className="text-sm text-muted-foreground font-mono">{cliente.razao_social}</p>
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Digite o nome do cliente"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelModal(false)}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelCliente}
                disabled={!cancelMotivo || confirmName !== cliente.razao_social || cancelarCliente.isPending}
              >
                {cancelarCliente.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Cancelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function ServicosTab({ cliente }: { cliente: any }) {
  const servicosAtivos = cliente.servicos?.filter((s: any) => s.status === "ativo") || [];
  const servicosCancelados = cliente.servicos?.filter((s: any) => s.status === "cancelado") || [];
  const [showCancelados, setShowCancelados] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Serviços Contratados</CardTitle>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {servicosAtivos.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhum serviço ativo</p>
        ) : (
          servicosAtivos.map((servico: any) => (
            <div
              key={servico.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-success" />
                <div>
                  <p className="font-medium">{servico.servico_nome}</p>
                  <p className="text-sm text-muted-foreground">
                    Responsável: {servico.responsavel_nome}
                  </p>
                  {servico.data_inicio && (
                    <p className="text-xs text-muted-foreground">
                      Início: {formatDate(servico.data_inicio)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">{formatCurrency(servico.valor)}/mês</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Trocar responsável
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Alterar valor
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelar serviço
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}

        {servicosCancelados.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCancelados(!showCancelados)}
              className="w-full"
            >
              Serviços Cancelados ({servicosCancelados.length})
              {showCancelados ? " ▲" : " ▼"}
            </Button>
            {showCancelados &&
              servicosCancelados.map((servico: any) => (
                <div
                  key={servico.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/50 opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <div>
                      <p className="font-medium line-through">{servico.servico_nome}</p>
                      <p className="text-sm text-muted-foreground">
                        Cancelado em {servico.data_cancelamento ? formatDate(servico.data_cancelamento) : "-"}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-muted-foreground">{formatCurrency(servico.valor)}/mês</p>
                </div>
              ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AcessosTab({ acessos, isLoading, clienteId }: { acessos: any[]; isLoading: boolean; clienteId: string }) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const togglePassword = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Acessos Salvos</CardTitle>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {acessos.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhum acesso cadastrado</p>
        ) : (
          acessos.map((acesso) => (
            <div key={acesso.id} className="p-4 rounded-lg border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">{acesso.tipo}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {acesso.usuario && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Usuário: {acesso.usuario}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(acesso.usuario, "Usuário")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}
              {acesso.senha && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Senha: {showPasswords[acesso.id] ? acesso.senha : "••••••••"}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => togglePassword(acesso.id)}
                    >
                      {showPasswords[acesso.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(acesso.senha, "Senha")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
              {acesso.url && (
                <a
                  href={acesso.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {acesso.url}
                </a>
              )}
              {acesso.observacoes && (
                <p className="text-xs text-muted-foreground">{acesso.observacoes}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ArquivosTab({ arquivos, isLoading }: { arquivos: any[]; isLoading: boolean }) {
  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Arquivos</CardTitle>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Arraste arquivos aqui ou clique para selecionar</p>
        </div>

        {arquivos.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhum arquivo enviado</p>
        ) : (
          arquivos.map((arquivo) => (
            <div
              key={arquivo.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{arquivo.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    Enviado por {arquivo.uploaded_por?.nome || "Sistema"} em{" "}
                    {arquivo.created_at ? formatDate(arquivo.created_at) : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {arquivo.tipo && (
                  <Badge variant="secondary" className="text-xs">
                    {arquivo.tipo}
                  </Badge>
                )}
                <Button variant="ghost" size="icon" asChild>
                  <a href={arquivo.url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function TimelineTab({ timeline, isLoading }: { timeline: any[]; isLoading: boolean }) {
  const formatDateTime = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhum evento registrado</p>
        ) : (
          <div className="relative space-y-0">
            {timeline.map((event, index) => {
              const config = TIMELINE_ICONS[event.tipo] || { icon: Clock, color: "text-muted-foreground" };
              const Icon = config.icon;

              return (
                <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
                  <div className="relative flex flex-col items-center">
                    <div className={cn("p-2 rounded-full bg-muted", config.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="flex-1 w-px bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium">{event.descricao}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.realizado_por?.nome && `Por ${event.realizado_por.nome} • `}
                      {event.created_at ? formatDateTime(event.created_at) : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
