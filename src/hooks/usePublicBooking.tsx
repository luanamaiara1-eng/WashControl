import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PublicBusinessSettings {
  id: string;
  user_id: string;
  business_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  working_hours: {
    [key: string]: { open: string; close: string; enabled: boolean };
  } | null;
  default_appointment_duration: number;
  min_advance_hours: number;
  max_advance_days: number;
  allow_client_cancellation: boolean;
  cancellation_limit_hours: number;
  max_simultaneous_vehicles: number;
  service_interval_minutes: number;
  primary_color: string | null;
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
}

export interface CreatePublicAppointmentData {
  user_id: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  vehicle_type: string;
  vehicle_model: string;
  vehicle_plate?: string;
  vehicle_notes?: string;
  service_id: string;
  scheduled_date: string;
  scheduled_time: string;
}

// Fetch business settings by slug (public access)
export const usePublicBusinessBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["public-business", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_settings")
        .select("user_id, business_name, logo_url, working_hours, default_appointment_duration, min_advance_hours, max_advance_days, allow_client_cancellation, cancellation_limit_hours, max_simultaneous_vehicles, service_interval_minutes, primary_color, public_booking_slug, public_booking_enabled")
        .eq("public_booking_slug", slug)
        .eq("public_booking_enabled", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Estabelecimento não encontrado");

      return data as unknown as PublicBusinessSettings;
    },
    enabled: !!slug,
  });
};

// Fetch services for a business (public access)
export const usePublicServices = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["public-services", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, price, duration_minutes")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      // PostgREST pode retornar numeric como string; normalizamos para evitar erros (ex: toFixed).
      return (data || []).map((s: any) => ({
        ...s,
        price: Number(s.price ?? 0),
      })) as PublicService[];
    },
    enabled: !!userId,
  });
};

// Fetch booked slots for availability check
export const usePublicBookedSlots = (
  userId: string | undefined,
  date: string | undefined
) => {
  return useQuery({
    queryKey: ["public-booked-slots", userId, date],
    queryFn: async () => {
      if (!userId || !date) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("scheduled_time, service_id, services(duration_minutes)")
        .eq("user_id", userId)
        .eq("scheduled_date", date)
        .in("status", ["scheduled", "in_progress"]);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && !!date,
  });
};

// Helper to normalize phone (remove non-digits)
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Helper to log audit events
async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string | undefined,
  details: Record<string, unknown>
) {
  try {
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details as any,
      source: "public",
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}

// Create public appointment
export const useCreatePublicAppointment = () => {
  return useMutation({
    mutationFn: async (data: CreatePublicAppointmentData) => {
      const normalizedPhone = normalizePhone(data.client_phone);

      // 1. Check or create client (always lookup by normalized phone)
      let clientId: string;
      let clientCreated = false;

      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", data.user_id)
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            user_id: data.user_id,
            name: data.client_name,
            phone: normalizedPhone,
            email: data.client_email || null,
            notes: "Cliente cadastrado via agendamento público",
          })
          .select("id")
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
        clientCreated = true;

        // Log client creation
        await logAudit(data.user_id, "create", "client", clientId, {
          name: data.client_name,
          phone: normalizedPhone,
          email: data.client_email || null,
        });
      }

      // 2. Create or find vehicle
      let vehicleId: string;

      const vehiclePlate = data.vehicle_plate?.toUpperCase().trim();

      if (vehiclePlate) {
        const { data: existingVehicleId } = await supabase.rpc("find_vehicle_by_plate", {
          p_user_id: data.user_id,
          p_plate: vehiclePlate,
        });

        if (existingVehicleId) {
          vehicleId = existingVehicleId;
        } else {
          const { data: newVehicle, error: vehicleError } = await supabase
            .from("vehicles")
            .insert({
              user_id: data.user_id,
              client_id: clientId,
              brand: data.vehicle_type,
              model: data.vehicle_model,
              plate: vehiclePlate || `SEM-PLACA-${Date.now()}`,
              color: null,
            })
            .select("id")
            .single();

          if (vehicleError) throw vehicleError;
          vehicleId = newVehicle.id;

          // Log vehicle creation
          await logAudit(data.user_id, "create", "vehicle", vehicleId, {
            brand: data.vehicle_type,
            model: data.vehicle_model,
            plate: vehiclePlate,
            client_id: clientId,
          });
        }
      } else {
        // Create vehicle without plate
        const tempPlate = `TEMP-${Date.now()}`;
        const { data: newVehicle, error: vehicleError } = await supabase
          .from("vehicles")
          .insert({
            user_id: data.user_id,
            client_id: clientId,
            brand: data.vehicle_type,
            model: data.vehicle_model,
            plate: tempPlate,
            color: null,
          })
          .select("id")
          .single();

        if (vehicleError) throw vehicleError;
        vehicleId = newVehicle.id;

        // Log vehicle creation
        await logAudit(data.user_id, "create", "vehicle", vehicleId, {
          brand: data.vehicle_type,
          model: data.vehicle_model,
          plate: tempPlate,
          client_id: clientId,
        });
      }

      // 3. Get service price
      const { data: service } = await supabase
        .from("services")
        .select("price")
        .eq("id", data.service_id)
        .single();

      const servicePrice = Number((service as any)?.price ?? 0);

      // 4. Generate cancel token
      const cancelToken = generateCancelToken();

      // 5. Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          user_id: data.user_id,
          client_id: clientId,
          vehicle_id: vehicleId,
          service_id: data.service_id,
          scheduled_date: data.scheduled_date,
          scheduled_time: data.scheduled_time,
          status: "scheduled",
          price: servicePrice,
          notes: data.vehicle_notes || null,
          source: "public",
          cancel_token: cancelToken,
        })
        .select("id, cancel_token")
        .single();

      if (appointmentError) throw appointmentError;

      // Log appointment creation
      await logAudit(data.user_id, "create", "appointment", appointment.id, {
        client_id: clientId,
        client_created: clientCreated,
        vehicle_id: vehicleId,
        service_id: data.service_id,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time,
        price: servicePrice,
      });

      return appointment;
    },
    onError: (error: any) => {
      console.error("Error creating appointment:", error);
      toast.error("Erro ao criar agendamento: " + error.message);
    },
  });
};

