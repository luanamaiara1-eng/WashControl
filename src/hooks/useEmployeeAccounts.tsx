import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

interface EmployeeAccount {
  id: string;
  owner_user_id: string;
  employee_id: string | null;
  access_code: string;
  role: "proprietario" | "funcionario";
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useEmployeeAccounts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["employeeAccounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_accounts")
        .select("*")
        .eq("owner_user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EmployeeAccount[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateEmployeeAccount = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      // Generate unique access code
      const { data: codeData, error: codeError } = await supabase.rpc("generate_access_code");

      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from("employee_accounts")
        .insert({
          owner_user_id: user!.id,
          employee_id: employeeId,
          access_code: codeData,
          role: "funcionario",
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmployeeAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeAccounts"] });
      toast({
        title: "Sucesso",
        description: "Código de acesso criado com sucesso",
      });
    },
    onError: (error) => {
      console.error("Error creating employee account:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar código de acesso",
        variant: "destructive",
      });
    },
  });
};

export const useRegenerateAccessCode = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data: codeData, error: codeError } = await supabase.rpc("generate_access_code");

      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from("employee_accounts")
        .update({ access_code: codeData })
        .eq("id", accountId)
        .select()
        .single();

      if (error) throw error;
      return data as EmployeeAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeAccounts"] });
      toast({
        title: "Sucesso",
        description: "Código de acesso regenerado",
      });
    },
    onError: (error) => {
      console.error("Error regenerating access code:", error);
      toast({
        title: "Erro",
        description: "Erro ao regenerar código de acesso",
        variant: "destructive",
      });
    },
  });
};

export const useToggleEmployeeAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ accountId, isActive }: { accountId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("employee_accounts")
        .update({ is_active: isActive })
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["employeeAccounts"] });
      toast({
        title: "Sucesso",
        description: isActive ? "Acesso ativado" : "Acesso desativado",
      });
    },
    onError: (error) => {
      console.error("Error toggling account:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do acesso",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteEmployeeAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("employee_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeAccounts"] });
      toast({
        title: "Sucesso",
        description: "Código de acesso removido",
      });
    },
    onError: (error) => {
      console.error("Error deleting account:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover código de acesso",
        variant: "destructive",
      });
    },
  });
};
