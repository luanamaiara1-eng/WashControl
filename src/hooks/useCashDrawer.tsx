import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { formatDateToLocal } from "@/lib/utils";

export interface CashDrawer {
  id: string;
  user_id: string;
  drawer_date: string;
  opening_balance: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useCashDrawer = (date: Date) => {
  const { user } = useAuth();
  const dateStr = formatDateToLocal(date);

  return useQuery({
    queryKey: ["cash-drawer", user?.id, dateStr],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("cash_drawer")
        .select("*")
        .eq("user_id", user.id)
        .eq("drawer_date", dateStr)
        .maybeSingle();

      if (error) throw error;
      return data as CashDrawer | null;
    },
    enabled: !!user,
  });
};

export const useUpsertCashDrawer = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { drawer_date: string; opening_balance: number; notes?: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("cash_drawer")
        .upsert(
          {
            user_id: user.id,
            drawer_date: data.drawer_date,
            opening_balance: data.opening_balance,
            notes: data.notes || null,
          },
          { onConflict: "user_id,drawer_date" }
        )
        .select()
        .single();

      if (error) throw error;
      return result as CashDrawer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-drawer"] });
      toast.success("Caixa inicial salvo com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar caixa inicial: " + error.message);
    },
  });
};
