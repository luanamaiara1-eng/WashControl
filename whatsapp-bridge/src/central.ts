import crypto from "node:crypto";
import { supabaseAdmin } from "./supabaseAdmin.js";
import * as evolution from "./evolution.js";

// Fixed name for the single, platform-wide WhatsApp number used to receive
// commands from authorized owners — distinct from each business's own
// number (whatsapp_instance_credentials), which only talks to their clients.
export const CENTRAL_INSTANCE_NAME = "wc_central";

function newInstanceToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function isAlreadyLoggedInError(error: unknown): boolean {
  return error instanceof Error && /already logged in/i.test(error.message);
}

interface CentralCredentials {
  token: string;
}

async function getOrCreateCentralCredentials(): Promise<CentralCredentials> {
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("evolution_settings")
    .select("central_instance_token")
    .eq("id", true)
    .maybeSingle();
  if (settingsError) throw settingsError;

  if (settings?.central_instance_token) {
    return { token: settings.central_instance_token };
  }

  // Recover a token if the instance already exists in Evolution Go (e.g.
  // after the bridge's database was reset but the instance wasn't).
  try {
    const all = await evolution.listInstances();
    const existing = (all.data ?? []).find((item) => item.name === CENTRAL_INSTANCE_NAME);
    if (existing?.id) {
      const info = await evolution.getInstanceInfo(existing.id);
      const token = info.data?.token;
      if (token) {
        await saveCentralToken(token);
        return { token };
      }
    }
  } catch (error) {
    console.error("Could not recover existing central Evolution Go token:", error);
  }

  const token = newInstanceToken();
  await saveCentralToken(token);
  return { token };
}

async function saveCentralToken(token: string) {
  const { error } = await supabaseAdmin
    .from("evolution_settings")
    .upsert({ id: true, central_instance_name: CENTRAL_INSTANCE_NAME, central_instance_token: token });
  if (error) throw error;
}

export async function getCentralStatus(): Promise<{ hasInstance: boolean; connected: boolean }> {
  const { data } = await supabaseAdmin.from("evolution_settings").select("central_instance_token").eq("id", true).maybeSingle();
  if (!data?.central_instance_token) return { hasInstance: false, connected: false };

  const state = await evolution.getConnectionState(data.central_instance_token);
  return { hasInstance: true, connected: state.instance?.state === "open" };
}

export async function connectCentral(): Promise<{ qrCode: string | null; pairingCode: string | null; alreadyConnected: boolean }> {
  const { token: instanceToken } = await getOrCreateCentralCredentials();

  let exists = false;
  try {
    const all = await evolution.listInstances();
    exists = (all.data ?? []).some((item) => item.name === CENTRAL_INSTANCE_NAME);
  } catch (error) {
    console.error("Failed to list Evolution Go instances:", error);
  }

  if (!exists) {
    await evolution.createInstance(CENTRAL_INSTANCE_NAME, instanceToken);
  }

  // Always (re)register the webhook — see instances.ts for why this must
  // happen before the already-connected early-return below.
  await evolution.connectInstance(CENTRAL_INSTANCE_NAME, instanceToken);

  if (exists) {
    const state = await evolution.getConnectionState(instanceToken).catch(() => null);
    if (state?.instance?.state === "open") {
      return { qrCode: null, pairingCode: null, alreadyConnected: true };
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

  return { qrCode: qr.base64 ?? null, pairingCode: qr.pairingCode ?? null, alreadyConnected };
}

/**
 * Fetches a fresh QR Code without re-registering the connection/webhook.
 * Used to keep the pairing dialog's QR from going stale — unlike
 * connectCentral(), this never calls connectInstance(), which would restart
 * the WhatsApp session and could kick a pairing that just succeeded.
 */
export async function refreshCentralQr(): Promise<{ qrCode: string | null; pairingCode: string | null; alreadyConnected: boolean }> {
  const { data } = await supabaseAdmin.from("evolution_settings").select("central_instance_token").eq("id", true).maybeSingle();
  if (!data?.central_instance_token) return { qrCode: null, pairingCode: null, alreadyConnected: false };

  const state = await evolution.getConnectionState(data.central_instance_token).catch(() => null);
  if (state?.instance?.state === "open") {
    return { qrCode: null, pairingCode: null, alreadyConnected: true };
  }

  try {
    const qr = await evolution.getConnectQrCode(data.central_instance_token);
    return { qrCode: qr.base64 ?? null, pairingCode: qr.pairingCode ?? null, alreadyConnected: false };
  } catch (error) {
    if (isAlreadyLoggedInError(error)) return { qrCode: null, pairingCode: null, alreadyConnected: true };
    throw error;
  }
}

export async function disconnectCentral(): Promise<void> {
  const { data } = await supabaseAdmin.from("evolution_settings").select("central_instance_token").eq("id", true).maybeSingle();
  if (data?.central_instance_token) {
    await evolution.logoutInstance(data.central_instance_token).catch((error) => {
      console.error("Evolution Go central logout failed (continuing anyway):", error);
    });
  }
}

/** The central instance's send token, for replying to a command — null if never connected. */
export async function getCentralInstanceToken(): Promise<string | null> {
  const { data } = await supabaseAdmin.from("evolution_settings").select("central_instance_token").eq("id", true).maybeSingle();
  return data?.central_instance_token ?? null;
}
