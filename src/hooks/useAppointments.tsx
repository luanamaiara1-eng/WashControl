import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Appointment, AppointmentStatus, PaymentMethod } from "@/types/database";
import { toast } from "sonner";
import { format } from "date-fns";

// Helper to get local date string (yyyy-MM-dd) without UTC conversion
const getLocalDateString = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

export const useAppointments = (date?: Date) => {
  const { user } = useAuth();
  const dateStr = date ? getLocalDateString(date) : undefined;

  return useQuery({
    queryKey: ["appointments", dateStr, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("appointments")
        .select(`
          *,
          clients(*),
          vehicles(*),
          services(*),
          employees(*)
        `)
        .eq("user_id", user.id)
        .order("scheduled_time", { ascending: true });

      if (dateStr) {
        query = query.eq("scheduled_date", dateStr);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};

export const useAppointmentsByRange = (startDate: Date, endDate: Date) => {
  const { user } = useAuth();
  const startDateStr = getLocalDateString(startDate);
  const endDateStr = getLocalDateString(endDate);

  return useQuery({
    queryKey: ["appointments-range", startDateStr, endDateStr, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          clients(*),
          vehicles(*),
          services(*),
          employees(*)
        `)
        .eq("user_id", user.id)
        .gte("scheduled_date", startDateStr)
        .lte("scheduled_date", endDateStr)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user,
  });
};

interface CreateAppointmentData {
  client_id?: string;
  vehicle_id?: string;
  service_id?: string;
  employee_id?: string;
  scheduled_date: string;
  scheduled_time: string;
  status?: AppointmentStatus;
  price?: number;
  payment_method?: PaymentMethod;
  notes?: string;
}

export const useCreateAppointment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      if (!user) throw new Error("Usuário não autenticado");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        ...data,
        user_id: user.id,
      };

      const { data: result, error } = await supabase
        .from("appointments")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar agendamento: " + error.message);
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Appointment> & { id: string }) => {
      // Remove joined data from update payload
      const { clients, vehicles, services, employees, ...updateData } = data;
      
      const { data: result, error } = await supabase
        .from("appointments")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(updateData as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar agendamento: " + error.message);
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover agendamento: " + error.message);
    },
  });
};

// Hook to subscribe to real-time appointment changes
export const useAppointmentsRealtime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime subscription for appointments");

    const channel = supabase
      .channel('appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Realtime appointment change:', payload);
          // Invalidate all appointment queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          queryClient.invalidateQueries({ queryKey: ["appointments-range"] });
          
          // Show toast notification based on event type
          if (payload.eventType === 'INSERT') {
            toast.info("Novo agendamento recebido!");
          } else if (payload.eventType === 'UPDATE') {
            toast.info("Agendamento atualizado!");
          } else if (payload.eventType === 'DELETE') {
            toast.info("Agendamento removido!");
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
};
