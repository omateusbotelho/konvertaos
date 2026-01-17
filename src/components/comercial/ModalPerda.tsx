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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";

const perdaSchema = z.object({
  motivo_perda_id: z.string().min(1, "Selecione o motivo da perda"),
  observacoes: z.string().optional(),
});

type PerdaForm = z.infer<typeof perdaSchema>;

interface ModalPerdaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: PerdaForm) => Promise<void>;
  onCancel: () => void;
  leadNome: string;
  motivosPerda: Array<{ id: string; nome: string }>;
}

export function ModalPerda({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  leadNome,
  motivosPerda,
}: ModalPerdaProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PerdaForm>({
    resolver: zodResolver(perdaSchema),
    defaultValues: {
      motivo_perda_id: "",
      observacoes: "",
    },
  });

  const handleSubmit = async (data: PerdaForm) => {
    setIsSubmitting(true);
    try {
      await onConfirm(data);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <DialogTitle>Marcar como Perdido</DialogTitle>
          </div>
          <DialogDescription>
            Você está marcando o lead <strong>{leadNome}</strong> como perdido.
            Esta ação pode ser revertida posteriormente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="motivo_perda_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Perda *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {motivosPerda.map((motivo) => (
                        <SelectItem key={motivo.id} value={motivo.id}>
                          {motivo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      placeholder="Detalhes adicionais sobre a perda..."
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
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Perda
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
