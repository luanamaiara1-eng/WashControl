import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Service } from "@/types/database";
import { toast } from "sonner";

export const useServices = (includeInactive = false) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["services", user?.id, includeInactive],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("services")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!user,
  });
};

interface CreateServiceData {
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
}

export const useCreateService = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceData) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("services")
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result as Service;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar serviço: " + error.message);
    },
  });
};

interface UpdateServiceData {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  duration_minutes?: number;
  is_active?: boolean;
}

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateServiceData) => {
      const { data: result, error } = await supabase
        .from("services")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result as Service;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar serviço: " + error.message);
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover serviço: " + error.message);
    },
  });
};
