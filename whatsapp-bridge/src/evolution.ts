import { config } from "./config.js";
import { toWhatsAppNumber } from "./phone.js";

/**
 * Thin REST client for EvolutionGo (and Evolution API, which it mirrors).
 * These paths follow the standard Evolution API convention. If your
 * EvolutionGo build exposes different routes, check its /docs (Swagger)
 * and adjust the paths below — everything else in the bridge is agnostic
 * to this detail.
 */

async function evolutionFetch(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${config.evolutionBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: config.evolutionApiKey,
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Evolution API ${init.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }

  return res.status === 204 ? null : res.json();
}

export async function createInstance(instanceName: string) {
  return evolutionFetch("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });
}

export async function setInstanceWebhook(instanceName: string) {
  return evolutionFetch(`/webhook/set/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      webhook: {
        url: `${config.bridgePublicUrl}/webhook/evolution/${instanceName}`,
        enabled: true,
        events: ["MESSAGES_UPSERT"],
      },
    }),
  });
}

export async function getConnectQrCode(instanceName: string): Promise<{ base64?: string; pairingCode?: string }> {
  return evolutionFetch(`/instance/connect/${instanceName}`);
}

export async function getConnectionState(instanceName: string): Promise<{ state?: string; instance?: { state?: string } }> {
  return evolutionFetch(`/instance/connectionState/${instanceName}`);
}

export async function logoutInstance(instanceName: string) {
  return evolutionFetch(`/instance/logout/${instanceName}`, { method: "DELETE" });
}

export async function sendText(instanceName: string, localPhone: string, text: string) {
  return evolutionFetch(`/message/sendText/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      number: toWhatsAppNumber(localPhone),
      text,
    }),
  });
}
