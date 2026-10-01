import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { formatDateToLocal } from "@/lib/utils";

export interface ClientDebt {
  id: string;
  user_id: string;
  client_id: string | null;
  client_name: string;
  amount: number;
  description: string | null;
  due_date: string | null;
  is_received: boolean;
  received_at: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

export const useClientDebts = (clientId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-debts", clientId, user?.id],
    queryFn: async () => {
      if (!user || !clientId) return [];

      const { data, error } = await supabase
        .from("accounts_receivable")
        .select("*")
        .eq("user_id", user.id)
        .eq("client_id", clientId)
        .eq("is_received", false)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as ClientDebt[];
    },
    enabled: !!user && !!clientId,
  });
};

export const useClientDebtHistory = (clientId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-debt-history", clientId, user?.id],
    queryFn: async () => {
      if (!user || !clientId) return [];

      const { data, error } = await supabase
        .from("accounts_receivable")
        .select("*")
        .eq("user_id", user.id)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ClientDebt[];
    },
    enabled: !!user && !!clientId,
  });
};

interface CreateClientDebtData {
  client_id: string;
  client_name: string;
  amount: number;
  description?: string;
  due_date?: string;
}

export const useCreateClientDebt = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClientDebtData) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("accounts_receivable")
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result as unknown as ClientDebt;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client-debts", variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ["client-debt-history", variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ["accounts_receivable"] });
      toast.success("Fiado registrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar fiado: " + error.message);
    },
  });
};

export const useMarkClientDebtAsReceived = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId, paymentMethod, amount, description }: { 
      id: string; 
      clientId: string;
      paymentMethod: string;
      amount: number;
      description: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Mark as received
      const { error: updateError } = await supabase
        .from("accounts_receivable")
        .update({
          is_received: true,
          received_at: new Date().toISOString(),
          payment_method: paymentMethod,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Create income transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "income",
          category: "Recebimento Fiado",
          description: description || "Pagamento de fiado",
          amount: amount,
          transaction_date: formatDateToLocal(new Date()),
          payment_method: paymentMethod,
        });

      if (transactionError) throw transactionError;

      return { clientId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["client-debts", result.clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-debt-history", result.clientId] });
      queryClient.invalidateQueries({ queryKey: ["accounts_receivable"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["daily_revenue"] });
      toast.success("Pagamento registrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar pagamento: " + error.message);
    },
  });
};

export const useDeleteClientDebt = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("accounts_receivable")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return { clientId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["client-debts", result.clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-debt-history", result.clientId] });
      queryClient.invalidateQueries({ queryKey: ["accounts_receivable"] });
      toast.success("Fiado excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir fiado: " + error.message);
    },
  });
};

export const useTotalClientDebt = (clientId?: string) => {
  const { data: debts } = useClientDebts(clientId);
  
  return debts?.reduce((sum, debt) => sum + Number(debt.amount), 0) || 0;
};
