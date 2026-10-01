import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format, isBefore, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAppointmentByToken, useCancelAppointmentByToken } from "@/hooks/usePublicBooking";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Clock,
  Car,
  User,
  Loader2,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Ban,
} from "lucide-react";

export default function CancelBooking() {
  const { token } = useParams<{ token: string }>();
  const [cancelled, setCancelled] = useState(false);
  const { data: appointment, isLoading, error, refetch } = useAppointmentByToken(token || "");
  const cancelMutation = useCancelAppointmentByToken();

  const handleCancel = async () => {
    if (!token) return;

    try {
      await cancelMutation.mutateAsync(token);
      setCancelled(true);
      refetch();
    } catch (error) {
      // Error is handled in mutation
    }
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
            <Button asChild className="mt-4">
              <Link to="/">Voltar ao início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCancelled = appointment.status === "cancelled" || cancelled;
  const isCompleted = appointment.status === "completed";

  // Check if appointment date has passed
  const appointmentDateTime = new Date(
    `${appointment.scheduled_date}T${appointment.scheduled_time}`
  );
  const isPast = isBefore(appointmentDateTime, new Date());

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          {/* Status Header */}
          <div className="text-center mb-6">
            {isCancelled ? (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ban className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-red-600">Agendamento Cancelado</h1>
                <p className="text-muted-foreground mt-2">
                  Este agendamento foi cancelado.
                </p>
              </>
            ) : isCompleted ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-green-600">Agendamento Concluído</h1>
                <p className="text-muted-foreground mt-2">
                  Este agendamento já foi realizado.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold">Seu Agendamento</h1>
                <p className="text-muted-foreground mt-2">
                  Confira os detalhes abaixo.
                </p>
              </>
            )}
          </div>

          {/* Appointment Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{appointment.clients?.name}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">
                  {format(new Date(appointment.scheduled_date + "T12:00:00"), "EEEE, d 'de' MMMM", {
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

          {/* Actions */}
          <div className="mt-6 space-y-3">
            {!isCancelled && !isCompleted && !isPast && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar Agendamento
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser
                      desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Manter agendamento</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {cancelMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Cancelando...
                        </>
                      ) : (
                        "Sim, cancelar"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {isPast && !isCancelled && !isCompleted && (
              <p className="text-sm text-muted-foreground text-center">
                Este agendamento já passou e não pode mais ser cancelado.
              </p>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link to="/">Voltar ao início</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