// Cancel appointment by token (uses secure RPC)
export const useCancelAppointmentByToken = () => {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc("cancel_appointment_by_token", {
        p_cancel_token: token,
      });

      if (error) throw error;
      const result = data as any;
      if (!result?.success) {
        throw new Error(result?.error || "Erro ao cancelar agendamento");
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success("Agendamento cancelado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

// Fetch appointment by cancel token (uses secure RPC)
export const useAppointmentByToken = (token: string) => {
  return useQuery({
    queryKey: ["appointment-by-token", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_appointment_by_token", {
        p_cancel_token: token,
      });

      if (error) throw error;
      const result = data as any;
      if (!result || result?.success === false) {
        throw new Error(result?.error || "Agendamento não encontrado");
      }

      // Map RPC result to match expected shape
      return {
        ...result,
        services: result.service,
        clients: result.client,
      };
    },
    enabled: !!token,
  });
};

// Helper function to generate cancel token
function generateCancelToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate available time slots
export function generateTimeSlots(
  workingHours: { open: string; close: string; enabled: boolean } | undefined,
  bookedSlots: { scheduled_time: string; services: { duration_minutes: number } | null }[],
  serviceDuration: number,
  intervalMinutes: number = 15
): string[] {
  if (!workingHours || !workingHours.enabled) return [];

  const slots: string[] = [];
  const [openHour, openMin] = workingHours.open.split(":").map(Number);
  const [closeHour, closeMin] = workingHours.close.split(":").map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  // Create a set of blocked time ranges
  const blockedRanges: { start: number; end: number }[] = bookedSlots.map((slot) => {
    const [hour, min] = slot.scheduled_time.split(":").map(Number);
    const startTime = hour * 60 + min;
    const duration = slot.services?.duration_minutes || 60;
    return { start: startTime, end: startTime + duration };
  });

  for (let time = openTime; time + serviceDuration <= closeTime; time += intervalMinutes) {
    const slotEnd = time + serviceDuration;

    // Check if this slot overlaps with any booked slot
    const isBlocked = blockedRanges.some(
      (range) => !(slotEnd <= range.start || time >= range.end)
    );

    if (!isBlocked) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      slots.push(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
    }
  }

  return slots;
}
