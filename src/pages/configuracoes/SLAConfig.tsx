import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, MoreVertical, Pencil, Trash2, Clock, ArrowLeft } from "lucide-react";
import { useSLAConfigs, useCreateSLA, useUpdateSLA, useDeleteSLA, SLAConfig } from "@/hooks/useSLA";
import { useClientes } from "@/hooks/useClientes";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export default function SLAConfigPage() {
  const { data: slaConfigs, isLoading } = useSLAConfigs();
  const { data: clientes } = useClientes();
  const createSLA = useCreateSLA();
  const updateSLA = useUpdateSLA();
  const deleteSLA = useDeleteSLA();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSLA, setEditingSLA] = useState<SLAConfig | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    tempo_horas: 24,
    servico_id: '',
    cliente_id: ''
  });

  // Separar SLAs por tipo
  const slasPadrao = slaConfigs?.filter(s => !s.servico_id && !s.cliente_id) || [];
  const slasPorServico = slaConfigs?.filter(s => s.servico_id && !s.cliente_id) || [];
  const slasPorCliente = slaConfigs?.filter(s => s.cliente_id) || [];

  const handleOpenModal = (sla?: SLAConfig) => {
    if (sla) {
      setEditingSLA(sla);
      setFormData({
        nome: sla.nome,
        tempo_horas: sla.tempo_horas,
        servico_id: sla.servico_id || '',
        cliente_id: sla.cliente_id || ''
      });
    } else {
      setEditingSLA(null);
      setFormData({ nome: '', tempo_horas: 24, servico_id: '', cliente_id: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const data = {
      nome: formData.nome,
      tempo_horas: formData.tempo_horas,
      servico_id: formData.servico_id || null,
      cliente_id: formData.cliente_id || null
    };

    if (editingSLA) {
      updateSLA.mutate({ id: editingSLA.id, ...data }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createSLA.mutate(data, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  const handleToggleAtivo = (sla: SLAConfig) => {
    updateSLA.mutate({ id: sla.id, ativo: !sla.ativo });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este SLA?')) {
      deleteSLA.mutate(id);
    }
  };

  const formatTempo = (horas: number) => {
    if (horas < 24) return `${horas} hora${horas > 1 ? 's' : ''}`;
    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;
    if (horasRestantes === 0) return `${dias} dia${dias > 1 ? 's' : ''}`;
    return `${dias} dia${dias > 1 ? 's' : ''} e ${horasRestantes}h`;
  };

  const SLARow = ({ sla }: { sla: SLAConfig }) => (
    <div className="flex items-center justify-between py-3 px-4 border-b last:border-0 hover:bg-muted/50">
      <div className="flex items-center gap-4">
        <span className="font-medium">{sla.nome}</span>
        <span className="text-muted-foreground">{formatTempo(sla.tempo_horas)}</span>
        <Badge variant={sla.ativo ? "default" : "secondary"}>
          {sla.ativo ? '🟢 Ativo' : '⚪ Inativo'}
        </Badge>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleOpenModal(sla)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleToggleAtivo(sla)}>
            {sla.ativo ? 'Desativar' : 'Ativar'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => handleDelete(sla.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/configuracoes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Configurações de SLA</h1>
            <p className="text-muted-foreground">
              Configure os tempos de resposta e entrega para sua agência
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* SLAs Padrão */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>SLAs Padrão</CardTitle>
                  <CardDescription>Aplicados a todos os clientes e serviços</CardDescription>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenModal()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingSLA ? 'Editar SLA' : 'Novo SLA'}
                      </DialogTitle>
                      <DialogDescription>
                        Configure o nome e tempo do SLA
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Ex: Resposta a cliente"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tempo">Tempo (em horas)</Label>
                        <Input
                          id="tempo"
                          type="number"
                          min={1}
                          value={formData.tempo_horas}
                          onChange={(e) => setFormData({ ...formData, tempo_horas: parseInt(e.target.value) || 1 })}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatTempo(formData.tempo_horas)}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="cliente">Cliente específico (opcional)</Label>
                        <Select 
                          value={formData.cliente_id} 
                          onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Nenhum (padrão)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhum (padrão)</SelectItem>
                            {clientes?.map((cliente) => (
                              <SelectItem key={cliente.id} value={cliente.id}>
                                {cliente.nome_fantasia || cliente.razao_social}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        disabled={!formData.nome || createSLA.isPending || updateSLA.isPending}
                      >
                        {(createSLA.isPending || updateSLA.isPending) ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                {slasPadrao.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhum SLA padrão configurado
                  </p>
                ) : (
                  slasPadrao.map((sla) => <SLARow key={sla.id} sla={sla} />)
                )}
              </CardContent>
            </Card>

            {/* SLAs por Serviço */}
            {slasPorServico.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>SLAs por Serviço</CardTitle>
                  <CardDescription>SLAs específicos para determinados serviços</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {slasPorServico.map((sla) => (
                    <div key={sla.id} className="border-b last:border-0">
                      <div className="px-4 py-2 bg-muted/50 font-medium">
                        {sla.servico?.nome}
                      </div>
                      <SLARow sla={sla} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* SLAs por Cliente */}
            {slasPorCliente.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>SLAs por Cliente (Premium)</CardTitle>
                  <CardDescription>SLAs personalizados para clientes específicos</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {slasPorCliente.map((sla) => (
                    <div key={sla.id} className="border-b last:border-0">
                      <div className="px-4 py-2 bg-muted/50 font-medium">
                        {sla.cliente?.nome_fantasia || sla.cliente?.razao_social}
                      </div>
                      <SLARow sla={sla} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Alertas */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="alerta-80" defaultChecked />
                  <label htmlFor="alerta-80" className="text-sm">
                    Notificar quando SLA estiver 80% do tempo
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="alerta-estourou" defaultChecked />
                  <label htmlFor="alerta-estourou" className="text-sm">
                    Notificar quando SLA estourar
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="relatorio-semanal" defaultChecked />
                  <label htmlFor="relatorio-semanal" className="text-sm">
                    Incluir no relatório semanal
                  </label>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
