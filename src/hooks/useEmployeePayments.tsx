import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCreateTransaction } from "./useFinanceiro";
import { toast } from "sonner";
import { format } from "date-fns";

export interface EmployeeEarning {
  id: string;
  user_id: string;
  employee_id: string;
  earning_date: string;
  type: "daily" | "commission" | "bonus" | "extra";
  description: string | null;
  amount: number;
  status: "pending" | "paid";
  created_at: string;
  updated_at: string;
}

export interface EmployeePayment {
  id: string;
  user_id: string;
  employee_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAdvance {
  id: string;
  user_id: string;
  employee_id: string;
  amount: number;
  advance_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSummary {
  employee_id: string;
  employee_name: string;
  total_earnings: number;
  total_payments: number;
  total_advances: number;
  pending_balance: number;
}

// ---- Earnings ----
export const useEmployeeEarnings = (employeeId?: string, startDate?: string, endDate?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["employee-earnings", user?.id, employeeId, startDate, endDate],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("employee_earnings")
        .select("*")
        .eq("user_id", user.id)
        .order("earning_date", { ascending: false });
      if (employeeId) query = query.eq("employee_id", employeeId);
      if (startDate) query = query.gte("earning_date", startDate);
      if (endDate) query = query.lte("earning_date", endDate);
      const { data, error } = await query;
      if (error) throw error;
      return data as EmployeeEarning[];
    },
    enabled: !!user,
  });
};

export const useCreateEarning = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { employee_id: string; earning_date: string; type: string; description?: string; amount: number }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("employee_earnings").insert({ ...data, user_id: user.id, status: "pending" } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-earnings"] });
      qc.invalidateQueries({ queryKey: ["employee-payment-summaries"] });
      toast.success("Ganho registrado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
};

export const useDeleteEarning = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("employee_earnings").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-earnings"] });
      qc.invalidateQueries({ queryKey: ["employee-payment-summaries"] });
      toast.success("Ganho removido!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
};

// ---- Advances ----
export const useEmployeeAdvances = (employeeId?: string, startDate?: string, endDate?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["employee-advances", user?.id, employeeId, startDate, endDate],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("employee_advances")
        .select("*")
        .eq("user_id", user.id)
        .order("advance_date", { ascending: false });
      if (employeeId) query = query.eq("employee_id", employeeId);
      if (startDate) query = query.gte("advance_date", startDate);
      if (endDate) query = query.lte("advance_date", endDate);
      const { data, error } = await query;
      if (error) throw error;
      return data as EmployeeAdvance[];
    },
    enabled: !!user,
  });
};

export const useCreateAdvance = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const createTransaction = useCreateTransaction();
  return useMutation({
    mutationFn: async (data: { employee_id: string; amount: number; advance_date: string; notes?: string; employee_name: string }) => {
      if (!user) throw new Error("Não autenticado");
      // Create advance record
      const { error } = await supabase.from("employee_advances").insert({
        user_id: user.id,
        employee_id: data.employee_id,
        amount: data.amount,
        advance_date: data.advance_date,
        notes: data.notes || null,
      } as any);
      if (error) throw error;
      // Create expense transaction immediately
      await createTransaction.mutateAsync({
        type: "expense",
        amount: data.amount,
        description: `Adiantamento - ${data.employee_name}`,
        category: "Adiantamento funcionário",
        payment_method: "cash",
        transaction_date: data.advance_date,
        employee_id: data.employee_id,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-advances"] });
      qc.invalidateQueries({ queryKey: ["employee-payment-summaries"] });
      toast.success("Vale registrado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
};

// ---- Payments ----
export const useEmployeePaymentRecords = (employeeId?: string, startDate?: string, endDate?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["employee-payment-records", user?.id, employeeId, startDate, endDate],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("employee_payments")
        .select("*")
        .eq("user_id", user.id)
        .order("payment_date", { ascending: false });
      if (employeeId) query = query.eq("employee_id", employeeId);
      if (startDate) query = query.gte("payment_date", startDate);
      if (endDate) query = query.lte("payment_date", endDate);
      const { data, error } = await query;
      if (error) throw error;
      return data as EmployeePayment[];
    },
    enabled: !!user,
  });
};

export const useCreatePayment = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const createTransaction = useCreateTransaction();
  return useMutation({
    mutationFn: async (data: { employee_id: string; amount: number; payment_method: string; payment_date: string; notes?: string; employee_name: string }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("employee_payments").insert({
        user_id: user.id,
        employee_id: data.employee_id,
        amount: data.amount,
        payment_method: data.payment_method,
        payment_date: data.payment_date,
        notes: data.notes || null,
      } as any);
      if (error) throw error;
      // Create expense transaction
      await createTransaction.mutateAsync({
        type: "expense",
        amount: data.amount,
        description: `Pagamento de salário/acumulado - ${data.employee_name}`,
        category: "Pagamento funcionário",
        payment_method: data.payment_method,
        transaction_date: data.payment_date,
        employee_id: data.employee_id,
      });
      // Mark pending earnings as paid
      await supabase
        .from("employee_earnings")
        .update({ status: "paid" } as any)
        .eq("employee_id", data.employee_id)
        .eq("user_id", user.id)
        .eq("status", "pending");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-payment-records"] });
      qc.invalidateQueries({ queryKey: ["employee-earnings"] });
      qc.invalidateQueries({ queryKey: ["employee-payment-summaries"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Pagamento realizado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
};

// ---- Summary ----
export const useEmployeePaymentSummaries = (startDate?: string, endDate?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["employee-payment-summaries", user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user) return [];

      // Fetch employees
      const { data: employees } = await supabase
        .from("employees")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (!employees?.length) return [];

      // Fetch all data in parallel
      let earningsQ = supabase.from("employee_earnings").select("employee_id, amount, status").eq("user_id", user.id);
      let paymentsQ = supabase.from("employee_payments").select("employee_id, amount").eq("user_id", user.id);
      let advancesQ = supabase.from("employee_advances").select("employee_id, amount").eq("user_id", user.id);

      if (startDate) {
        earningsQ = earningsQ.gte("earning_date", startDate);
        paymentsQ = paymentsQ.gte("payment_date", startDate);
        advancesQ = advancesQ.gte("advance_date", startDate);
      }
      if (endDate) {
        earningsQ = earningsQ.lte("earning_date", endDate);
        paymentsQ = paymentsQ.lte("payment_date", endDate);
        advancesQ = advancesQ.lte("advance_date", endDate);
      }

      const [{ data: earnings }, { data: payments }, { data: advances }] = await Promise.all([
        earningsQ,
        paymentsQ,
        advancesQ,
      ]);

      return employees.map((emp) => {
        const empEarnings = (earnings || []).filter((e: any) => e.employee_id === emp.id);
        const empPayments = (payments || []).filter((p: any) => p.employee_id === emp.id);
        const empAdvances = (advances || []).filter((a: any) => a.employee_id === emp.id);

        const total_earnings = empEarnings.reduce((s: number, e: any) => s + Number(e.amount), 0);
        const total_payments = empPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
        const total_advances = empAdvances.reduce((s: number, a: any) => s + Number(a.amount), 0);

        return {
          employee_id: emp.id,
          employee_name: emp.name,
          total_earnings,
          total_payments,
          total_advances,
          pending_balance: total_earnings - total_payments - total_advances,
        } as EmployeeSummary;
      });
    },
    enabled: !!user,
  });
};
