import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText } from "lucide-react";

const propostaSchema = z.object({
  valor_proposta: z.string().min(1, "Informe o valor da proposta"),
  observacoes: z.string().optional(),
});

type PropostaForm = z.infer<typeof propostaSchema>;

interface ModalPropostaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { valor_proposta: number; observacoes?: string }) => Promise<void>;
  onCancel: () => void;
  leadNome: string;
}

export function ModalProposta({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  leadNome,
}: ModalPropostaProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PropostaForm>({
    resolver: zodResolver(propostaSchema),
    defaultValues: {
      valor_proposta: "",
      observacoes: "",
    },
  });

  const handleSubmit = async (data: PropostaForm) => {
    setIsSubmitting(true);
    try {
      // Parse valor (remove R$, dots, and convert comma to dot)
      const valorClean = data.valor_proposta
        .replace(/[R$\s.]/g, "")
        .replace(",", ".");
      const valor = parseFloat(valorClean);

      if (isNaN(valor) || valor <= 0) {
        form.setError("valor_proposta", { message: "Valor inválido" });
        setIsSubmitting(false);
        return;
      }

      await onConfirm({
        valor_proposta: valor,
        observacoes: data.observacoes,
      });
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onCancel();
    onOpenChange(false);
  };

  const formatCurrencyInput = (value: string) => {
    // Remove non-numeric chars except comma
    let cleaned = value.replace(/[^\d,]/g, "");
    return cleaned;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-warning">
            <FileText className="w-5 h-5" />
            <DialogTitle>Enviar Proposta</DialogTitle>
          </div>
          <DialogDescription>
            Registrar proposta enviada para <strong>{leadNome}</strong>.
            Um follow-up será criado automaticamente para 2 dias.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="valor_proposta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Proposta (mensal) *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        R$
                      </span>
                      <Input
                        placeholder="3.500,00"
                        className="pl-9"
                        {...field}
                        onChange={(e) =>
                          field.onChange(formatCurrencyInput(e.target.value))
                        }
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes da proposta, condições especiais..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Proposta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
