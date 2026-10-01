import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";
import { formatDateToLocal } from "@/lib/utils";

export interface Transaction {
  id: string;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string | null;
  payment_method: string | null;
  transaction_date: string;
  notes: string | null;
  employee_id: string | null;
  created_at: string;
  updated_at: string;
  employees?: {
    id: string;
    name: string;
  } | null;
}

export const useTransactions = (startDate?: Date, endDate?: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", user?.id, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("transactions")
        .select("*, employees(id, name)")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false });

      if (startDate) {
        query = query.gte("transaction_date", formatDateToLocal(startDate));
      }
      if (endDate) {
        query = query.lte("transaction_date", formatDateToLocal(endDate));
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });
};

interface CreateTransactionData {
  type: "income" | "expense";
  amount: number;
  description: string;
  category?: string;
  payment_method?: string;
  transaction_date: string;
  notes?: string;
  employee_id?: string;
}

export const useCreateTransaction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("transactions")
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result as Transaction;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      // Invalidate employee stats if transaction is related to an employee
      if (data.employee_id) {
        queryClient.invalidateQueries({ queryKey: ["employees-with-stats"] });
        queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      }
      toast.success("Transação criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar transação: " + error.message);
    },
  });
};

export const useUpdateTransaction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string } & Partial<CreateTransactionData>) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("transactions")
        .update({
          type: data.type,
          amount: data.amount,
          description: data.description,
          category: data.category,
          payment_method: data.payment_method,
          transaction_date: data.transaction_date,
          notes: data.notes,
          employee_id: data.employee_id || null,
        })
        .eq("id", data.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return result as Transaction;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      if (data.employee_id) {
        queryClient.invalidateQueries({ queryKey: ["employees-with-stats"] });
        queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      }
      toast.success("Transação atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar transação: " + error.message);
    },
  });
};

export const useDeleteTransaction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      // First get the transaction to check if it has an employee_id
      const { data: transaction } = await supabase
        .from("transactions")
        .select("employee_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return transaction;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      // Invalidate employee stats if transaction was related to an employee
      if (data?.employee_id) {
        queryClient.invalidateQueries({ queryKey: ["employees-with-stats"] });
        queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      }
      toast.success("Transação excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir transação: " + error.message);
    },
  });
};

export const useFinancialSummary = (month: Date) => {
  const { user } = useAuth();
  const start = startOfMonth(month);
  const end = endOfMonth(month);

  return useQuery({
    queryKey: ["financial-summary", user?.id, format(month, "yyyy-MM")],
    queryFn: async () => {
      if (!user) return null;

      // Get appointments (service revenue)
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("price, payment_method, scheduled_date, status")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("scheduled_date", formatDateToLocal(start))
        .lte("scheduled_date", formatDateToLocal(end));

      if (appointmentsError) throw appointmentsError;

      // Get manual transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("transaction_date", formatDateToLocal(start))
        .lte("transaction_date", formatDateToLocal(end));

      if (transactionsError) throw transactionsError;

      // Calculate service revenue
      const serviceRevenue = appointments?.reduce((acc, a) => acc + (Number(a.price) || 0), 0) || 0;

      // Calculate manual income/expenses
      const manualIncome = (transactions as Transaction[])
        ?.filter((t) => t.type === "income")
        .reduce((acc, t) => acc + Number(t.amount), 0) || 0;

      const manualExpense = (transactions as Transaction[])
        ?.filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + Number(t.amount), 0) || 0;

      // Payment method breakdown
      const paymentMethods: Record<string, number> = {};
      appointments?.forEach((a) => {
        const method = a.payment_method || "other";
        paymentMethods[method] = (paymentMethods[method] || 0) + (Number(a.price) || 0);
      });
      (transactions as Transaction[])?.filter((t) => t.type === "income").forEach((t) => {
        const method = t.payment_method || "other";
        paymentMethods[method] = (paymentMethods[method] || 0) + Number(t.amount);
      });

      // Daily breakdown
      const dailyData: Record<string, { income: number; expense: number }> = {};
      appointments?.forEach((a) => {
        const day = a.scheduled_date;
        if (!dailyData[day]) dailyData[day] = { income: 0, expense: 0 };
        dailyData[day].income += Number(a.price) || 0;
      });
      (transactions as Transaction[])?.forEach((t) => {
        const day = t.transaction_date;
        if (!dailyData[day]) dailyData[day] = { income: 0, expense: 0 };
        if (t.type === "income") {
          dailyData[day].income += Number(t.amount);
        } else {
          dailyData[day].expense += Number(t.amount);
        }
      });

      const totalIncome = serviceRevenue + manualIncome;
      const totalExpense = manualExpense;
      const balance = totalIncome - totalExpense;

      return {
        serviceRevenue,
        manualIncome,
        manualExpense,
        totalIncome,
        totalExpense,
        balance,
        paymentMethods,
        dailyData,
        servicesCount: appointments?.length || 0,
      };
    },
    enabled: !!user,
  });
};

