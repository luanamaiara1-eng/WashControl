import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

// Service-role client: bypasses RLS, used server-side only. Never expose
// this key to the frontend.
export const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
