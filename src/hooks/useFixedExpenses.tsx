import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface FixedExpense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  category: string | null;
  description: string | null;
  is_active: boolean;
  reminder_days_before: number | null;
  created_at: string;
  updated_at: string;
}

export const useFixedExpenses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["fixed_expenses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("fixed_expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("due_day", { ascending: true });

      if (error) throw error;
      return data as FixedExpense[];
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30,
  });
};

export const useCreateFixedExpense = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (expense: Omit<FixedExpense, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("fixed_expenses")
        .insert({
          ...expense,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed_expenses"] });
      toast.success("Gasto fixo adicionado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar gasto fixo: " + error.message);
    },
  });
};

export const useUpdateFixedExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...expense }: Partial<FixedExpense> & { id: string }) => {
      const { data, error } = await supabase
        .from("fixed_expenses")
        .update(expense)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed_expenses"] });
      toast.success("Gasto fixo atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar gasto fixo: " + error.message);
    },
  });
};

export const useDeleteFixedExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("fixed_expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed_expenses"] });
      toast.success("Gasto fixo removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover gasto fixo: " + error.message);
    },
  });
};

// Get expenses that are due soon (for reminders)
export const useUpcomingExpenses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["upcoming_expenses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("fixed_expenses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;

      const today = new Date();
      const currentDay = today.getDate();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

      // Filter expenses that are upcoming (within reminder days)
      const upcomingExpenses = (data as FixedExpense[]).filter((expense) => {
        const reminderDays = expense.reminder_days_before || 3;
        const dueDay = expense.due_day > daysInMonth ? daysInMonth : expense.due_day;
        
        // Calculate days until due
        let daysUntilDue = dueDay - currentDay;
        if (daysUntilDue < 0) {
          // Already passed this month, calculate for next month
          daysUntilDue = daysInMonth - currentDay + dueDay;
        }

        return daysUntilDue <= reminderDays && daysUntilDue >= 0;
      });

      return upcomingExpenses;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
};
