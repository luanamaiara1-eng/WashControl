import { supabaseAdmin } from "./supabaseAdmin.js";
import { sendPushToAdmins } from "./push.js";

async function getCursor(key: string): Promise<string> {
  const { data } = await supabaseAdmin.from("admin_notification_state").select("last_seen").eq("key", key).maybeSingle();
  // No row yet means this check never ran before — start from now so we
  // don't blast admins with a notification for every pre-existing row.
  return data?.last_seen ?? new Date().toISOString();
}

async function setCursor(key: string, value: string) {
  await supabaseAdmin.from("admin_notification_state").upsert({ key, last_seen: value });
}

export async function checkNewSignups(): Promise<number> {
  const cursor = await getCursor("signups");

  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, business_name, email, created_at")
    .gt("created_at", cursor)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to check new signups:", error);
    return 0;
  }
  if (!profiles?.length) return 0;

  for (const profile of profiles) {
    await sendPushToAdmins({
      title: "Novo cadastro no WashControl 🎉",
      body: profile.business_name || profile.email || "Um novo usuário se cadastrou",
      url: "/admin#usuarios",
    });
  }

  await setCursor("signups", profiles[profiles.length - 1].created_at);
  return profiles.length;
}

export async function checkNewSubscriptions(): Promise<number> {
  const cursor = await getCursor("subscriptions");

  const { data: subscriptions, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, plan, status, updated_at")
    .gt("updated_at", cursor)
    .in("status", ["active", "trial"])
    .order("updated_at", { ascending: true });

  if (error) {
    console.error("Failed to check new subscriptions:", error);
    return 0;
  }
  if (!subscriptions?.length) return 0;

  const userIds = [...new Set(subscriptions.map((s) => s.user_id))];
  const { data: profiles } = await supabaseAdmin.from("profiles").select("id, business_name, email").in("id", userIds);
  const nameByUserId = new Map((profiles ?? []).map((p) => [p.id, p.business_name || p.email || "Um usuário"]));

  for (const subscription of subscriptions) {
    await sendPushToAdmins({
      title: "Nova assinatura ativa 💳",
      body: `${nameByUserId.get(subscription.user_id)} assinou o plano ${subscription.plan}`,
      url: "/admin#usuarios",
    });
  }

  await setCursor("subscriptions", subscriptions[subscriptions.length - 1].updated_at);
  return subscriptions.length;
}
