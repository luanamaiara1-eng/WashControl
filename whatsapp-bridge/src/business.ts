import { supabaseAdmin } from "./supabaseAdmin.js";

export interface Business {
  user_id: string;
  whatsapp_auto_register_enabled: boolean;
  timezone: string | null;
  plan_slug: string | null;
  subscription_active: boolean;
  evolution_instance_token: string | null;
}

export async function findBusinessByAuthorizedPhone(phone: string): Promise<Business | null> {
  const { data: authorized, error } = await supabaseAdmin
    .from("whatsapp_authorized_numbers")
    .select("user_id")
    .eq("phone", phone)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !authorized?.user_id) return null;

  const userId = authorized.user_id;

  const [{ data: profile }, { data: subscription }, { data: settings }] = await Promise.all([
    supabaseAdmin.from("profiles").select("is_active").eq("id", userId).maybeSingle(),
    supabaseAdmin.from("subscriptions").select("status, expires_at, plan_id").eq("user_id", userId).maybeSingle(),
    supabaseAdmin.from("business_settings").select("user_id, whatsapp_auto_register_enabled, timezone, evolution_instance_token").eq("user_id", userId).maybeSingle(),
  ]);

  if (!profile || !settings) return null;

  const subscriptionActive =
    profile.is_active === true &&
    !!subscription &&
    ["active", "trial"].includes(subscription.status) &&
    (!subscription.expires_at || new Date(subscription.expires_at) >= new Date());

  let planSlug: string | null = null;
  if (subscription?.plan_id) {
    const { data: plan } = await supabaseAdmin.from("saas_plans").select("slug").eq("id", subscription.plan_id).maybeSingle();
    planSlug = plan?.slug ?? null;
  }

  return {
    ...settings,
    plan_slug: planSlug,
    subscription_active: subscriptionActive,
  };
}

export async function findBusinessByInstance(instanceName: string): Promise<Business | null> {
  const { data } = await supabaseAdmin.from("business_settings").select("user_id").eq("evolution_instance_name", instanceName).maybeSingle();
  if (!data?.user_id) return null;

  const { data: number } = await supabaseAdmin
    .from("whatsapp_authorized_numbers")
    .select("phone")
    .eq("user_id", data.user_id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return number?.phone ? findBusinessByAuthorizedPhone(number.phone) : null;
}

export async function getClients(userId: string) {
  const { data } = await supabaseAdmin.from("clients").select("id, name, phone").eq("user_id", userId);
  return data ?? [];
}

export async function getClientByPhone(userId: string, phone: string) {
  const { data } = await supabaseAdmin.from("clients").select("id, name, phone").eq("user_id", userId).eq("phone", phone).maybeSingle();
  return data ?? null;
}

export async function getActiveServices(userId: string) {
  const { data } = await supabaseAdmin.from("services").select("id, name, price, duration_minutes").eq("user_id", userId).eq("is_active", true);
  return data ?? [];
}

export async function getActiveEmployees(userId: string) {
  const { data } = await supabaseAdmin.from("employees").select("id, name").eq("user_id", userId).eq("is_active", true);
  return data ?? [];
}

export async function getClientVehicles(userId: string, clientId: string) {
  const { data } = await supabaseAdmin.from("vehicles").select("id, brand, model, plate").eq("user_id", userId).eq("client_id", clientId);
  return data ?? [];
}
