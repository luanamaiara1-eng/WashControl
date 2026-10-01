import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export type AppRole = 'admin' | 'user';
export type SubscriptionPlan = 'free' | 'basic' | 'pro';
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
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Fetch subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from("subscriptions")
        .select("*");

      if (subscriptionsError) throw subscriptionsError;

      // Combine data
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
          subscription: userSubscription
            ? {
                plan: userSubscription.plan as SubscriptionPlan,
                status: userSubscription.status as SubscriptionStatus,
                expires_at: userSubscription.expires_at,
              }
            : null,
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
    mutationFn: async ({
      userId,
      plan,
      status,
    }: {
      userId: string;
      plan?: SubscriptionPlan;
      status?: SubscriptionStatus;
    }) => {
      const updates: Record<string, unknown> = {};
      if (plan) updates.plan = plan;
      if (status) updates.status = status;

      const { error } = await supabase
        .from("subscriptions")
        .update(updates)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast({
        title: "Sucesso",
        description: "Assinatura atualizada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar assinatura",
        variant: "destructive",
      });
      console.error("Error updating subscription:", error);
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast({
        title: "Sucesso",
        description: "Status do usuário atualizado",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do usuário",
        variant: "destructive",
      });
      console.error("Error updating user status:", error);
    },
  });
};

export const useAdminStats = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      // Get total users count
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get active users count
      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get subscription stats
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("plan, status");

      const planCounts = {
        free: 0,
        basic: 0,
        pro: 0,
      };

      subscriptions?.forEach((sub) => {
        if (sub.plan in planCounts) {
          planCounts[sub.plan as keyof typeof planCounts]++;
        }
      });

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        planCounts,
      };
    },
    enabled: isAdmin === true,
  });
};
