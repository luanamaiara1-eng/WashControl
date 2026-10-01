import { Router } from "express";
import { supabaseAdmin } from "./supabaseAdmin.js";
import { requireSupabaseAuth, type AuthedRequest } from "./auth.js";
import * as evolution from "./evolution.js";

export const instancesRouter = Router();
instancesRouter.use(requireSupabaseAuth);

function instanceNameFor(userId: string): string {
  return `wc_${userId.replace(/-/g, "").slice(0, 20)}`;
}

async function getOrCreateInstanceName(userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("business_settings")
    .select("evolution_instance_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  if (data?.evolution_instance_name) return data.evolution_instance_name;

  const instanceName = instanceNameFor(userId);
  const { error: upsertError } = await supabaseAdmin
    .from("business_settings")
    .upsert({ user_id: userId, evolution_instance_name: instanceName }, { onConflict: "user_id" });
  if (upsertError) throw upsertError;

  return instanceName;
}

instancesRouter.get("/status", async (req: AuthedRequest, res) => {
  try {
    const { data } = await supabaseAdmin
      .from("business_settings")
      .select("evolution_instance_name")
      .eq("user_id", req.userId)
      .maybeSingle();

    if (!data?.evolution_instance_name) {
      return res.json({ hasInstance: false, connected: false });
    }

    const state = await evolution.getConnectionState(data.evolution_instance_name);
    const connected = (state.instance?.state ?? state.state) === "open";
    res.json({ hasInstance: true, connected, instanceName: data.evolution_instance_name });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

instancesRouter.post("/connect", async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const instanceName = await getOrCreateInstanceName(userId);

    // instance/create is a no-op (or errors harmlessly) if it already exists on
    // most Evolution-compatible servers; we only need the QR on (re)connect.
    await evolution.createInstance(instanceName).catch(() => undefined);
    await evolution.setInstanceWebhook(instanceName);
    const qr = await evolution.getConnectQrCode(instanceName);

    res.json({ instanceName, qrCode: qr.base64 ?? null, pairingCode: qr.pairingCode ?? null });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

instancesRouter.post("/disconnect", async (req: AuthedRequest, res) => {
  try {
    const { data } = await supabaseAdmin
      .from("business_settings")
      .select("evolution_instance_name")
      .eq("user_id", req.userId)
      .maybeSingle();

    if (data?.evolution_instance_name) {
      await evolution.logoutInstance(data.evolution_instance_name);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});
