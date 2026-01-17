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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const novoLeadSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  empresa: z.string().optional(),
  telefone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  origem_id: z.string().min(1, "Selecione a origem"),
  servico_interesse_id: z.string().optional(),
  observacoes: z.string().optional(),
  sdr_responsavel_id: z.string().optional(),
});

type NovoLeadForm = z.infer<typeof novoLeadSchema>;

interface NovoLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NovoLeadForm) => Promise<void>;
  origens: Array<{ id: string; nome: string }>;
  servicos: Array<{ id: string; nome: string }>;
  sdrs: Array<{ id: string; nome: string }>;
}

export function NovoLeadModal({
  open,
  onOpenChange,
  onSubmit,
  origens,
  servicos,
  sdrs,
}: NovoLeadModalProps) {
  const { profile, isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NovoLeadForm>({
    resolver: zodResolver(novoLeadSchema),
    defaultValues: {
      nome: "",
      empresa: "",
      telefone: "",
      email: "",
      origem_id: "",
      servico_interesse_id: "",
      observacoes: "",
      sdr_responsavel_id: isAdmin ? "" : profile?.id || "",
    },
  });

  const handleSubmit = async (data: NovoLeadForm) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo lead. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do lead" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="empresa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="origem_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origem *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {origens.map((origem) => (
                        <SelectItem key={origem.id} value={origem.id}>
                          {origem.nome}
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
              name="servico_interesse_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço de Interesse</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {servicos.map((servico) => (
                        <SelectItem key={servico.id} value={servico.id}>
                          {servico.nome}
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
                      placeholder="Anotações sobre o lead..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isAdmin && (
              <FormField
                control={form.control}
                name="sdr_responsavel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SDR Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Distribuição automática" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sdrs.map((sdr) => (
                          <SelectItem key={sdr.id} value={sdr.id}>
                            {sdr.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Lead
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
