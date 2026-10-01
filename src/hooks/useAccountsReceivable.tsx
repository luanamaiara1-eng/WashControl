import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDateToLocal } from "@/lib/utils";

export interface AccountReceivable {
  id: string;
  user_id: string;
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

export const useAccountsReceivable = (showReceived: boolean = false) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["accounts_receivable", user?.id, showReceived],
    queryFn: async () => {
      let query = supabase
        .from("accounts_receivable")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (!showReceived) {
        query = query.eq("is_received", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AccountReceivable[];
    },
    enabled: !!user,
  });
};

export interface CreateReceivableData {
  client_name: string;
  amount: number;
  description?: string;
  due_date?: string;
}

export const useCreateReceivable = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateReceivableData) => {
      const { error } = await supabase.from("accounts_receivable").insert({
        user_id: user!.id,
        client_name: data.client_name,
        amount: data.amount,
        description: data.description || null,
        due_date: data.due_date || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts_receivable"] });
      toast.success("Conta a receber cadastrada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao cadastrar conta a receber");
    },
  });
};

export const useMarkAsReceived = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      payment_method,
    }: {
      id: string;
      payment_method: string;
    }) => {
      // Get the receivable data first
      const { data: receivable, error: fetchError } = await supabase
        .from("accounts_receivable")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Mark as received
      const { error: updateError } = await supabase
        .from("accounts_receivable")
        .update({
          is_received: true,
          received_at: new Date().toISOString(),
          payment_method,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Create income transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user!.id,
          type: "income",
          amount: receivable.amount,
          description: `Recebimento: ${receivable.client_name}`,
          category: "Serviços",
          payment_method,
          transaction_date: formatDateToLocal(new Date()),
          notes: receivable.description || undefined,
        });

      if (transactionError) throw transactionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts_receivable"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["daily_revenue"] });
      toast.success("Recebimento registrado e lançado no financeiro!");
    },
    onError: () => {
      toast.error("Erro ao registrar recebimento");
    },
  });
};

export const useDeleteReceivable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("accounts_receivable")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts_receivable"] });
      toast.success("Conta a receber excluída com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir conta a receber");
    },
  });
};
