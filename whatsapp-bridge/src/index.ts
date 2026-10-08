import express from "express";
import cors from "cors";
import cron from "node-cron";
import { config } from "./config.js";
import { webhookRouter } from "./webhook.js";
import { instancesRouter } from "./instances.js";
import { adminRouter } from "./admin.js";
import { sendDueFollowups, sendDueAppointmentReminders } from "./followups.js";
import { checkNewSignups, checkNewSubscriptions } from "./adminNotifications.js";

// One-off marker to confirm a deploy actually picked up new source instead
// of reusing a cached Docker layer — visit GET /health and compare this
// string, or check the startup log line below. Safe to delete later.
const BUILD_MARKER = "build-2026-10-08-central-debug-2";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, buildMarker: BUILD_MARKER }));
app.use("/webhook", webhookRouter);
app.use("/api/whatsapp", instancesRouter);
app.use("/api/admin", adminRouter);

app.listen(config.port, () => {
  console.log(`whatsapp-bridge listening on :${config.port} — buildMarker=${BUILD_MARKER}`);
});

cron.schedule(config.followupCronSchedule, async () => {
  console.log("Running due follow-up messages job...");
  const result = await sendDueFollowups();
  const reminders = await sendDueAppointmentReminders();
  console.log("WhatsApp automation finished:", { followups: result, reminders });
});

if (config.vapidPublicKey && config.vapidPrivateKey) {
  cron.schedule(config.adminNotificationsCronSchedule, async () => {
    const signups = await checkNewSignups();
    const subscriptions = await checkNewSubscriptions();
    if (signups || subscriptions) console.log("Admin notifications sent:", { signups, subscriptions });
  });
} else {
  console.log("VAPID keys not set — admin push notifications disabled.");
}
