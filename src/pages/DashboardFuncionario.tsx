import { useState } from "react";
import { format, startOfDay, endOfDay, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  LogOut,
  Clock,
  CheckCircle2,
  Play,
  User,
  Car,
  Loader2,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEmployeeSession } from "@/hooks/useEmployeeSession";
import { useAppointmentNotifications } from "@/hooks/useAppointmentNotifications";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

interface AppointmentData {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  price: number | null;
  employee_commission: number | null;
  clients: { name: string } | null;
  vehicles: { plate: string; model: string; brand: string } | null;
  services: { name: string; duration_minutes: number; price: number } | null;
}

interface BusinessSettingsData {
  show_service_values_to_employees: boolean;
}

const DashboardFuncionario = () => {
  const navigate = useNavigate();
  const { employeeSession, logout } = useEmployeeSession();
  
  // Enable real-time notifications for new appointments
  useAppointmentNotifications();
  
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch business settings to check if values should be shown
  const { data: businessSettings } = useQuery({
    queryKey: ["employeeBusinessSettings", employeeSession?.ownerUserId],
    queryFn: async () => {
      if (!employeeSession?.ownerUserId) return null;

      const { data, error } = await supabase
        .from("business_settings")
        .select("show_service_values_to_employees")
        .eq("user_id", employeeSession.ownerUserId)
        .maybeSingle();

      if (error) throw error;
      return data as BusinessSettingsData | null;
    },
    enabled: !!employeeSession?.ownerUserId,
  });

  const showValues = businessSettings?.show_service_values_to_employees ?? false;

  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ["employeeAppointments", employeeSession?.ownerUserId, selectedDate],
    queryFn: async () => {
      if (!employeeSession?.ownerUserId) return [];

      const startDate = format(startOfDay(selectedDate), "yyyy-MM-dd");
      const endDate = format(endOfDay(selectedDate), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          status,
          notes,
          check_in_at,
          check_out_at,
          price,
          employee_commission,
          clients(name),
          vehicles(plate, model, brand),
          services(name, duration_minutes, price)
        `)
        .eq("user_id", employeeSession.ownerUserId)
        .gte("scheduled_date", startDate)
        .lte("scheduled_date", endDate)
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      return data as AppointmentData[];
    },
    enabled: !!employeeSession?.ownerUserId,
    refetchInterval: 30000, // Auto refresh every 30s
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, checkIn, checkOut }: { 
      id: string; 
      status: string; 
      checkIn?: boolean; 
      checkOut?: boolean;
    }) => {
      const updates: Record<string, unknown> = { status };
      if (checkIn) updates.check_in_at = new Date().toISOString();
      if (checkOut) updates.check_out_at = new Date().toISOString();

      const { error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeAppointments"] });
      toast.success("Status atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCheckIn = (appointment: AppointmentData) => {
    updateStatus.mutate({ 
      id: appointment.id, 
      status: "in_progress", 
      checkIn: true 
    });
  };

  const handleCheckOut = (appointment: AppointmentData) => {
    updateStatus.mutate({ 
      id: appointment.id, 
      status: "completed", 
      checkOut: true 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      scheduled: { label: "Agendado", className: "bg-blue-500/10 text-blue-500" },
      in_progress: { label: "Em Andamento", className: "bg-yellow-500/10 text-yellow-500" },
      completed: { label: "Concluído", className: "bg-green-500/10 text-green-500" },
      cancelled: { label: "Cancelado", className: "bg-red-500/10 text-red-500" },
      no_show: { label: "Não Compareceu", className: "bg-gray-500/10 text-gray-500" },
    };
    const config = statusConfig[status] || statusConfig.scheduled;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const scheduledCount = appointments.filter(a => a.status === "scheduled").length;
  const inProgressCount = appointments.filter(a => a.status === "in_progress").length;
  const completedCount = appointments.filter(a => a.status === "completed").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-auto" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {employeeSession?.employeeName || "Funcionário"}
              </p>
              <p className="text-xs text-muted-foreground">Área do Funcionário</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Date selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{getDateLabel(selectedDate)}</h1>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedDate(new Date())}
              disabled={isToday(selectedDate)}
            >
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick date navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[...Array(7)].map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
            return (
              <Button
                key={i}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="flex-shrink-0"
                onClick={() => setSelectedDate(date)}
              >
                <Calendar className="w-3 h-3 mr-1" />
                {format(date, "dd/MM")}
              </Button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{scheduledCount}</p>
            <p className="text-xs text-muted-foreground">Agendados</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-yellow-500">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground">Em Andamento</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </div>
        </div>

        {/* Appointments list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum agendamento
            </h3>
            <p className="text-muted-foreground">
              Não há serviços agendados para esta data
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className={cn(
                  "bg-card rounded-xl border border-border p-4",
                  appointment.status === "completed" && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-bold text-lg text-foreground">
                        {appointment.scheduled_time.slice(0, 5)}
                      </span>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {appointment.services?.name || "Serviço não especificado"}
                    </p>
                  </div>
                  {/* Show price only if admin enabled it */}
                  {showValues && appointment.price && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        R$ {appointment.price.toFixed(2)}
                      </p>
                      {appointment.employee_commission && (
                        <p className="text-xs text-muted-foreground">
                          Comissão: R$ {appointment.employee_commission.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    {appointment.clients?.name || "Cliente não identificado"}
                  </div>
                  {appointment.vehicles && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Car className="w-4 h-4" />
                      {appointment.vehicles.brand} {appointment.vehicles.model} - {appointment.vehicles.plate}
                    </div>
                  )}
                  {showValues && appointment.services?.price && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      Valor do serviço: R$ {appointment.services.price.toFixed(2)}
                    </div>
                  )}
                  {appointment.notes && (
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                      {appointment.notes}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {appointment.status === "scheduled" && (
                    <Button
                      variant="hero"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCheckIn(appointment)}
                      disabled={updateStatus.isPending}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Iniciar Serviço
                    </Button>
                  )}
                  {appointment.status === "in_progress" && (
                    <Button
                      variant="hero"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCheckOut(appointment)}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Concluir Serviço
                    </Button>
                  )}
                  {appointment.status === "completed" && appointment.check_out_at && (
                    <div className="flex items-center gap-1 text-sm text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      Concluído às {format(new Date(appointment.check_out_at), "HH:mm")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardFuncionario;
