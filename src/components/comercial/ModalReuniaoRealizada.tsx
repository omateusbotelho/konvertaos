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
import { Loader2, Video } from "lucide-react";

const reuniaoSchema = z.object({
  observacoes: z.string().optional(),
});

type ReuniaoForm = z.infer<typeof reuniaoSchema>;

interface ModalReuniaoRealizadaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: ReuniaoForm) => Promise<void>;
  onCancel: () => void;
  leadNome: string;
}

export function ModalReuniaoRealizada({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  leadNome,
}: ModalReuniaoRealizadaProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReuniaoForm>({
    resolver: zodResolver(reuniaoSchema),
    defaultValues: {
      observacoes: "",
    },
  });

  const handleSubmit = async (data: ReuniaoForm) => {
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
          <div className="flex items-center gap-2 text-primary">
            <Video className="w-5 h-5" />
            <DialogTitle>Reunião Realizada</DialogTitle>
          </div>
          <DialogDescription>
            Registrar que a reunião com <strong>{leadNome}</strong> foi realizada.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anotações da Reunião</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Principais pontos discutidos, próximos passos..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Pular
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
