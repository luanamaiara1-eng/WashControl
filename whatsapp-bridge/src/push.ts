import webpush from "web-push";
import { config } from "./config.js";
import { supabaseAdmin } from "./supabaseAdmin.js";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  if (!config.vapidPublicKey || !config.vapidPrivateKey) {
    throw new Error("VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY não configuradas no .env do bridge.");
  }
  webpush.setVapidDetails(`mailto:${config.vapidContactEmail}`, config.vapidPublicKey, config.vapidPrivateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureConfigured();

  const { data: subscriptions } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  for (const sub of subscriptions ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // Subscription no longer valid (browser data cleared, uninstalled, etc.)
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error(`Push send failed for subscription ${sub.id}:`, err);
      }
    }
  }
}

export async function sendPushToAdmins(payload: PushPayload) {
  const { data: admins } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
  for (const admin of admins ?? []) {
    await sendPushToUser(admin.user_id, payload);
  }
}
