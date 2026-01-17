import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNPSConfig, useUpdateNPSConfig, useClientesElegiveisNPS, useEnviarNPSManual } from '@/hooks/useNPS';
import { useClientes } from '@/hooks/useClientes';
import { KonvertaCard } from '@/components/ui/konverta-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Send, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NPSConfig() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: config, isLoading } = useNPSConfig();
  const updateConfig = useUpdateNPSConfig();
  const { data: clientesAtivos } = useClientes({ status: 'ativo' });
  const { data: clientesElegiveis } = useClientesElegiveisNPS();
  const enviarNPSManual = useEnviarNPSManual();

  const [formData, setFormData] = useState({
    ativo: true,
    frequencia_meses: 3,
    email_assunto: '',
    email_corpo: '',
  });
  const [selectedCliente, setSelectedCliente] = useState<string>('');

  useEffect(() => {
    if (config) {
      setFormData({
        ativo: config.ativo,
        frequencia_meses: config.frequencia_meses,
        email_assunto: config.email_assunto,
        email_corpo: config.email_corpo,
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!config) return;
    
    await updateConfig.mutateAsync({
      id: config.id,
      ...formData,
    });
  };

  const handleEnviarParaCliente = async () => {
    if (!selectedCliente) return;
    
    await enviarNPSManual.mutateAsync(selectedCliente);
    setSelectedCliente('');
  };

  const handleEnviarParaTodos = async () => {
    if (!clientesElegiveis || clientesElegiveis.length === 0) {
      toast({
        title: 'Nenhum cliente elegível',
        description: 'Não há clientes elegíveis para receber NPS no momento.',
        variant: 'destructive',
      });
      return;
    }

    for (const cliente of clientesElegiveis) {
      await enviarNPSManual.mutateAsync(cliente.id);
    }

    toast({
      title: 'Envio em massa concluído',
      description: `NPS enviado para ${clientesElegiveis.length} clientes.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/nps')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações de NPS</h1>
          <p className="text-muted-foreground">Configure o envio automático de pesquisas</p>
        </div>
      </div>

      {/* Main Config */}
      <KonvertaCard className="p-6 space-y-6">
        {/* Ativo Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Envio Automático</Label>
            <p className="text-sm text-muted-foreground">
              Ativar envio automático de pesquisas NPS
            </p>
          </div>
          <Switch
            checked={formData.ativo}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
          />
        </div>

        <div className="border-t pt-6">
          <Label htmlFor="frequencia">Frequência de Envio</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Intervalo mínimo entre envios para o mesmo cliente
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm">Enviar pesquisa a cada</span>
            <Input
              id="frequencia"
              type="number"
              min={1}
              max={12}
              value={formData.frequencia_meses}
              onChange={(e) => setFormData(prev => ({ ...prev, frequencia_meses: parseInt(e.target.value) || 3 }))}
              className="w-20"
            />
            <span className="text-sm">meses</span>
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold">Template do E-mail</h3>

          <div className="space-y-2">
            <Label htmlFor="assunto">Assunto</Label>
            <Input
              id="assunto"
              value={formData.email_assunto}
              onChange={(e) => setFormData(prev => ({ ...prev, email_assunto: e.target.value }))}
              placeholder="Como está sua experiência conosco?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="corpo">Corpo do E-mail</Label>
            <Textarea
              id="corpo"
              value={formData.email_corpo}
              onChange={(e) => setFormData(prev => ({ ...prev, email_corpo: e.target.value }))}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {'{{cliente_nome}}'}, {'{{link_pesquisa}}'}
            </p>
          </div>
        </div>

        <div className="border-t pt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/nps')}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateConfig.isPending}>
            {updateConfig.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </KonvertaCard>

      {/* Manual Actions */}
      <KonvertaCard className="p-6 space-y-6">
        <h3 className="font-semibold">Ações Manuais</h3>

        {/* Send to specific client */}
        <div className="space-y-2">
          <Label>Enviar para cliente específico</Label>
          <div className="flex gap-2">
            <Select value={selectedCliente} onValueChange={setSelectedCliente}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientesAtivos?.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome_fantasia || cliente.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleEnviarParaCliente} 
              disabled={!selectedCliente || enviarNPSManual.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        </div>

        {/* Send to all eligible */}
        <div className="border-t pt-6 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enviar para todos elegíveis</Label>
              <p className="text-sm text-muted-foreground">
                {clientesElegiveis?.length || 0} cliente(s) elegível(is) para receber NPS
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={!clientesElegiveis || clientesElegiveis.length === 0}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Enviar para todos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar envio em massa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você está prestes a enviar a pesquisa NPS para {clientesElegiveis?.length || 0} cliente(s).
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEnviarParaTodos}>
                    Confirmar envio
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </KonvertaCard>
    </div>
  );
}
