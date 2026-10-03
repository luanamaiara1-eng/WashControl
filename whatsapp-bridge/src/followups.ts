import { supabaseAdmin } from "./supabaseAdmin.js";
import * as evolution from "./evolution.js";
import { isValidBrazilianPhone } from "./phone.js";

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? "");
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "00";
  return { year: +get("year"), month: +get("month"), day: +get("day"), hour: +get("hour"), minute: +get("minute"), second: +get("second") };
}

function localTimestamp(parts: ReturnType<typeof zonedParts>) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

function appointmentTimestamp(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute, second = 0] = time.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute, second);
}

function formatDate(date: string) {
  return date.split("-").reverse().join("/");
}

export async function sendDueFollowups(): Promise<{ sent: number; skipped: number; failed: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const result = { sent: 0, skipped: 0, failed: 0 };

  const { data: dueFollowups, error } = await supabaseAdmin
    .from("client_followups")
    .select("id, user_id, due_date, clients(name, phone)")
    .eq("status", "pending")
    .lte("due_date", today);

  if (error) { console.error("Failed to load due followups:", error); return result; }
  if (!dueFollowups?.length) return result;

  const userIds = [...new Set(dueFollowups.map((f) => f.user_id))];
  const { data: businesses } = await supabaseAdmin
    .from("business_settings")
    .select("user_id, evolution_instance_name, evolution_instance_token, whatsapp_followup_enabled, whatsapp_followup_days, whatsapp_followup_message")
    .in("user_id", userIds);
  const businessByUserId = new Map((businesses ?? []).map((b) => [b.user_id, b]));

  for (const followup of dueFollowups) {
    const business = businessByUserId.get(followup.user_id);
    const client = followup.clients as unknown as { name: string; phone: string | null } | null;
    if (!business?.whatsapp_followup_enabled || !business.evolution_instance_name || !business.evolution_instance_token) { result.skipped++; continue; }

    if (!client?.phone || !isValidBrazilianPhone(client.phone)) {
      await supabaseAdmin.from("client_followups").update({ status: "failed" }).eq("id", followup.id);
      result.failed++; continue;
    }

    const message = renderTemplate(business.whatsapp_followup_message, { nome: client.name, dias: String(business.whatsapp_followup_days) });
    try {
      await evolution.sendText(business.evolution_instance_token, client.phone, message);
      await supabaseAdmin.from("client_followups").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", followup.id);
      result.sent++;
    } catch (err) { console.error(`Failed to send followup ${followup.id}:`, err); result.failed++; }
  }
  return result;
}

export async function sendDueAppointmentReminders(): Promise<{ sent: number; skipped: number; failed: number }> {
  const result = { sent: 0, skipped: 0, failed: 0 };
  const { data: businesses, error: businessError } = await supabaseAdmin
    .from("business_settings")
    .select("user_id,evolution_instance_name,evolution_instance_token,send_reminders,reminder_hours_before,whatsapp_reminder_message,timezone")
    .eq("send_reminders", true);

  if (businessError) { console.error("Failed to load reminder settings:", businessError); return result; }
  if (!businesses?.length) return result;

  for (const business of businesses) {
    if (!business.evolution_instance_name || !business.evolution_instance_token) { result.skipped++; continue; }
    const timezone = business.timezone || "America/Sao_Paulo";
    const now = new Date();
    const nowLocal = zonedParts(now, timezone);
    const nowPseudo = localTimestamp(nowLocal);
    const targetMin = nowPseudo + Number(business.reminder_hours_before || 24) * 60 * 60 * 1000;
    const targetMax = targetMin + 65 * 60 * 1000;

    const today = new Date(nowPseudo);
    const startDate = new Date(today); startDate.setUTCDate(startDate.getUTCDate() - 1);
    const endDate = new Date(today); endDate.setUTCDate(endDate.getUTCDate() + 3);
    const start = startDate.toISOString().slice(0, 10);
    const end = endDate.toISOString().slice(0, 10);

    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select("id,user_id,client_id,scheduled_date,scheduled_time,status,clients(name,phone),services(name)")
      .eq("user_id", business.user_id)
      .gte("scheduled_date", start)
      .lte("scheduled_date", end)
      .in("status", ["scheduled", "in_progress"]);

    if (error) { console.error("Failed to load appointments:", error); result.failed++; continue; }

    for (const appointment of appointments || []) {
      const apptPseudo = appointmentTimestamp(appointment.scheduled_date, appointment.scheduled_time);
      const diff = apptPseudo - nowPseudo;
      if (diff < Number(business.reminder_hours_before || 24) * 60 * 60 * 1000 || diff >= Number(business.reminder_hours_before || 24) * 60 * 60 * 1000 + 65 * 60 * 1000) continue;

      const client = appointment.clients as unknown as { name: string; phone: string | null } | null;
      if (!client?.phone || !isValidBrazilianPhone(client.phone)) { result.skipped++; continue; }

      const template = business.whatsapp_reminder_message ||
        "Olá {{nome}}! 🚗 Seu atendimento está agendado para {{data}} às {{hora}}.\n\nServiço: {{servico}}\n\nSe precisar remarcar, fale conosco.";
      const message = renderTemplate(template, {
        nome: client.name,
        data: formatDate(appointment.scheduled_date),
        hora: appointment.scheduled_time.slice(0, 5),
        servico: (appointment.services as any)?.name || "atendimento",
      });

      const { data: existing } = await supabaseAdmin
        .from("whatsapp_message_logs")
        .select("id")
        .eq("appointment_id", appointment.id)
        .eq("message_type", "appointment_reminder")
        .maybeSingle();
      if (existing) { result.skipped++; continue; }

      try {
        await evolution.sendText(business.evolution_instance_token, client.phone, message);
        await supabaseAdmin.from("whatsapp_message_logs").insert({
          user_id: business.user_id, appointment_id: appointment.id, client_id: appointment.client_id,
          message_type: "appointment_reminder", recipient_phone: client.phone, message, status: "sent",
        });
        result.sent++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        await supabaseAdmin.from("whatsapp_message_logs").insert({
          user_id: business.user_id, appointment_id: appointment.id, client_id: appointment.client_id,
          message_type: "appointment_reminder", recipient_phone: client.phone, message, status: "failed", error_message: errorMessage,
        });
        result.failed++;
      }
    }
  }
  return result;
}
