import express from "express";
import cors from "cors";
import cron from "node-cron";
import { config } from "./config.js";
import { webhookRouter } from "./webhook.js";
import { instancesRouter } from "./instances.js";
import { sendDueFollowups } from "./followups.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/webhook", webhookRouter);
app.use("/api/whatsapp", instancesRouter);

app.listen(config.port, () => {
  console.log(`whatsapp-bridge listening on :${config.port}`);
});

cron.schedule(config.followupCronSchedule, async () => {
  console.log("Running due follow-up messages job...");
  const result = await sendDueFollowups();
  console.log("Follow-up job finished:", result);
});
