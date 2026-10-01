import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreVertical,
  Play,
  Check,
  X,
  Trash2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Appointment, AppointmentStatus } from "@/types/database";
import { useUpdateAppointment, useDeleteAppointment } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";
import ServiceNote from "./ServiceNote";
import CompleteAppointmentDialog from "./CompleteAppointmentDialog";

interface AppointmentListProps {
  appointments: Appointment[];
  selectedDate: Date;
  isLoading: boolean;
}

const AppointmentList = ({
  appointments,
  selectedDate,
  isLoading,
}: AppointmentListProps) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const openServiceNote = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowNote(true);
  };

  const openCompleteDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCompleteDialog(true);
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
            <Clock className="w-3 h-3" />
            Em andamento
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Agendado
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Finalizado
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Cancelado
          </span>
        );
      case "no_show":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Não compareceu
          </span>
        );
      default:
        return null;
    }
  };

  const handleStatusChange = (id: string, newStatus: AppointmentStatus) => {
    const updates: Partial<Appointment> & { id: string } = { id, status: newStatus };
    
    if (newStatus === "in_progress") {
      updates.check_in_at = new Date().toISOString();
    } else if (newStatus === "completed") {
      updates.check_out_at = new Date().toISOString();
    }
    
    updateAppointment.mutate(updates);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este agendamento?")) {
      deleteAppointment.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 lg:p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">
          Agendamentos
        </h3>
        <p className="text-sm text-muted-foreground capitalize">
          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Nenhum agendamento para este dia
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className={cn(
                "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors",
                appointment.status === "cancelled" && "opacity-60"
              )}
            >
              <div className="text-center min-w-[60px]">
                <p className="text-lg font-semibold text-foreground">
                  {appointment.scheduled_time?.slice(0, 5)}
                </p>
              </div>
              
              <div className="w-px h-12 bg-border" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-medium text-foreground truncate">
                    {appointment.clients?.name || "Cliente não informado"}
                  </p>
                  {getStatusBadge(appointment.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {appointment.vehicles
                    ? `${appointment.vehicles.brand} ${appointment.vehicles.model} • ${appointment.vehicles.plate}`
                    : "Veículo não informado"}{" "}
                  • {appointment.services?.name || "Serviço não informado"}
                </p>
                {appointment.employees && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Responsável: {appointment.employees.name}
                  </p>
                )}
              </div>

              {appointment.price && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-semibold text-foreground">
                    R$ {Number(appointment.price).toFixed(2)}
                  </p>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {appointment.status === "scheduled" && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(appointment.id, "in_progress")}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar serviço
                    </DropdownMenuItem>
                  )}
                  {appointment.status === "in_progress" && (
                    <DropdownMenuItem
                      onClick={() => openCompleteDialog(appointment)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Finalizar
                    </DropdownMenuItem>
                  )}
                  {(appointment.status === "scheduled" || appointment.status === "in_progress") && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(appointment.id, "cancelled")}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(appointment.id, "no_show")}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Não compareceu
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openServiceNote(appointment)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Nota de Serviço
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(appointment.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Service Note Modal */}
      {selectedAppointment && (
        <>
          <ServiceNote
            open={showNote}
            onClose={() => {
              setShowNote(false);
              setSelectedAppointment(null);
            }}
            appointment={selectedAppointment}
          />
          <CompleteAppointmentDialog
            open={showCompleteDialog}
            onClose={() => {
              setShowCompleteDialog(false);
              setSelectedAppointment(null);
            }}
            appointment={selectedAppointment}
          />
        </>
      )}
    </div>
  );
};

export default AppointmentList;
