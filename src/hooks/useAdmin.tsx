import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export type AppRole = "admin" | "user";
export type SubscriptionPlan = "free" | "basic" | "pro" | "premium";
export type SubscriptionStatus = "active" | "canceled" | "expired" | "trial";

export interface SaasPlan {
  id: string; name: string; slug: string; description: string | null;
  price_monthly: number; price_yearly: number; is_active: boolean;
  max_whatsapp_central: number; max_users: number; max_employees: number;
  max_vehicles: number; features: Record<string, boolean>;
}

export interface UserWithDetails {
  id: string; email: string | null; business_name: string | null;
  is_active: boolean; created_at: string; role: AppRole;
  subscription: {
    plan: SubscriptionPlan; plan_id: string | null; status: SubscriptionStatus;
    expires_at: string | null; started_at: string | null;
  } | null;
}

const db = supabase as any;

export const useIsAdmin = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.from("user_roles").select("role")
        .eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (error) { console.error("Error checking admin status:", error); return false; }
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
      const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }, { data: subscriptions, error: subscriptionsError }] =
        await Promise.all([
          supabase.from("profiles").select("*").order("created_at", { ascending: false }),
          supabase.from("user_roles").select("*"),
          db.from("subscriptions").select("*"),
        ]);
      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;
      if (subscriptionsError) throw subscriptionsError;
      return (profiles || []).map((profile): UserWithDetails => {
        const role = roles?.find((r) => r.user_id === profile.id);
        const sub = subscriptions?.find((s) => s.user_id === profile.id);
        return {
          id: profile.id, email: profile.email, business_name: profile.business_name,
          is_active: profile.is_active, created_at: profile.created_at, role: (role?.role as AppRole) || "user",
          subscription: sub ? {
            plan: (sub.plan || "free") as SubscriptionPlan, plan_id: sub.plan_id ?? null,
            status: sub.status as SubscriptionStatus, expires_at: sub.expires_at,
            started_at: sub.started_at,
          } : null,
        };
      });
    },
    enabled: isAdmin === true,
  });
};

export const useUpdateUserSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ userId, plan, status, expiresAt }: {
      userId: string; plan?: SubscriptionPlan; status?: SubscriptionStatus; expiresAt?: string | null;
    }) => {
      const updates: Record<string, unknown> = {};
      if (plan) {
        updates.plan = plan;
        const { data, error } = await db.from("saas_plans").select("id").eq("slug", plan).maybeSingle();
        if (error) throw error;
        updates.plan_id = data?.id ?? null;
      }
      if (status) updates.status = status;
      if (expiresAt !== undefined) updates.expires_at = expiresAt;

      const { data: current, error: currentError } = await db.from("subscriptions")
        .select("id").eq("user_id", userId).maybeSingle();
      if (currentError) throw currentError;

      if (current?.id) {
        const { error } = await db.from("subscriptions").update(updates).eq("id", current.id);
        if (error) throw error;
      } else {
        const { error } = await db.from("subscriptions").insert({
          user_id: userId, plan: plan || "free", status: status || "trial",
          started_at: new Date().toISOString(), expires_at: expiresAt ?? null,
          plan_id: updates.plan_id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast({ title: "Sucesso", description: "Assinatura atualizada com sucesso." });
    },
    onError: (error) => toast({ title: "Erro", description: error.message || "Não foi possível atualizar a assinatura.", variant: "destructive" }),
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
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast({ title: "Sucesso", description: "Status do usuário atualizado." });
    },
    onError: (error) => toast({ title: "Erro", description: "Erro ao atualizar status do usuário.", variant: "destructive" }),
  });
};

export const useAdminStats = () => {
  const { data: isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const [{ data: profiles, error: profilesError }, { data: subscriptions, error: subscriptionsError }, { data: plans, error: plansError }] =
        await Promise.all([
          supabase.from("profiles").select("id, created_at, is_active"),
          supabase.from("subscriptions").select("id, user_id, plan, plan_id, status, started_at, expires_at"),
          supabase.from("saas_plans").select("id, slug, name, price_monthly, price_yearly"),
        ]);
      if (profilesError) throw profilesError;
      if (subscriptionsError) throw subscriptionsError;
      if (plansError) throw plansError;

      const now = new Date();
      const activeSubs = (subscriptions || []).filter((s) =>
        ["active", "trial"].includes(s.status) && (!s.expires_at || new Date(s.expires_at) >= now)
      );
      const planMap = new Map((plans || []).map((p) => [p.id, p]));
      const slugMap = new Map((plans || []).map((p) => [p.slug, p]));
      const mrr = activeSubs.reduce((sum, s) => {
        const p = (s.plan_id && planMap.get(s.plan_id)) || slugMap.get(s.plan);
        return sum + Number(p?.price_monthly || 0);
      }, 0);
      const expiringSoon = activeSubs.filter((s) => {
        if (!s.expires_at) return false;
        const diff = new Date(s.expires_at).getTime() - now.getTime();
        return diff >= 0 && diff <= 7 * 86400000;
      }).length;
      const usersByMonth = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const key = d.toISOString().slice(0, 7);
        return {
          month: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
          users: (profiles || []).filter((p) => p.created_at?.slice(0, 7) === key).length,
        };
      });
      const planDistribution = (plans || []).map((p) => ({
        name: p.name,
        value: activeSubs.filter((s) => (s.plan_id || slugMap.get(s.plan)?.id) === p.id).length,
      })).filter((p) => p.value > 0);

      return {
        totalUsers: profiles?.length || 0,
        activeUsers: profiles?.filter((p) => p.is_active).length || 0,
        inactiveUsers: profiles?.filter((p) => !p.is_active).length || 0,
        activeSubscriptions: activeSubs.length,
        trialSubscriptions: activeSubs.filter((s) => s.status === "trial").length,
        expiringSoon, mrr, annualContractValue: mrr * 12,
        planCounts: activeSubs.reduce((acc: Record<string, number>, s) => {
          const key = s.plan || "free"; acc[key] = (acc[key] || 0) + 1; return acc;
        }, {}),
        planDistribution, usersByMonth,
      };
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
      if (error) throw error; return data as SaasPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saasPlans"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
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
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast({ title: "Plano atualizado", description: "As regras do plano foram salvas." });
    },
    onError: (error) => toast({ title: "Erro", description: error.message, variant: "destructive" }),
  });
};
