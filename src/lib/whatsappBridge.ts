import { supabase } from "@/integrations/supabase/client";

const BRIDGE_URL = (import.meta.env.VITE_WHATSAPP_BRIDGE_URL as string | undefined)?.replace(/\/$/, "");

export interface WhatsAppStatus {
  hasInstance: boolean;
  connected: boolean;
  instanceName?: string;
}

export interface WhatsAppConnectResult {
  instanceName: string;
  qrCode: string | null;
  pairingCode: string | null;
  alreadyConnected?: boolean;
}

async function authedFetch(path: string, init: RequestInit = {}) {
  if (!BRIDGE_URL) {
    throw new Error("VITE_WHATSAPP_BRIDGE_URL não está configurada.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sessão expirada, faça login novamente.");

  const res = await fetch(`${BRIDGE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Falha na requisição (${res.status})`);
  return body;
}

export const isWhatsAppBridgeConfigured = () => Boolean(BRIDGE_URL);

export const getWhatsAppStatus = (): Promise<WhatsAppStatus> => authedFetch("/api/whatsapp/status");

export const connectWhatsApp = (): Promise<WhatsAppConnectResult> =>
  authedFetch("/api/whatsapp/connect", { method: "POST" });

export const disconnectWhatsApp = (): Promise<{ ok: true }> =>
  authedFetch("/api/whatsapp/disconnect", { method: "POST" });

export const sendTestWhatsAppMessage = (phone: string, message: string): Promise<{ ok: true }> =>
  authedFetch("/api/whatsapp/send-test", { method: "POST", body: JSON.stringify({ phone, message }) });

export const testEvolutionConnection = (): Promise<{ ok: boolean; error?: string }> =>
  authedFetch("/api/admin/evolution/test", { method: "POST" });
