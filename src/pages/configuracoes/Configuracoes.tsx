import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Palette, 
  Globe, 
  FileText,
  Settings,
  Users,
  Zap,
  Calendar,
  FileCheck,
  MessageSquare,
  Clock,
  CalendarOff,
  Bell,
  History
} from "lucide-react";
import { useConfiguracoesAgencia, useUpdateConfiguracoes, FUSOS_HORARIOS, MOEDAS } from "@/hooks/useConfiguracoes";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const MENU_ITEMS = [
  { id: 'geral', label: 'Geral', icon: Settings },
  { id: 'equipe', label: 'Equipe', icon: Users, href: '/equipe' },
  { id: 'integracoes', label: 'Integrações', icon: Zap },
  { id: 'onboarding', label: 'Onboarding', icon: Calendar, href: '/configuracoes/onboarding' },
  { id: 'contratos', label: 'Contratos', icon: FileCheck },
  { id: 'nps', label: 'NPS', icon: MessageSquare, href: '/nps/config' },
  { id: 'sla', label: 'SLA', icon: Clock, href: '/configuracoes/sla' },
  { id: 'ausencias', label: 'Ausências', icon: CalendarOff, href: '/configuracoes/ausencias' },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'auditoria', label: 'Auditoria', icon: History, href: '/configuracoes/auditoria' },
];

export default function Configuracoes() {
  const { data: config, isLoading } = useConfiguracoesAgencia();
  const updateConfig = useUpdateConfiguracoes();
  const [activeTab, setActiveTab] = useState('geral');

  const [formData, setFormData] = useState({
    nome_agencia: '',
    fuso_horario: 'America/Sao_Paulo',
    moeda: 'BRL',
    cor_principal: '#3B82F6',
    razao_social: '',
    cnpj: '',
    endereco: ''
  });

  // Atualizar form quando config carregar
  useState(() => {
    if (config) {
      setFormData({
        nome_agencia: config.nome_agencia || '',
        fuso_horario: config.fuso_horario || 'America/Sao_Paulo',
        moeda: config.moeda || 'BRL',
        cor_principal: config.cor_principal || '#3B82F6',
        razao_social: config.razao_social || '',
        cnpj: config.cnpj || '',
        endereco: config.endereco || ''
      });
    }
  });

  const handleSave = () => {
    updateConfig.mutate(formData);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Configurações</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Menu Lateral */}
          <Card className="lg:w-64 shrink-0">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  if (item.href) {
                    return (
                      <Link
                        key={item.id}
                        to={item.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        activeTab === item.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Conteúdo */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Configurações da Agência</CardTitle>
              <CardDescription>
                Configure as informações básicas da sua agência
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {activeTab === 'geral' && (
                <>
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Informações Básicas</span>
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="nome_agencia">Nome da Agência *</Label>
                        <Input
                          id="nome_agencia"
                          value={formData.nome_agencia}
                          onChange={(e) => setFormData({ ...formData, nome_agencia: e.target.value })}
                          placeholder="Minha Agência de Marketing"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Logo</Label>
                          <div className="mt-1 flex gap-2">
                            <Button variant="outline" size="sm">Upload</Button>
                            <Button variant="ghost" size="sm">Remover</Button>
                          </div>
                        </div>
                        <div>
                          <Label>Favicon</Label>
                          <div className="mt-1 flex gap-2">
                            <Button variant="outline" size="sm">Upload</Button>
                            <Button variant="ghost" size="sm">Remover</Button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fuso_horario">Fuso Horário</Label>
                          <Select 
                            value={formData.fuso_horario} 
                            onValueChange={(v) => setFormData({ ...formData, fuso_horario: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FUSOS_HORARIOS.map((fuso) => (
                                <SelectItem key={fuso.value} value={fuso.value}>
                                  {fuso.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="moeda">Moeda</Label>
                          <Select 
                            value={formData.moeda} 
                            onValueChange={(v) => setFormData({ ...formData, moeda: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MOEDAS.map((moeda) => (
                                <SelectItem key={moeda.value} value={moeda.value}>
                                  {moeda.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr />

                  {/* Cores da Interface */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Palette className="h-4 w-4" />
                      <span className="text-sm font-medium">Cores da Interface</span>
                    </div>

                    <div>
                      <Label htmlFor="cor_principal">Cor Principal</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="cor_principal"
                          type="color"
                          value={formData.cor_principal}
                          onChange={(e) => setFormData({ ...formData, cor_principal: e.target.value })}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.cor_principal}
                          onChange={(e) => setFormData({ ...formData, cor_principal: e.target.value })}
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">
                          (Aplicada em botões e destaques)
                        </span>
                      </div>
                    </div>
                  </div>

                  <hr />

                  {/* Dados da Empresa */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Dados da Empresa (para contratos)</span>
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="razao_social">Razão Social</Label>
                        <Input
                          id="razao_social"
                          value={formData.razao_social}
                          onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input
                          id="cnpj"
                          value={formData.cnpj}
                          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                          placeholder="00.000.000/0001-00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endereco">Endereço</Label>
                        <Input
                          id="endereco"
                          value={formData.endereco}
                          onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={updateConfig.isPending}>
                      {updateConfig.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </>
              )}

              {activeTab === 'integracoes' && (
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configurações de integrações em breve.</p>
                </div>
              )}

              {activeTab === 'contratos' && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configurações de contratos em breve.</p>
                </div>
              )}

              {activeTab === 'notificacoes' && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configurações de notificações em breve.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
