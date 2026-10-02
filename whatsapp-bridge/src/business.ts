import { supabaseAdmin } from "./supabaseAdmin.js";

export interface Business {
  user_id: string;
  whatsapp_auto_register_enabled: boolean;
  timezone: string | null;
  plan_slug: string | null;
}

export async function findBusinessByAuthorizedPhone(phone: string): Promise<Business | null> {
  const { data: authorized } = await supabaseAdmin
    .from("whatsapp_authorized_numbers")
    .select("user_id")
    .eq("phone", phone)
    .eq("is_active", true)
    .maybeSingle();

  if (!authorized?.user_id) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, is_active")
    .eq("id", authorized.user_id)
    .maybeSingle();

  if (!profile?.is_active) return null;

  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .select("status, expires_at, plan_id")
    .eq("user_id", authorized.user_id)
    .maybeSingle();

  if (!subscription || !["active", "trial"].includes(subscription.status)) return null;
  if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) return null;

  let planSlug: string | null = null;
  if (subscription.plan_id) {
    const { data: plan } = await supabaseAdmin
      .from("saas_plans")
      .select("slug")
      .eq("id", subscription.plan_id)
      .maybeSingle();
    planSlug = plan?.slug ?? null;
  }

  const { data: settings } = await supabaseAdmin
    .from("business_settings")
    .select("user_id, whatsapp_auto_register_enabled, timezone")
    .eq("user_id", authorized.user_id)
    .maybeSingle();

  if (!settings) return null;
  return { ...settings, plan_slug: planSlug };
}

export async function findBusinessByInstance(instanceName: string): Promise<Business | null> {
  const { data } = await supabaseAdmin
    .from("business_settings")
    .select("user_id")
    .eq("evolution_instance_name", instanceName)
    .maybeSingle();
  return data?.user_id ? findBusinessByUserId(data.user_id) : null;
}

async function findBusinessByUserId(userId: string): Promise<Business | null> {
  const { data: authorized } = await supabaseAdmin
    .from("whatsapp_authorized_numbers")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  return authorized?.user_id ? findBusinessByAuthorizedPhone((await supabaseAdmin.from("whatsapp_authorized_numbers").select("phone").eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle()).data?.phone ?? "") : null;
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
