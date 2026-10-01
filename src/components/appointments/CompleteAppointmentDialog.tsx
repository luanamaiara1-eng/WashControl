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
import { useUpdateAppointment } from "@/hooks/useAppointments";
import { useCreateClientDebt } from "@/hooks/useClientDebt";
import { Appointment } from "@/types/database";
import { Loader2, CreditCard, Banknote, QrCode, Landmark, HandCoins } from "lucide-react";
import { toast } from "sonner";

interface CompleteAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
}

const paymentMethods = [
  { value: "cash", label: "Dinheiro", icon: Banknote },
  { value: "credit", label: "Cartão de Crédito", icon: CreditCard },
  { value: "debit", label: "Cartão de Débito", icon: CreditCard },
  { value: "pix", label: "PIX", icon: QrCode },
  { value: "transfer", label: "Transferência", icon: Landmark },
  { value: "fiado", label: "Fiado (A receber)", icon: HandCoins },
];

const CompleteAppointmentDialog = ({
  open,
  onClose,
  appointment,
}: CompleteAppointmentDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const updateAppointment = useUpdateAppointment();
  const createDebt = useCreateClientDebt();

  const isLoading = updateAppointment.isPending || createDebt.isPending;

  const handleComplete = async () => {
    if (!paymentMethod) {
      toast.error("Selecione um método de pagamento");
      return;
    }

    try {
      // If payment method is "fiado", create a debt record
      if (paymentMethod === "fiado") {
        if (!appointment.client_id) {
          toast.error("Cliente não informado. Não é possível registrar fiado.");
          return;
        }

        await createDebt.mutateAsync({
          client_id: appointment.client_id,
          client_name: appointment.clients?.name || "Cliente",
          amount: Number(appointment.price) || 0,
          description: `Serviço: ${appointment.services?.name || "Não especificado"} - ${appointment.vehicles?.plate || ""}`,
          due_date: undefined,
        });
      }

      // Update appointment status to completed
      await updateAppointment.mutateAsync({
        id: appointment.id,
        status: "completed",
        check_out_at: new Date().toISOString(),
        payment_method: paymentMethod === "fiado" ? undefined : (paymentMethod as "cash" | "pix" | "credit" | "debit" | "transfer"),
      });

      toast.success(
        paymentMethod === "fiado"
          ? "Serviço finalizado! Conta a receber criada para o cliente."
          : "Serviço finalizado com sucesso!"
      );
      onClose();
    } catch (error) {
      console.error("Error completing appointment:", error);
      toast.error("Erro ao finalizar serviço");
    }
  };

  const selectedMethod = paymentMethods.find((m) => m.value === paymentMethod);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Serviço</DialogTitle>
          <DialogDescription>
            Selecione a forma de pagamento para concluir o atendimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Service Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{appointment.clients?.name || "Não informado"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Serviço:</span>
              <span className="font-medium">{appointment.services?.name || "Não informado"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Veículo:</span>
              <span className="font-medium">
                {appointment.vehicles
                  ? `${appointment.vehicles.brand} ${appointment.vehicles.model} - ${appointment.vehicles.plate}`
                  : "Não informado"}
              </span>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between">
              <span className="font-medium">Total:</span>
              <span className="font-bold text-lg text-primary">
                R$ {Number(appointment.price || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento">
                  {selectedMethod && (
                    <div className="flex items-center gap-2">
                      <selectedMethod.icon className="w-4 h-4" />
                      {selectedMethod.label}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      <method.icon className="w-4 h-4" />
                      {method.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fiado Warning */}
          {paymentMethod === "fiado" && (
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-sm text-warning-foreground">
              <p className="font-medium">⚠️ Pagamento Fiado</p>
              <p className="text-muted-foreground mt-1">
                Uma conta a receber será criada automaticamente para o cliente{" "}
                <strong>{appointment.clients?.name}</strong>.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleComplete} disabled={isLoading || !paymentMethod}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Finalizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteAppointmentDialog;
