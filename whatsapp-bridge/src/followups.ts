import { supabaseAdmin } from "./supabaseAdmin.js";
import * as evolution from "./evolution.js";
import { isValidBrazilianPhone } from "./phone.js";

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? "");
}

export async function sendDueFollowups(): Promise<{ sent: number; skipped: number; failed: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const result = { sent: 0, skipped: 0, failed: 0 };

  const { data: dueFollowups, error } = await supabaseAdmin
    .from("client_followups")
    .select("id, user_id, due_date, clients(name, phone)")
    .eq("status", "pending")
    .lte("due_date", today);

  if (error) {
    console.error("Failed to load due followups:", error);
    return result;
  }
  if (!dueFollowups?.length) return result;

  const userIds = [...new Set(dueFollowups.map((f) => f.user_id))];
  const { data: businesses } = await supabaseAdmin
    .from("business_settings")
    .select("user_id, evolution_instance_name, whatsapp_followup_enabled, whatsapp_followup_days, whatsapp_followup_message")
    .in("user_id", userIds);

  const businessByUserId = new Map((businesses ?? []).map((b) => [b.user_id, b]));

  for (const followup of dueFollowups) {
    const business = businessByUserId.get(followup.user_id);
    const client = followup.clients as unknown as { name: string; phone: string | null } | null;

    if (!business?.whatsapp_followup_enabled || !business.evolution_instance_name) {
      result.skipped++;
      continue;
    }

    if (!client?.phone || !isValidBrazilianPhone(client.phone)) {
      await supabaseAdmin.from("client_followups").update({ status: "failed" }).eq("id", followup.id);
      result.failed++;
      continue;
    }

    const message = renderTemplate(business.whatsapp_followup_message, {
      nome: client.name,
      dias: String(business.whatsapp_followup_days),
    });

    try {
      await evolution.sendText(business.evolution_instance_name, client.phone, message);
      await supabaseAdmin
        .from("client_followups")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", followup.id);
      result.sent++;
    } catch (err) {
      console.error(`Failed to send followup ${followup.id}:`, err);
      result.failed++;
    }
  }

  return result;
}
