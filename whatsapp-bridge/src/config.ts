import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT || 3300),

  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseJwtSecret: required("SUPABASE_JWT_SECRET"),

  // Fallback only — the primary source is Super Admin > Evolution Go
  // (see evolutionSettings.ts), stored in the evolution_settings table.
  evolutionBaseUrl: process.env.EVOLUTION_BASE_URL?.replace(/\/$/, "") || "",
  evolutionApiKey: process.env.EVOLUTION_API_KEY || "",

  // Public URL of this bridge, used when registering the webhook on each
  // Evolution instance (e.g. https://whatsapp.suaempresa.com.br)
  bridgePublicUrl: required("BRIDGE_PUBLIC_URL").replace(/\/$/, ""),

  // Daily cron schedule (default: every day at 09:00 server time)
  followupCronSchedule: process.env.FOLLOWUP_CRON_SCHEDULE || "0 9 * * *",

  // Web Push (generate with: npx web-push generate-vapid-keys)
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || "",
  vapidContactEmail: process.env.VAPID_CONTACT_EMAIL || "admin@washcontrol.app",

  // How often to check for new signups/subscriptions to notify admins about
  adminNotificationsCronSchedule: process.env.ADMIN_NOTIFICATIONS_CRON_SCHEDULE || "*/2 * * * *",
};
