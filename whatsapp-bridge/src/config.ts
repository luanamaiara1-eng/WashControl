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

  evolutionBaseUrl: required("EVOLUTION_BASE_URL").replace(/\/$/, ""),
  evolutionApiKey: required("EVOLUTION_API_KEY"),

  // Public URL of this bridge, used when registering the webhook on each
  // Evolution instance (e.g. https://whatsapp.suaempresa.com.br)
  bridgePublicUrl: required("BRIDGE_PUBLIC_URL").replace(/\/$/, ""),

  // Daily cron schedule (default: every day at 09:00 server time)
  followupCronSchedule: process.env.FOLLOWUP_CRON_SCHEDULE || "0 9 * * *",
};
