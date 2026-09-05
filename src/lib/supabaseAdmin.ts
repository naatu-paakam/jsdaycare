// Admin Supabase client — uses service role key for operations that need auto-confirmation
// SECURITY: This is an internal-only tool. Service role key is acceptable in this context.
// Do NOT use this client for user-facing data queries — use the anon client instead.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SECRET_KEY as string;

export const supabaseAdmin = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        storageKey: "supabase-admin-isolated", // isolated from regular client session
      },
      global: {
        // Explicitly set Authorization so non-JWT sb_secret_* keys work in browser
        headers: { Authorization: `Bearer ${SERVICE_KEY}` },
      },
    })
  : null;
