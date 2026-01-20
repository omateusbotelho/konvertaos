import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  Mail,
  Building2,
  Copy,
  Check,
  Clock,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LeadAtividadesTimeline } from "./LeadAtividadesTimeline";

interface LeadDrawerCloserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    nome: string;
    empresa?: string;
    telefone: string;
    email?: string;
    origem?: string;
    etapa?: string;
    servicoInteresse?: string;
    observacoes?: string;
    sdrResponsavel?: string;
    closerResponsavel?: string;
    dataAgendamento?: Date;
    valorProposta?: number;
    createdAt: Date;
  } | null;
  onReagendar?: () => void;
}

export function LeadDrawerCloser({
  open,
  onOpenChange,
  lead,
  onReagendar,
}: LeadDrawerCloserProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!lead) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[450px] sm:max-w-[450px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b border-border/20">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <SheetTitle className="text-xl">{lead.nome}</SheetTitle>
              {lead.empresa && (
                <SheetDescription className="flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3" />
                  {lead.empresa}
                </SheetDescription>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {lead.origem && (
              <Badge variant="outline" className="text-xs">
                {lead.origem}
              </Badge>
            )}
            {lead.etapa && (
              <Badge variant="secondary" className="text-xs">
                {lead.etapa}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b border-border/20 bg-transparent px-6 flex-wrap h-auto py-1">
            <TabsTrigger value="info" className="data-[state=active]:bg-transparent text-xs">
              Info
            </TabsTrigger>
            <TabsTrigger value="historico" className="data-[state=active]:bg-transparent text-xs gap-1">
              <History className="w-3 h-3" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="proposta" className="data-[state=active]:bg-transparent text-xs">
              Proposta
            </TabsTrigger>
            <TabsTrigger value="agendamento" className="data-[state=active]:bg-transparent text-xs">
              Agendamento
            </TabsTrigger>
            <TabsTrigger value="origem" className="data-[state=active]:bg-transparent text-xs">
              Origem
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informações */}
          <TabsContent value="info" className="flex-1 overflow-auto m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Contato
                  </h4>
                  <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/20">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{lead.telefone}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(lead.telefone, "telefone")}
                    >
                      {copiedField === "telefone" ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {lead.email && (
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/20">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{lead.email}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(lead.email!, "email")}
                      >
                        {copiedField === "email" ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Detalhes
                  </h4>
                  <div className="grid gap-3">
                    {lead.servicoInteresse && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Serviço:</span>
                        <span>{lead.servicoInteresse}</span>
                      </div>
                    )}
                    {lead.closerResponsavel && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Closer:</span>
                        <span>{lead.closerResponsavel}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">No funil:</span>
                      <span>
                        {formatDistanceToNow(lead.createdAt, { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {lead.observacoes && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Observações
                    </h4>
                    <p className="text-sm text-foreground bg-card p-3 rounded-lg border border-border/20">
                      {lead.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Histórico de Atividades */}
          <TabsContent value="historico" className="flex-1 overflow-auto m-0">
            <LeadAtividadesTimeline leadId={lead.id} />
          </TabsContent>

          {/* Tab: Proposta */}
          <TabsContent value="proposta" className="flex-1 overflow-auto m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {lead.valorProposta ? (
                  <>
                    <div className="p-4 bg-success/5 rounded-lg border border-success/20">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-success" />
                        <span className="text-sm text-muted-foreground">
                          Valor atual
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-success">
                        {formatCurrency(lead.valorProposta)}/mês
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Histórico de Valores
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Nenhuma alteração registrada
                      </p>
                    </div>

                    <Button className="w-full gap-2">
                      <FileText className="w-4 h-4" />
                      Atualizar proposta
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma proposta enviada ainda
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Agendamento */}
          <TabsContent value="agendamento" className="flex-1 overflow-auto m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {lead.dataAgendamento ? (
                  <>
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Data da Reunião
                        </span>
                      </div>
                      <p className="text-lg font-semibold">
                        {format(lead.dataAgendamento, "EEEE, dd 'de' MMMM", {
                          locale: ptBR,
                        })}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {format(lead.dataAgendamento, "HH:mm", { locale: ptBR })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border/20">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-sm">Confirmada</span>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={onReagendar}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reagendar
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma reunião agendada
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Origem */}
          <TabsContent value="origem" className="flex-1 overflow-auto m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    SDR Responsável
                  </h4>
                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/20">
                    <div className="p-2 rounded-full bg-primary/10">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {lead.sdrResponsavel || "Não atribuído"}
                      </p>
                      <p className="text-xs text-muted-foreground">SDR</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Origem do Lead
                  </h4>
                  <div className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border/20">
                    <Badge variant="outline">{lead.origem || "Não informada"}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Data de Entrada no Closer
                  </h4>
                  <p className="text-sm">
                    {format(lead.createdAt, "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
