import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCcw } from "lucide-react";

interface ModalReativarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { destinoFunil: "sdr" | "closer"; destinoEtapa: string }) => Promise<void>;
  onCancel: () => void;
  leadNome: string;
}

const ETAPAS_SDR = [
  { value: "novo", label: "Novo Lead" },
  { value: "tentativa_contato", label: "Tentativa de Contato" },
  { value: "contato_realizado", label: "Contato Realizado" },
  { value: "qualificado", label: "Qualificado" },
];

const ETAPAS_CLOSER = [
  { value: "reuniao_agendada", label: "Reunião Agendada" },
  { value: "reuniao_realizada", label: "Reunião Realizada" },
];

export function ModalReativar({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  leadNome,
}: ModalReativarProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [destinoFunil, setDestinoFunil] = useState<"sdr" | "closer">("sdr");
  const [destinoEtapa, setDestinoEtapa] = useState<string>("");

  const etapasDisponiveis = destinoFunil === "sdr" ? ETAPAS_SDR : ETAPAS_CLOSER;

  const handleSubmit = async () => {
    if (!destinoEtapa) return;

    setIsSubmitting(true);
    try {
      await onConfirm({ destinoFunil, destinoEtapa });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
    setDestinoFunil("sdr");
    setDestinoEtapa("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-success">
            <RefreshCcw className="w-5 h-5" />
            <DialogTitle>Reativar Lead</DialogTitle>
          </div>
          <DialogDescription>
            Selecione para onde deseja enviar <strong>{leadNome}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="destino-funil">Funil de destino *</Label>
            <Select
              value={destinoFunil}
              onValueChange={(value: "sdr" | "closer") => {
                setDestinoFunil(value);
                setDestinoEtapa("");
              }}
            >
              <SelectTrigger id="destino-funil">
                <SelectValue placeholder="Selecione o funil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sdr">Pipeline SDR</SelectItem>
                <SelectItem value="closer">Pipeline Closer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destino-etapa">Etapa de destino *</Label>
            <Select value={destinoEtapa} onValueChange={setDestinoEtapa}>
              <SelectTrigger id="destino-etapa">
                <SelectValue placeholder="Selecione a etapa" />
              </SelectTrigger>
              <SelectContent>
                {etapasDisponiveis.map((etapa) => (
                  <SelectItem key={etapa.value} value={etapa.value}>
                    {etapa.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !destinoEtapa}
            className="bg-success hover:bg-success/90"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Reativar Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
