import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, PartyPopper, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface ModalFechadoGanhoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  leadNome: string;
  valorProposta?: number;
}

export function ModalFechadoGanho({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  leadNome,
  valorProposta,
}: ModalFechadoGanhoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Trigger confetti when modal opens
      const duration = 1500;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [open]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-success">
            <PartyPopper className="w-5 h-5" />
            <DialogTitle>Parabéns! Negócio Fechado! 🎉</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Você está prestes a fechar o negócio com <strong>{leadNome}</strong>!
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-success/10">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            {valorProposta && (
              <div>
                <p className="text-sm text-muted-foreground">Valor do contrato</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(valorProposta)}/mês
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Após confirmar, o lead será convertido em cliente e você poderá
              preencher os dados de ativação.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-success hover:bg-success/90"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar Venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
