import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { formatDateToLocal } from "@/lib/utils";

export interface ClientPackage {
  id: string;
  user_id: string;
  client_id: string;
  service_id: string | null;
  package_name: string;
  total_credits: number;
  used_credits: number;
  price_paid: number;
  purchased_at: string;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  services?: {
    id: string;
    name: string;
  } | null;
}

export interface PackageUsage {
  id: string;
  package_id: string;
  appointment_id: string | null;
  used_at: string;
  notes: string | null;
}

export const useClientPackages = (clientId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-packages", clientId, user?.id],
    queryFn: async () => {
      if (!user || !clientId) return [];

      const { data, error } = await supabase
        .from("client_packages" as any)
        .select(`
          *,
          services:service_id (id, name)
        `)
        .eq("user_id", user.id)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ClientPackage[];
    },
    enabled: !!user && !!clientId,
  });
};

export const useActiveClientPackages = (clientId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["active-client-packages", clientId, user?.id],
    queryFn: async () => {
      if (!user || !clientId) return [];

      const today = formatDateToLocal(new Date());

      const { data, error } = await supabase
        .from("client_packages" as any)
        .select(`
          *,
          services:service_id (id, name)
        `)
        .eq("user_id", user.id)
        .eq("client_id", clientId)
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gte.${today}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Filter packages with remaining credits
      const packages = (data || []) as unknown as ClientPackage[];
      return packages.filter(pkg => pkg.used_credits < pkg.total_credits);
    },
    enabled: !!user && !!clientId,
  });
};

interface CreatePackageData {
  client_id: string;
  service_id?: string | null;
  package_name: string;
  total_credits: number;
  price_paid: number;
  expires_at?: string | null;
  notes?: string | null;
}

export const useCreateClientPackage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePackageData) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Create the package
      const { data: packageResult, error: packageError } = await supabase
        .from("client_packages" as any)
        .insert({
          ...data,
          user_id: user.id,
        } as any)
        .select()
        .single();

      if (packageError) throw packageError;

      // Create income transaction for the package sale
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "income",
          category: "Venda de Pacote",
          description: `Pacote: ${data.package_name}`,
          amount: data.price_paid,
          transaction_date: formatDateToLocal(new Date()),
          payment_method: "cash",
        });

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
      }

      return packageResult as unknown as ClientPackage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client-packages", variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ["active-client-packages", variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      toast.success("Pacote criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar pacote: " + error.message);
    },
  });
};

export const useUsePackageCredit = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId, appointmentId, notes }: { packageId: string; appointmentId?: string; notes?: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Get current package
      const { data: pkg, error: pkgError } = await supabase
        .from("client_packages" as any)
        .select("*")
        .eq("id", packageId)
        .single();

      if (pkgError) throw pkgError;
      if (!pkg) throw new Error("Pacote não encontrado");

      const packageData = pkg as unknown as ClientPackage;

      if (packageData.used_credits >= packageData.total_credits) {
        throw new Error("Pacote sem créditos disponíveis");
      }

      // Update package credits
      const { error: updateError } = await supabase
        .from("client_packages" as any)
        .update({ used_credits: packageData.used_credits + 1 } as any)
        .eq("id", packageId);

      if (updateError) throw updateError;

      // Record usage
      const { error: usageError } = await supabase
        .from("package_usage" as any)
        .insert({
          package_id: packageId,
          appointment_id: appointmentId || null,
          notes: notes || null,
        } as any);

      if (usageError) throw usageError;

      return { ...packageData, used_credits: packageData.used_credits + 1 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["client-packages", result.client_id] });
      queryClient.invalidateQueries({ queryKey: ["active-client-packages", result.client_id] });
      toast.success("Crédito do pacote utilizado!");
    },
    onError: (error) => {
      toast.error("Erro ao usar crédito: " + error.message);
    },
  });
};

export const useUpdateClientPackage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId, ...data }: Partial<ClientPackage> & { id: string; clientId: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("client_packages" as any)
        .update(data as any)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return { ...(result as unknown as ClientPackage), clientId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["client-packages", result.clientId] });
      queryClient.invalidateQueries({ queryKey: ["active-client-packages", result.clientId] });
      toast.success("Pacote atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar pacote: " + error.message);
    },
  });
};

export const useDeleteClientPackage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("client_packages" as any)
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return { clientId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["client-packages", result.clientId] });
      queryClient.invalidateQueries({ queryKey: ["active-client-packages", result.clientId] });
      toast.success("Pacote excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir pacote: " + error.message);
    },
  });
};

export const usePackageUsageHistory = (packageId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["package-usage", packageId],
    queryFn: async () => {
      if (!user || !packageId) return [];

      const { data, error } = await supabase
        .from("package_usage" as any)
        .select("*")
        .eq("package_id", packageId)
        .order("used_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as PackageUsage[];
    },
    enabled: !!user && !!packageId,
  });
};
