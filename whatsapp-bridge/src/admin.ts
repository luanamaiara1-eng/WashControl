import { Router } from "express";
import { requireSupabaseAuth, requireAdmin } from "./auth.js";
import { invalidateEvolutionSettingsCache } from "./evolutionSettings.js";
import { listInstances } from "./evolution.js";

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
