import { config } from "./config.js";
import { toWhatsAppNumber } from "./phone.js";
import { getEvolutionSettings } from "./evolutionSettings.js";

const EVOLUTION_TIMEOUT_MS = 15_000;

async function evolutionFetch(path: string, apiKey: string, init: RequestInit = {}): Promise<any> {
  const { baseUrl } = await getEvolutionSettings();

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", apikey: apiKey, ...init.headers },
      signal: AbortSignal.timeout(EVOLUTION_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error(`Evolution Go ${init.method ?? "GET"} ${path} não respondeu em ${EVOLUTION_TIMEOUT_MS / 1000}s.`);
    }
    throw err;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Evolution Go ${init.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }
  return res.status === 204 ? null : res.json();
}

async function evolutionAdminFetch(path: string, init: RequestInit = {}) {
  const { apiKey } = await getEvolutionSettings();
  return evolutionFetch(path, apiKey, init);
}

async function evolutionInstanceFetch(instanceToken: string, path: string, init: RequestInit = {}) {
  return evolutionFetch(path, instanceToken, init);
}

export interface EvolutionInstanceInfo {
  id?: string;
  name?: string;
  token?: string;
  connected?: boolean;
  jid?: string | null;
}

export async function createInstance(instanceName: string, instanceToken: string) {
  return evolutionAdminFetch("/instance/create", {
    method: "POST",
    body: JSON.stringify({ name: instanceName, token: instanceToken }),
  });
}

export async function listInstances(): Promise<{ data?: EvolutionInstanceInfo[] }> {
  return evolutionAdminFetch("/instance/all");
}

export async function getInstanceInfo(instanceId: string): Promise<{ data?: EvolutionInstanceInfo }> {
  return evolutionAdminFetch(`/instance/info/${encodeURIComponent(instanceId)}`);
}

export async function connectInstance(instanceName: string, instanceToken: string) {
  return evolutionInstanceFetch(instanceToken, "/instance/connect", {
    method: "POST",
    body: JSON.stringify({
      webhookUrl: `${config.bridgePublicUrl}/webhook/evolution/${instanceName}`,
      subscribe: ["MESSAGE", "CONNECTION", "QRCODE"],
    }),
  });
}

export async function getConnectQrCode(instanceToken: string): Promise<{ base64?: string; pairingCode?: string }> {
  const response = await evolutionInstanceFetch(instanceToken, "/instance/qr");
  const data = response?.data ?? response ?? {};
  // Evolution Go versions may serialize these fields with either lowercase
  // or uppercase initial letters. Accept both forms.
  const qrcode = data.qrcode ?? data.Qrcode;
  const code = data.code ?? data.Code;
  return {
    base64: qrcode
      ? String(qrcode).startsWith("data:") ? qrcode : `data:image/png;base64,${qrcode}`
      : undefined,
    pairingCode: code,
  };
}

export async function getConnectionState(instanceToken: string): Promise<{ state?: string; instance?: { state?: string } }> {
  const response = await evolutionInstanceFetch(instanceToken, "/instance/status");
  const data = response?.data ?? response ?? {};
  const state = data.loggedIn ? "open" : data.connected ? "connecting" : "close";
  return { state, instance: { state } };
}

export async function logoutInstance(instanceToken: string) {
  return evolutionInstanceFetch(instanceToken, "/instance/logout", { method: "DELETE", body: JSON.stringify({}) });
}

export async function sendText(instanceToken: string, localPhone: string, text: string) {
  return evolutionInstanceFetch(instanceToken, "/send/text", {
    method: "POST",
    body: JSON.stringify({ number: toWhatsAppNumber(localPhone), text }),
  });
}
