import { supabaseAdmin } from "./supabaseAdmin.js";

export interface Business {
  user_id: string;
  whatsapp_auto_register_enabled: boolean;
  timezone: string | null;
  plan_slug: string | null;
  subscription_active: boolean;
  evolution_instance_token: string | null;
}

async function loadBusiness(userId: string): Promise<Business | null> {
  const [{ data: profile }, { data: subscription }, { data: settings }, { data: credentials }] = await Promise.all([
    supabaseAdmin.from("profiles").select("is_active").eq("id", userId).maybeSingle(),
    supabaseAdmin.from("subscriptions").select("status, expires_at, plan_id").eq("user_id", userId).maybeSingle(),
    supabaseAdmin.from("business_settings").select("user_id, whatsapp_auto_register_enabled, timezone").eq("user_id", userId).maybeSingle(),
    supabaseAdmin.from("whatsapp_instance_credentials").select("instance_token").eq("user_id", userId).maybeSingle(),
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
    evolution_instance_token: credentials?.instance_token ?? null,
  };
}

export async function findBusinessByAuthorizedPhone(phone: string): Promise<Business | null> {
  const { data: authorized, error } = await supabaseAdmin
    .from("whatsapp_authorized_numbers")
    .select("user_id")
    .eq("phone", phone)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.log(`[business] whatsapp_authorized_numbers lookup for ${phone} errored:`, error.message);
    return null;
  }
  if (!authorized?.user_id) {
    console.log(`[business] no active whatsapp_authorized_numbers row for phone ${phone}`);
    return null;
  }

  const business = await loadBusiness(authorized.user_id);
  if (!business) {
    console.log(`[business] authorized phone ${phone} matched user ${authorized.user_id}, but loadBusiness returned null (missing profiles or business_settings row for that user)`);
  }
  return business;
}

/** Identifies which business owns the Evolution Go instance a webhook fired on — the tenant boundary for *storing* a message, regardless of who sent it. */
export async function findBusinessByInstanceName(instanceName: string): Promise<Business | null> {
  const { data } = await supabaseAdmin
    .from("business_settings")
    .select("user_id")
    .eq("evolution_instance_name", instanceName)
    .maybeSingle();
  if (!data?.user_id) return null;
  return loadBusiness(data.user_id);
}

/** Whether a phone is allowed to issue commands (cadastrar, agendar, vale...) for this business — the permission boundary for *acting* on a message. */
export async function isAuthorizedPhone(userId: string, phone: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("whatsapp_authorized_numbers")
    .select("id")
    .eq("user_id", userId)
    .eq("phone", phone)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(data);
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
