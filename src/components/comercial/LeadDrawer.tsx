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
  MessageCircle,
  PhoneCall,
  FileText,
  Video,
  Plus,
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Atividade {
  id: string;
  tipo: string;
  descricao: string;
  realizadoPor: string;
  dataAtividade: Date;
}

interface FollowUp {
  id: string;
  dataProgramada: Date;
  descricao?: string;
  concluido: boolean;
  concluidoEm?: Date;
}

interface HistoricoItem {
  id: string;
  de: string;
  para: string;
  realizadoPor: string;
  data: Date;
}

interface LeadDrawerProps {
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
    createdAt: Date;
  } | null;
  atividades: Atividade[];
  followUps: FollowUp[];
  historico: HistoricoItem[];
  onAddAtividade?: () => void;
  onAddFollowUp?: () => void;
  onMarcarConcluido?: (followUpId: string) => void;
}

export function LeadDrawer({
  open,
  onOpenChange,
  lead,
  atividades,
  followUps,
  historico,
  onAddAtividade,
  onAddFollowUp,
  onMarcarConcluido,
}: LeadDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!lead) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getAtividadeIcon = (tipo: string) => {
    const icons: Record<string, typeof Phone> = {
      ligacao: PhoneCall,
      whatsapp: MessageCircle,
      email: Mail,
      reuniao: Video,
      anotacao: FileText,
    };
    const Icon = icons[tipo] || MessageCircle;
    return <Icon className="w-4 h-4" />;
  };

  const getFollowUpStatus = (followUp: FollowUp) => {
    if (followUp.concluido) return "concluido";
    const now = new Date();
    if (followUp.dataProgramada < now) return "atrasado";
    return "pendente";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:max-w-[400px] p-0 flex flex-col">
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
          <TabsList className="w-full justify-start rounded-none border-b border-border/20 bg-transparent px-6">
            <TabsTrigger value="info" className="data-[state=active]:bg-transparent">
              Informações
            </TabsTrigger>
            <TabsTrigger value="atividades" className="data-[state=active]:bg-transparent">
              Atividades
            </TabsTrigger>
            <TabsTrigger value="followups" className="data-[state=active]:bg-transparent">
              Follow-ups
            </TabsTrigger>
            <TabsTrigger value="historico" className="data-[state=active]:bg-transparent">
              Histórico
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
                    {lead.sdrResponsavel && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">SDR:</span>
                        <span>{lead.sdrResponsavel}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Criado:</span>
                      <span>
                        {format(lead.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
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

          {/* Tab: Atividades */}
          <TabsContent value="atividades" className="flex-1 overflow-auto m-0 relative">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {atividades.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma atividade registrada
                  </p>
                ) : (
                  <div className="space-y-4">
                    {atividades.map((atividade) => (
                      <div
                        key={atividade.id}
                        className="flex gap-3 p-3 bg-card rounded-lg border border-border/20"
                      >
                        <div className="mt-0.5 text-muted-foreground">
                          {getAtividadeIcon(atividade.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{atividade.descricao}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Por: {atividade.realizadoPor} •{" "}
                            {formatDistanceToNow(atividade.dataAtividade, {
                              locale: ptBR,
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
            {/* Floating button */}
            <Button
              size="sm"
              className="absolute bottom-4 right-4 gap-2 shadow-lg"
              onClick={onAddAtividade}
            >
              <Plus className="w-4 h-4" />
              Atividade
            </Button>
          </TabsContent>

          {/* Tab: Follow-ups */}
          <TabsContent value="followups" className="flex-1 overflow-auto m-0 relative">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {followUps.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum follow-up agendado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {followUps.map((followUp) => {
                      const status = getFollowUpStatus(followUp);
                      return (
                        <div
                          key={followUp.id}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border",
                            status === "concluido" && "bg-success/5 border-success/20",
                            status === "atrasado" && "bg-destructive/5 border-destructive/20",
                            status === "pendente" && "bg-warning/5 border-warning/20"
                          )}
                        >
                          {status === "concluido" ? (
                            <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                          ) : status === "atrasado" ? (
                            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                          ) : (
                            <Circle className="w-5 h-5 text-warning mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {format(followUp.dataProgramada, "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </p>
                            {followUp.descricao && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {followUp.descricao}
                              </p>
                            )}
                          </div>
                          {!followUp.concluido && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => onMarcarConcluido?.(followUp.id)}
                            >
                              Concluir
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
            {/* Floating button */}
            <Button
              size="sm"
              className="absolute bottom-4 right-4 gap-2 shadow-lg"
              onClick={onAddFollowUp}
            >
              <Plus className="w-4 h-4" />
              Follow-up
            </Button>
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="historico" className="flex-1 overflow-auto m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {historico.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma mudança registrada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {historico.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/20"
                      >
                        <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            Movido de <strong>{item.de}</strong> para{" "}
                            <strong>{item.para}</strong>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Por: {item.realizadoPor} •{" "}
                            {format(item.data, "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
