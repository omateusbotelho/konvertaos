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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";

const perdaCloserSchema = z.object({
  motivo_perda_id: z.string().min(1, "Selecione o motivo da perda"),
  observacoes: z.string().optional(),
  mover_para_frios: z.boolean().default(false),
});

type PerdaCloserForm = z.infer<typeof perdaCloserSchema>;

interface ModalPerdaCloserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: PerdaCloserForm) => Promise<void>;
  onCancel: () => void;
  leadNome: string;
  motivosPerda: Array<{ id: string; nome: string }>;
}

export function ModalPerdaCloser({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  leadNome,
  motivosPerda,
}: ModalPerdaCloserProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PerdaCloserForm>({
    resolver: zodResolver(perdaCloserSchema),
    defaultValues: {
      motivo_perda_id: "",
      observacoes: "",
      mover_para_frios: false,
    },
  });

  const handleSubmit = async (data: PerdaCloserForm) => {
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

            <FormField
              control={form.control}
              name="mover_para_frios"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/50 p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      Mover para Leads Frios
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      O lead poderá ser reativado posteriormente
                    </p>
                  </div>
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