export const useDailyRevenue = (date: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["daily-revenue", user?.id, format(date, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!user) return null;

      const dateStr = formatDateToLocal(date);

      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("price, payment_method, status")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .eq("scheduled_date", dateStr);

      if (appointmentsError) throw appointmentsError;

      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("transaction_date", dateStr);

      if (transactionsError) throw transactionsError;

      const serviceRevenue = appointments?.reduce((acc, a) => acc + (Number(a.price) || 0), 0) || 0;
      const manualIncome = (transactions as Transaction[])
        ?.filter((t) => t.type === "income")
        .reduce((acc, t) => acc + Number(t.amount), 0) || 0;
      const manualExpense = (transactions as Transaction[])
        ?.filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + Number(t.amount), 0) || 0;

      return {
        serviceRevenue,
        manualIncome,
        manualExpense,
        totalIncome: serviceRevenue + manualIncome,
        totalExpense: manualExpense,
        balance: serviceRevenue + manualIncome - manualExpense,
        servicesCount: appointments?.length || 0,
      };
    },
    enabled: !!user,
  });
};

export const useMonthlyComparison = () => {
  const { user } = useAuth();
  const currentMonth = new Date();
  const lastMonth = subMonths(currentMonth, 1);

  return useQuery({
    queryKey: ["monthly-comparison", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const getMonthData = async (month: Date) => {
        const start = formatDateToLocal(startOfMonth(month));
        const end = formatDateToLocal(endOfMonth(month));

        const { data: appointments } = await supabase
          .from("appointments")
          .select("price")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("scheduled_date", start)
          .lte("scheduled_date", end);

        const { data: transactions } = await supabase
          .from("transactions")
          .select("type, amount")
          .eq("user_id", user.id)
          .gte("transaction_date", start)
          .lte("transaction_date", end);

        const serviceRevenue = appointments?.reduce((acc, a) => acc + (Number(a.price) || 0), 0) || 0;
        const manualIncome = (transactions as { type: string; amount: number }[])
          ?.filter((t) => t.type === "income")
          .reduce((acc, t) => acc + Number(t.amount), 0) || 0;

        return serviceRevenue + manualIncome;
      };

      const [currentTotal, lastTotal] = await Promise.all([
        getMonthData(currentMonth),
        getMonthData(lastMonth),
      ]);

      const percentChange = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;

      return {
        currentMonth: currentTotal,
        lastMonth: lastTotal,
        percentChange,
      };
    },
    enabled: !!user,
  });
};

// Hook to subscribe to real-time transaction changes
export const useTransactionsRealtime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime subscription for transactions");

    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Realtime transaction change:', payload);
          // Invalidate all transaction and financial queries
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
          queryClient.invalidateQueries({ queryKey: ["daily-revenue"] });
          queryClient.invalidateQueries({ queryKey: ["monthly-comparison"] });
          
          // Show toast notification based on event type
          if (payload.eventType === 'INSERT') {
            toast.info("Nova transação registrada!");
          } else if (payload.eventType === 'UPDATE') {
            toast.info("Transação atualizada!");
          } else if (payload.eventType === 'DELETE') {
            toast.info("Transação removida!");
          }
        }
      )
      .subscribe((status) => {
        console.log('Transactions realtime subscription status:', status);
      });

    return () => {
      console.log("Cleaning up transactions realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
};