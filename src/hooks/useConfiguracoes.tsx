import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface WorkingHours {
  monday: { open: string; close: string; enabled: boolean };
  tuesday: { open: string; close: string; enabled: boolean };
  wednesday: { open: string; close: string; enabled: boolean };
  thursday: { open: string; close: string; enabled: boolean };
  friday: { open: string; close: string; enabled: boolean };
  saturday: { open: string; close: string; enabled: boolean };
  sunday: { open: string; close: string; enabled: boolean };
}

export interface BusinessSettings {
  id: string;
  user_id: string;
  business_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  logo_url: string | null;
  working_hours: WorkingHours;
  default_appointment_duration: number;
  allow_online_booking: boolean;
  send_reminders: boolean;
  reminder_hours_before: number;
  currency: string;
  timezone: string;
  show_employee_commission: boolean;
  show_service_values_to_employees: boolean;
  created_at: string;
  updated_at: string;
}

const defaultWorkingHours: WorkingHours = {
  monday: { open: "08:00", close: "18:00", enabled: true },
  tuesday: { open: "08:00", close: "18:00", enabled: true },
  wednesday: { open: "08:00", close: "18:00", enabled: true },
  thursday: { open: "08:00", close: "18:00", enabled: true },
  friday: { open: "08:00", close: "18:00", enabled: true },
  saturday: { open: "08:00", close: "12:00", enabled: true },
  sunday: { open: "", close: "", enabled: false },
};

export const useBusinessSettings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["business-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Return default settings if none exist
      if (!data) {
        return {
          id: "",
          user_id: user.id,
          business_name: "",
          phone: "",
          email: "",
          address: "",
          city: "",
          state: "",
          zip_code: "",
          logo_url: "",
          working_hours: defaultWorkingHours,
          default_appointment_duration: 60,
          allow_online_booking: false,
          send_reminders: true,
          reminder_hours_before: 24,
          currency: "BRL",
          timezone: "America/Sao_Paulo",
          show_employee_commission: true,
          show_service_values_to_employees: false,
          created_at: "",
          updated_at: "",
        } as BusinessSettings;
      }

      return {
        ...data,
        working_hours: data.working_hours as unknown as WorkingHours,
      } as BusinessSettings;
    },
    enabled: !!user,
  });
};

export const useSaveBusinessSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<BusinessSettings>) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Check if settings exist
      const { data: existing } = await supabase
        .from("business_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const settingsData = {
        business_name: settings.business_name,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        city: settings.city,
        state: settings.state,
        zip_code: settings.zip_code,
        logo_url: settings.logo_url,
        working_hours: settings.working_hours as unknown as Json,
        default_appointment_duration: settings.default_appointment_duration,
        allow_online_booking: settings.allow_online_booking,
        send_reminders: settings.send_reminders,
        reminder_hours_before: settings.reminder_hours_before,
        currency: settings.currency,
        timezone: settings.timezone,
        show_employee_commission: settings.show_employee_commission,
        show_service_values_to_employees: settings.show_service_values_to_employees,
      };

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from("business_settings")
          .update(settingsData)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from("business_settings")
          .insert({
            user_id: user.id,
            ...settingsData,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    },
  });
};