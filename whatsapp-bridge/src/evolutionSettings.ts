import { supabaseAdmin } from "./supabaseAdmin.js";
import { config } from "./config.js";

export interface EvolutionSettings {
  baseUrl: string;
  apiKey: string;
  source: "database" | "env";
}

const CACHE_TTL_MS = 15_000;
let cache: (EvolutionSettings & { fetchedAt: number }) | null = null;

export function invalidateEvolutionSettingsCache() {
  cache = null;
}

/**
 * Resolves the Evolution Go base URL / admin API key, preferring the value
 * configured in Super Admin (evolution_settings table) and falling back to
 * the bridge's own .env — so self-hosted setups without the Super Admin UI
 * keep working.
 */
export async function getEvolutionSettings(): Promise<EvolutionSettings> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache;

  const { data } = await supabaseAdmin.from("evolution_settings").select("base_url, api_key").eq("id", true).maybeSingle();

  const resolved: EvolutionSettings = data?.base_url && data?.api_key
    ? { baseUrl: data.base_url.replace(/\/$/, ""), apiKey: data.api_key, source: "database" }
    : { baseUrl: config.evolutionBaseUrl ?? "", apiKey: config.evolutionApiKey ?? "", source: "env" };

  if (!resolved.baseUrl || !resolved.apiKey) {
    throw new Error(
      "EvolutionGo não está configurada. Configure a URL e a API Key em Super Admin > Evolution Go, ou defina EVOLUTION_BASE_URL/EVOLUTION_API_KEY no .env do bridge."
    );
  }

  cache = { ...resolved, fetchedAt: Date.now() };
  return cache;
}
