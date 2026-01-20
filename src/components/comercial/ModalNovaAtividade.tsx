import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Phone,
  MessageCircle,
  Mail,
  Video,
  FileText,
  CalendarIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { ATIVIDADE_TIPO_LABELS, ATIVIDADE_TIPOS } from "@/hooks/useLeadAtividades";

type AtividadeTipo = Database["public"]["Enums"]["atividade_tipo"];

interface ModalNovaAtividadeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadNome?: string;
}

const ATIVIDADE_ICONS: Record<AtividadeTipo, typeof Phone> = {
  ligacao: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  reuniao: Video,
  anotacao: FileText,
};

const ATIVIDADE_COLORS: Record<AtividadeTipo, { bg: string; text: string; ring: string }> = {
  ligacao: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    ring: "ring-blue-500",
  },
  whatsapp: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    ring: "ring-emerald-500",
  },
  email: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    ring: "ring-amber-500",
  },
  reuniao: {
    bg: "bg-purple-500/10",
    text: "text-purple-500",
    ring: "ring-purple-500",
  },
  anotacao: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    ring: "ring-muted-foreground",
  },
};

export function ModalNovaAtividade({
  open,
  onOpenChange,
  leadId,
  leadNome,
}: ModalNovaAtividadeProps) {
  const [tipo, setTipo] = useState<AtividadeTipo>("ligacao");
  const [descricao, setDescricao] = useState("");
  const [dataAtividade, setDataAtividade] = useState<Date>(new Date());
  const [hora, setHora] = useState(format(new Date(), "HH:mm"));

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setTipo("ligacao");
    setDescricao("");
    setDataAtividade(new Date());
    setHora(format(new Date(), "HH:mm"));
  };

  const createAtividadeMutation = useMutation({
    mutationFn: async () => {
      // Combine date and time
      const [hours, minutes] = hora.split(":").map(Number);
      const dataCompleta = new Date(dataAtividade);
      dataCompleta.setHours(hours, minutes, 0, 0);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("atividades_lead").insert({
        lead_id: leadId,
        tipo,
        descricao: descricao.trim(),
        data_atividade: dataCompleta.toISOString(),
        realizado_por_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Atividade registrada",
        description: `${ATIVIDADE_TIPO_LABELS[tipo]} adicionada com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ["lead-atividades", leadId] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Erro ao criar atividade:", error);
      toast({
        title: "Erro ao registrar",
        description: "Não foi possível registrar a atividade. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      toast({
        title: "Descrição obrigatória",
        description: "Por favor, adicione uma descrição para a atividade.",
        variant: "destructive",
      });
      return;
    }
    createAtividadeMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Atividade</DialogTitle>
            <DialogDescription>
              {leadNome ? `Adicionar atividade para ${leadNome}` : "Adicione uma nova interação com o lead"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Tipo de Atividade */}
            <div className="space-y-2">
              <Label>Tipo de Atividade</Label>
              <div className="grid grid-cols-5 gap-2">
                {ATIVIDADE_TIPOS.map((t) => {
                  const Icon = ATIVIDADE_ICONS[t];
                  const colors = ATIVIDADE_COLORS[t];
                  const isSelected = tipo === t;

                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                        isSelected
                          ? `${colors.bg} ${colors.text} ring-2 ${colors.ring} border-transparent`
                          : "border-border/50 hover:border-border hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium">
                        {ATIVIDADE_TIPO_LABELS[t]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataAtividade && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataAtividade ? (
                        format(dataAtividade, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataAtividade}
                      onSelect={(date) => date && setDataAtividade(date)}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora">Hora</Label>
                <input
                  id="hora"
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                placeholder={getPlaceholder(tipo)}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createAtividadeMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createAtividadeMutation.isPending || !descricao.trim()}
            >
              {createAtividadeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Registrar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getPlaceholder(tipo: AtividadeTipo): string {
  switch (tipo) {
    case "ligacao":
      return "Ex: Ligação realizada, cliente demonstrou interesse no plano premium...";
    case "whatsapp":
      return "Ex: Enviada proposta por WhatsApp, aguardando retorno...";
    case "email":
      return "Ex: Enviado e-mail com apresentação comercial...";
    case "reuniao":
      return "Ex: Reunião de apresentação realizada, próximos passos definidos...";
    case "anotacao":
      return "Ex: Cliente mencionou que viaja na próxima semana...";
    default:
      return "Descreva a atividade realizada...";
  }
}
