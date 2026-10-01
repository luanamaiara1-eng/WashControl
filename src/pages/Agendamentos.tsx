import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppointmentCalendar from "@/components/appointments/AppointmentCalendar";
import AppointmentList from "@/components/appointments/AppointmentList";
import NewAppointmentForm from "@/components/appointments/NewAppointmentForm";
import { useAppointmentsByRange } from "@/hooks/useAppointments";

const AgendamentosPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewForm, setShowNewForm] = useState(false);

  // Get appointments for the current month
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  
  const { data: appointments = [], isLoading } = useAppointmentsByRange(monthStart, monthEnd);

  // Filter appointments for the selected date
  const selectedDateAppointments = useMemo(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return appointments.filter((apt) => apt.scheduled_date === dateStr);
  }, [appointments, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os agendamentos do seu lava-rápido
          </p>
        </div>
        <Button variant="hero" onClick={() => setShowNewForm(true)}>
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <AppointmentCalendar
            appointments={appointments}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-2">
          <AppointmentList
            appointments={selectedDateAppointments}
            selectedDate={selectedDate}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* New Appointment Form */}
      <NewAppointmentForm
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default AgendamentosPage;
