import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Vehicle } from "@/types/database";
import { toast } from "sonner";

export const useVehicles = (clientId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["vehicles", user?.id, clientId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("vehicles")
        .select("*, clients!inner(name)")
        .eq("user_id", user.id)
        .order("brand", { ascending: true });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (Vehicle & { clients: { name: string } })[];
    },
    enabled: !!user,
  });
};

export const useVehicleWithHistory = (vehicleId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["vehicle-history", vehicleId],
    queryFn: async () => {
      if (!user || !vehicleId) return null;

      const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .select("*, clients(*)")
        .eq("id", vehicleId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (vehicleError) throw vehicleError;

      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          *,
          services (*),
          employees (*)
        `)
        .eq("vehicle_id", vehicleId)
        .eq("user_id", user.id)
        .order("scheduled_date", { ascending: false });

      if (appointmentsError) throw appointmentsError;

      return {
        vehicle,
        appointments: appointments || [],
        totalSpent: appointments?.filter(a => a.status === 'completed').reduce((acc, a) => acc + (Number(a.price) || 0), 0) || 0,
        totalServices: appointments?.filter(a => a.status === 'completed').length || 0,
      };
    },
    enabled: !!user && !!vehicleId,
  });
};

interface CreateVehicleData {
  client_id: string;
  brand: string;
  model: string;
  plate: string;
  color?: string;
  year?: number;
}

export const useCreateVehicle = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVehicleData) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("vehicles")
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result as Vehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Veículo criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar veículo: " + error.message);
    },
  });
};

export const useUpdateVehicle = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Vehicle> & { id: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("vehicles")
        .update(data)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return result as Vehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Veículo atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar veículo: " + error.message);
    },
  });
};

export const useDeleteVehicle = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Veículo excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir veículo: " + error.message);
    },
  });
};
