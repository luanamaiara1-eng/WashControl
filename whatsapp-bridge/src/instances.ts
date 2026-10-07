import { Router } from "express";
import crypto from "node:crypto";
import { supabaseAdmin } from "./supabaseAdmin.js";
import { requireSupabaseAuth, type AuthedRequest } from "./auth.js";
import * as evolution from "./evolution.js";
import { toLocalPhone, isValidBrazilianPhone } from "./phone.js";
import { recordMessage } from "./conversations.js";

export const instancesRouter = Router();
instancesRouter.use(requireSupabaseAuth);

function instanceNameFor(userId: string): string {
  return `wc_${userId.replace(/-/g, "").slice(0, 20)}`;
}

function newInstanceToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function isAlreadyLoggedInError(error: unknown): boolean {
  return error instanceof Error && /already logged in/i.test(error.message);
}

async function getOrCreateInstanceCredentials(userId: string): Promise<{ name: string; token: string }> {
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("business_settings")
    .select("evolution_instance_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (settingsError) throw settingsError;

  const { data: existingCredentials, error: credentialsError } = await supabaseAdmin
    .from("whatsapp_instance_credentials")
    .select("instance_name, instance_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (credentialsError) throw credentialsError;

  if (existingCredentials?.instance_name && existingCredentials.instance_token) {
    return {
      name: existingCredentials.instance_name,
      token: existingCredentials.instance_token,
    };
  }

  const name = settings?.evolution_instance_name || instanceNameFor(userId);

  // Recover a token if this instance already exists in Evolution Go.
  try {
    const all = await evolution.listInstances();
    const existing = (all.data ?? []).find((item) => item.name === name);
    if (existing?.id) {
      const info = await evolution.getInstanceInfo(existing.id);
      const token = info.data?.token;
      if (token) {
        const { error } = await supabaseAdmin
          .from("whatsapp_instance_credentials")
          .upsert(
            { user_id: userId, instance_name: name, instance_token: token },
            { onConflict: "user_id" },
          );
        if (error) throw error;
        return { name, token };
      }
    }
  } catch (error) {
    console.error("Could not recover existing Evolution Go token:", error);
  }

  const token = newInstanceToken();
  const { error: upsertError } = await supabaseAdmin
    .from("whatsapp_instance_credentials")
    .upsert(
      { user_id: userId, instance_name: name, instance_token: token },
      { onConflict: "user_id" },
    );
  if (upsertError) throw upsertError;

  if (!settings?.evolution_instance_name) {
    const { error } = await supabaseAdmin
      .from("business_settings")
      .update({ evolution_instance_name: name })
      .eq("user_id", userId);
    if (error) throw error;
  }

  return { name, token };
}

instancesRouter.get("/status", async (req: AuthedRequest, res) => {
  try {
    const { data: credentials } = await supabaseAdmin
      .from("whatsapp_instance_credentials")
      .select("instance_name, instance_token")
      .eq("user_id", req.userId)
      .maybeSingle();

    if (!credentials?.instance_name || !credentials.instance_token) {
      return res.json({ hasInstance: false, connected: false });
    }

    const state = await evolution.getConnectionState(credentials.instance_token);
    const connected = state.instance?.state === "open";
    res.json({
      hasInstance: true,
      connected,
      instanceName: credentials.instance_name,
    });
  } catch (err) {
    console.error("WhatsApp status error:", err);
    res.status(502).json({ error: (err as Error).message });
  }
});

instancesRouter.post("/connect", async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const { name: instanceName, token: instanceToken } = await getOrCreateInstanceCredentials(userId);

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

    // Always (re)register the webhook — even an already-connected instance
    // needs this, since without it Evolution Go has nowhere to deliver
    // inbound messages/events. A previous version returned early for
    // already-connected instances *before* this call, which silently left
    // the webhook unset for anyone who connected that way.
    await evolution.connectInstance(instanceName, instanceToken);

    if (exists) {
      // The instance may already have an active WhatsApp session from a
      // previous pairing (e.g. a retry after the app itself was briefly
      // unreachable) — no QR code needed in that case.
      const state = await evolution.getConnectionState(instanceToken).catch(() => null);
      if (state?.instance?.state === "open") {
        return res.json({ instanceName, qrCode: null, pairingCode: null, alreadyConnected: true });
      }
    }

    let qr: { base64?: string; pairingCode?: string } = {};
    let alreadyConnected = false;
    for (let attempt = 0; attempt < 15; attempt++) {
      try {
        qr = await evolution.getConnectQrCode(instanceToken);
        if (qr.base64 || qr.pairingCode) break;
      } catch (error) {
        if (isAlreadyLoggedInError(error)) {
          alreadyConnected = true;
          break;
        }
        if (attempt === 4) throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    res.json({
      instanceName,
      qrCode: qr.base64 ?? null,
      pairingCode: qr.pairingCode ?? null,
      alreadyConnected,
    });
  } catch (err) {
    console.error("WhatsApp connect error:", err);
    res.status(502).json({ error: (err as Error).message });
  }
});

// Fetches a fresh QR Code without re-registering the connection/webhook, so
// the pairing dialog can keep itself from going stale. Unlike /connect, this
// never calls connectInstance(), which would restart the WhatsApp session
// and could kick a pairing that just succeeded.
instancesRouter.get("/qr", async (req: AuthedRequest, res) => {
  try {
    const { data: credentials } = await supabaseAdmin
      .from("whatsapp_instance_credentials")
      .select("instance_token")
      .eq("user_id", req.userId)
      .maybeSingle();

    if (!credentials?.instance_token) {
      return res.json({ qrCode: null, pairingCode: null, alreadyConnected: false });
    }

    const state = await evolution.getConnectionState(credentials.instance_token).catch(() => null);
    if (state?.instance?.state === "open") {
      return res.json({ qrCode: null, pairingCode: null, alreadyConnected: true });
    }

    try {
      const qr = await evolution.getConnectQrCode(credentials.instance_token);
      res.json({ qrCode: qr.base64 ?? null, pairingCode: qr.pairingCode ?? null, alreadyConnected: false });
    } catch (error) {
      if (isAlreadyLoggedInError(error)) {
        return res.json({ qrCode: null, pairingCode: null, alreadyConnected: true });
      }
      throw error;
    }
  } catch (err) {
    console.error("WhatsApp QR refresh error:", err);
    res.status(502).json({ error: (err as Error).message });
  }
});

instancesRouter.post("/disconnect", async (req: AuthedRequest, res) => {
  try {
    const { data } = await supabaseAdmin
      .from("whatsapp_instance_credentials")
      .select("instance_token")
      .eq("user_id", req.userId)
      .maybeSingle();

    if (data?.instance_token) {
      // Best-effort: a stuck/already-logged-out session can make Evolution Go
      // error here too, but the point of this button is to force a reset, so
      // we don't want that to block the user from then clicking "Conectar".
      await evolution.logoutInstance(data.instance_token).catch((error) => {
        console.error("Evolution Go logout failed (continuing anyway):", error);
      });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("WhatsApp disconnect error:", err);
    res.status(502).json({ error: (err as Error).message });
  }
});

instancesRouter.post("/send-test", async (req: AuthedRequest, res) => {
  try {
    const { phone, message } = req.body ?? {};
    const localPhone = typeof phone === "string" ? toLocalPhone(phone) : "";
    if (!isValidBrazilianPhone(localPhone)) {
      return res.status(400).json({ error: "Telefone inválido. Use DDD + número, só números." });
    }

    const { data } = await supabaseAdmin
      .from("whatsapp_instance_credentials")
      .select("instance_token")
      .eq("user_id", req.userId)
      .maybeSingle();

    if (!data?.instance_token) {
      return res.status(400).json({ error: "Conecte o WhatsApp primeiro." });
    }

    await evolution.sendText(data.instance_token, localPhone, message || "Teste do WashControl 👋");
    res.json({ ok: true });
  } catch (err) {
    console.error("WhatsApp send-test error:", err);
    res.status(502).json({ error: (err as Error).message });
  }
});

instancesRouter.post("/send-message", async (req: AuthedRequest, res) => {
  try {
    const { phone, text } = req.body ?? {};
    const localPhone = typeof phone === "string" ? toLocalPhone(phone) : "";
    if (!isValidBrazilianPhone(localPhone) || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Informe telefone e mensagem." });
    }

    const { data } = await supabaseAdmin
      .from("whatsapp_instance_credentials")
      .select("instance_token")
      .eq("user_id", req.userId)
      .maybeSingle();

    if (!data?.instance_token) {
      return res.status(400).json({ error: "Conecte o WhatsApp primeiro." });
    }

    await evolution.sendText(data.instance_token, localPhone, text);
    await recordMessage({ userId: req.userId!, phone: localPhone, direction: "outbound", body: text });
    res.json({ ok: true });
  } catch (err) {
    console.error("WhatsApp send-message error:", err);
    res.status(502).json({ error: (err as Error).message });
  }
});
