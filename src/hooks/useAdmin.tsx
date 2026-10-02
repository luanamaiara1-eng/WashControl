import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export type AppRole = 'admin' | 'user';
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'trial';

export interface Profile {
  id: string;
  email: string | null;
  business_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithDetails {
  id: string;
  email: string | null;
  business_name: string | null;
  is_active: boolean;
  created_at: string;
  role: AppRole;
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    expires_at: string | null;
  } | null;
}

export interface SaasPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean;
  max_whatsapp_central: number;
  max_users: number;
  max_employees: number;
  max_vehicles: number;
  features: Record<string, boolean>;
}

const db = supabase as any;

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
      return !!data;
    },
    enabled: !!user?.id,
  });
};

export const useAllUsers = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles").select("*").order("created_at", { ascending: false });
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase.from("user_roles").select("*");
      if (rolesError) throw rolesError;

      const { data: subscriptions, error: subscriptionsError } = await supabase.from("subscriptions").select("*");
      if (subscriptionsError) throw subscriptionsError;

      const usersWithDetails: UserWithDetails[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        const userSubscription = subscriptions?.find((s) => s.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          business_name: profile.business_name,
          is_active: profile.is_active,
          created_at: profile.created_at,
          role: (userRole?.role as AppRole) || "user",
          subscription: userSubscription ? {
            plan: userSubscription.plan as SubscriptionPlan,
            status: userSubscription.status as SubscriptionStatus,
            expires_at: userSubscription.expires_at,
          } : null,
        };
      });
      return usersWithDetails;
    },
    enabled: isAdmin === true,
  });
};

export const useUpdateUserSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, plan, status }: {
      userId: string;
      plan?: SubscriptionPlan;
      status?: SubscriptionStatus;
    }) => {
      const updates: Record<string, unknown> = {};
      if (plan) {
        updates.plan = plan;
        const { data: saasPlan, error: planError } = await db
          .from("saas_plans")
          .select("id")
          .eq("slug", plan)
          .maybeSingle();
        if (planError) throw planError;
        updates.plan_id = saasPlan?.id ?? null;
      }
      if (status) updates.status = status;
      const { error } = await supabase.from("subscriptions").update(updates).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast({ title: "Sucesso", description: "Assinatura atualizada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: "Erro ao atualizar assinatura", variant: "destructive" });
      console.error("Error updating subscription:", error);
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast({ title: "Sucesso", description: "Status do usuário atualizado" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: "Erro ao atualizar status do usuário", variant: "destructive" });
      console.error("Error updating user status:", error);
    },
  });
};

export const useAdminStats = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: activeUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true);
      const { data: subscriptions } = await supabase.from("subscriptions").select("plan, status");
      const planCounts = { free: 0, basic: 0, pro: 0, premium: 0 };
      subscriptions?.forEach((sub) => {
        if (sub.plan in planCounts) planCounts[sub.plan as keyof typeof planCounts]++;
      });
      return { totalUsers: totalUsers || 0, activeUsers: activeUsers || 0, planCounts };
    },
    enabled: isAdmin === true,
  });
};

export const useSaasPlans = () => {
  const { data: isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: ["saasPlans"],
    queryFn: async () => {
      const { data, error } = await db.from("saas_plans").select("*").order("price_monthly", { ascending: true });
      if (error) throw error;
      return (data || []) as SaasPlan[];
    },
    enabled: isAdmin === true,
  });
};

export const useCreateSaasPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (plan: Omit<SaasPlan, "id">) => {
      const { data, error } = await db.from("saas_plans").insert(plan).select("*").single();
      if (error) throw error;
      return data as SaasPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saasPlans"] });
      toast({ title: "Plano criado", description: "O novo plano já está disponível para configuração." });
    },
    onError: (error) => toast({ title: "Erro", description: error.message, variant: "destructive" }),
  });
};

export const useUpdateSaasPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SaasPlan> & { id: string }) => {
      const { error } = await db.from("saas_plans").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saasPlans"] });
      toast({ title: "Plano atualizado", description: "As regras do plano foram salvas." });
    },
    onError: (error) => toast({ title: "Erro", description: error.message, variant: "destructive" }),
  });
};
