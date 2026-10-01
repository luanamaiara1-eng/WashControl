import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAppointmentByToken } from "@/hooks/usePublicBooking";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Car,
  Loader2,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function BookingConfirmation() {
  const { token } = useParams<{ token: string }>();
  const { data: appointment, isLoading, error } = useAppointmentByToken(token || "");

  const handleCopyLink = () => {
    const cancelUrl = `${window.location.origin}/cancelar/${token}`;
    navigator.clipboard.writeText(cancelUrl);
    toast.success("Link de cancelamento copiado!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Agendamento não encontrado</h2>
            <p className="text-muted-foreground">
              O link pode ter expirado ou o agendamento não existe.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-600">Agendamento Confirmado!</h1>
            <p className="text-muted-foreground mt-2">
              Seu agendamento foi realizado com sucesso.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">
                  {format(new Date(appointment.scheduled_date + "T12:00:00"), "EEEE, d 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Horário</p>
                <p className="font-medium">{appointment.scheduled_time?.slice(0, 5)}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Serviço</p>
                <p className="font-medium">{appointment.services?.name}</p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor:</span>
              <span className="text-xl font-bold text-primary">
                R$ {Number(appointment.services?.price || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Guarde este link para cancelar seu agendamento se necessário:
            </p>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/cancelar/${token}`}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver Agendamento
                </Link>
              </Button>
            </div>

            <Button asChild variant="ghost" className="w-full">
              <Link to="/">
                Voltar ao início
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
