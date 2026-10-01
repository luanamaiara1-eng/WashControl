import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Client } from "@/types/database";
import { toast } from "sonner";

export const useClients = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["clients", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });
};

export const useClientWithHistory = (clientId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-history", clientId],
    queryFn: async () => {
      if (!user || !clientId) return null;

      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (clientError) throw clientError;

      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          *,
          vehicles (*),
          services (*),
          employees (*)
        `)
        .eq("client_id", clientId)
        .eq("user_id", user.id)
        .order("scheduled_date", { ascending: false });

      if (appointmentsError) throw appointmentsError;

      const { data: vehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("client_id", clientId)
        .eq("user_id", user.id);

      if (vehiclesError) throw vehiclesError;

      return {
        client,
        appointments: appointments || [],
        vehicles: vehicles || [],
        totalSpent: appointments?.filter(a => a.status === 'completed').reduce((acc, a) => acc + (Number(a.price) || 0), 0) || 0,
        totalServices: appointments?.filter(a => a.status === 'completed').length || 0,
      };
    },
    enabled: !!user && !!clientId,
  });
};

interface CreateClientData {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export const useCreateClient = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClientData) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("clients")
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar cliente: " + error.message);
    },
  });
};

export const useUpdateClient = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("clients")
        .update(data)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return result as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar cliente: " + error.message);
    },
  });
};

export const useDeleteClient = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir cliente: " + error.message);
    },
  });
};
