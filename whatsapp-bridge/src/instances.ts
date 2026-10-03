import { Router } from "express";
import crypto from "node:crypto";
import { supabaseAdmin } from "./supabaseAdmin.js";
import { requireSupabaseAuth, type AuthedRequest } from "./auth.js";
import * as evolution from "./evolution.js";

export const instancesRouter = Router();
instancesRouter.use(requireSupabaseAuth);

function instanceNameFor(userId: string): string {
  return `wc_${userId.replace(/-/g, "").slice(0, 20)}`;
}

function newInstanceToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function getOrCreateInstanceCredentials(userId: string): Promise<{ name: string; token: string }> {
  const { data, error } = await supabaseAdmin
    .from("business_settings")
    .select("evolution_instance_name, evolution_instance_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  const name = data?.evolution_instance_name || instanceNameFor(userId);
  if (data?.evolution_instance_token) return { name, token: data.evolution_instance_token };

  // Recover a token if the instance already exists in Evolution Go.
  try {
    const all = await evolution.listInstances();
    const existing = (all.data ?? []).find((item) => item.name === name);
    if (existing?.id) {
      const info = await evolution.getInstanceInfo(existing.id);
      const token = info.data?.token;
      if (token) {
        const { error: updateError } = await supabaseAdmin
          .from("business_settings")
          .update({ evolution_instance_name: name, evolution_instance_token: token })
          .eq("user_id", userId);
        if (updateError) throw updateError;
        return { name, token };
      }
    }
  } catch {
    // If it cannot be recovered, create a fresh instance token below.
  }

  const token = newInstanceToken();
  const { error: upsertError } = await supabaseAdmin
    .from("business_settings")
    .upsert(
      { user_id: userId, evolution_instance_name: name, evolution_instance_token: token },
      { onConflict: "user_id" },
    );
  if (upsertError) throw upsertError;

  return { name, token };
}

instancesRouter.get("/status", async (req: AuthedRequest, res) => {
  try {
    const { data } = await supabaseAdmin
      .from("business_settings")
      .select("evolution_instance_name, evolution_instance_token")
      .eq("user_id", req.userId)
      .maybeSingle();

    if (!data?.evolution_instance_name || !data.evolution_instance_token) {
      return res.json({ hasInstance: false, connected: false });
    }

    const state = await evolution.getConnectionState(data.evolution_instance_token);
    const connected = state.instance?.state === "open";
    res.json({ hasInstance: true, connected, instanceName: data.evolution_instance_name });
  } catch (err) {
    console.error("WhatsApp status error:", err);
    res.status(502).json({ error: (err as Error).message });
  }
});

instancesRouter.post("/connect", async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const { name: instanceName, token: instanceToken } = await getOrCreateInstanceCredentials(userId);

    // Create only when the instance does not already exist. Evolution Go uses
    // GLOBAL_API_KEY for this administrative operation and a per-instance
    // token for all subsequent operations.
    let exists = false;
    try {
      const all = await evolution.listInstances();
      exists = (all.data ?? []).some((item) => item.name === instanceName);
    } catch (error) {
      console.error("Failed to list Evolution Go instances:", error);
    }

    if (!exists) {
      await evolution.createInstance(instanceName, instanceToken);
    }

    await evolution.connectInstance(instanceName, instanceToken);

    let qr: { base64?: string; pairingCode?: string } = {};
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        qr = await evolution.getConnectQrCode(instanceToken);
        if (qr.base64 || qr.pairingCode) break;
      } catch (error) {
        if (attempt === 4) throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    res.json({
      instanceName,
      qrCode: qr.base64 ?? null,
      pairingCode: qr.pairingCode ?? null,
    });
  } catch (err) {
    console.error("WhatsApp connect error:", err);
    res.status(502).json({ error: (err as Error).message });
  }
});

instancesRouter.post("/disconnect", async (req: AuthedRequest, res) => {
  try {
    const { data } = await supabaseAdmin
      .from("business_settings")
      .select("evolution_instance_token")
      .eq("user_id", req.userId)
      .maybeSingle();

    if (data?.evolution_instance_token) {
      await evolution.logoutInstance(data.evolution_instance_token);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("WhatsApp disconnect error:", err);
    res.status(502).json({ error: (err as Error).message });
  }
});
