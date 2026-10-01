import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface CustomCategory {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCustomCategories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["custom-categories", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("custom_categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as CustomCategory[];
    },
    enabled: !!user,
  });
};

export const useCreateCategory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; type: "income" | "expense"; color?: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("custom_categories")
        .insert({
          user_id: user.id,
          name: data.name,
          type: data.type,
          color: data.color || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result as CustomCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-categories"] });
      toast.success("Categoria criada com sucesso!");
    },
    onError: (error) => {
      if (error.message.includes("duplicate")) {
        toast.error("Esta categoria já existe!");
      } else {
        toast.error("Erro ao criar categoria: " + error.message);
      }
    },
  });
};

export const useUpdateCategory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name?: string; color?: string; is_active?: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("custom_categories")
        .update({
          name: data.name,
          color: data.color,
          is_active: data.is_active,
        })
        .eq("id", data.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return result as CustomCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-categories"] });
      toast.success("Categoria atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar categoria: " + error.message);
    },
  });
};

export const useDeleteCategory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("custom_categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-categories"] });
      toast.success("Categoria excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir categoria: " + error.message);
    },
  });
};
