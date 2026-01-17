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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";

interface ModalDescartarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { motivo?: string }) => Promise<void>;
  onCancel: () => void;
  leadNome: string;
}

export function ModalDescartar({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  leadNome,
}: ModalDescartarProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [motivo, setMotivo] = useState("");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm({ motivo: motivo || undefined });
      onOpenChange(false);
      setMotivo("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
    setMotivo("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            <DialogTitle>Descartar Lead</DialogTitle>
          </div>
          <DialogDescription>
            O lead <strong>{leadNome}</strong> será marcado como descartado e
            arquivado. Esta ação pode ser revertida posteriormente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do descarte (opcional)</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Lead não responde após 3 tentativas..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            variant="destructive"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Descartar Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
