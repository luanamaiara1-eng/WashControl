import { Router } from "express";
import { requireSupabaseAuth, requireAdmin } from "./auth.js";
import { invalidateEvolutionSettingsCache } from "./evolutionSettings.js";
import { listInstances } from "./evolution.js";
import { getCentralStatus, connectCentral, disconnectCentral } from "./central.js";

export const adminRouter = Router();
adminRouter.use(requireSupabaseAuth, requireAdmin);

// The Super Admin screen saves base_url/api_key directly to Supabase; this
// just makes sure the bridge picks up the new values immediately instead of
// waiting out the cache TTL, then confirms they actually work.
adminRouter.post("/evolution/test", async (_req, res) => {
  invalidateEvolutionSettingsCache();

  try {
    await listInstances();
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ ok: false, error: (err as Error).message });
  }
});

// The one platform-wide WhatsApp number used to receive commands from
// authorized owners (e.g. "João agendou lavagem..."), as opposed to each
// business's own number (connected from Configurações), which only talks
// to their own clients.
adminRouter.get("/central/status", async (_req, res) => {
  try {
    res.json(await getCentralStatus());
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

adminRouter.post("/central/connect", async (_req, res) => {
  try {
    res.json(await connectCentral());
  } catch (err) {
    console.error("Central WhatsApp connect error:", err);
    res.status(502).json({ error: (err as Error).message });
  }
});

adminRouter.post("/central/disconnect", async (_req, res) => {
  try {
    await disconnectCentral();
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});
