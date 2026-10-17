import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "wc_ref_code";

/** Reads ?ref= from the current URL, remembers it for signup, and logs a click. Safe to call on every public page mount. */
export async function captureReferralFromUrl() {
  const code = new URLSearchParams(window.location.search).get("ref");
  if (!code) return;

  const normalized = code.trim().toUpperCase();
  if (!normalized) return;

  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // Private browsing / storage disabled — the link still works for this
    // visit, it just won't survive navigating to a different page first.
  }

  const { data: referrer } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", normalized)
    .maybeSingle();
  if (!referrer) return;

  await supabase.from("referral_clicks").insert({ referrer_id: referrer.id }).then(
    () => {},
    () => {}
  );
}

export function getStoredRefCode(): string | undefined {
  try {
    return localStorage.getItem(STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
}

export function clearStoredRefCode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
