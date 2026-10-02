import { supabaseAdmin } from "./supabaseAdmin.js";

export interface Business {
  user_id: string;
  whatsapp_auto_register_enabled: boolean;
  timezone: string | null;
}

export async function findBusinessByInstance(instanceName: string): Promise<Business | null> {
  const { data } = await supabaseAdmin
    .from("business_settings")
    .select("user_id, whatsapp_auto_register_enabled, timezone")
    .eq("evolution_instance_name", instanceName)
    .maybeSingle();
  return data;
}

export async function getClients(userId: string) {
  const { data } = await supabaseAdmin.from("clients").select("id, name, phone").eq("user_id", userId);
  return data ?? [];
}

export async function getActiveServices(userId: string) {
  const { data } = await supabaseAdmin
    .from("services")
    .select("id, name, price, duration_minutes")
    .eq("user_id", userId)
    .eq("is_active", true);
  return data ?? [];
}

export async function getActiveEmployees(userId: string) {
  const { data } = await supabaseAdmin.from("employees").select("id, name").eq("user_id", userId).eq("is_active", true);
  return data ?? [];
}

export async function getClientVehicles(userId: string, clientId: string) {
  const { data } = await supabaseAdmin
    .from("vehicles")
    .select("id, brand, model, plate")
    .eq("user_id", userId)
    .eq("client_id", clientId);
  return data ?? [];
}
