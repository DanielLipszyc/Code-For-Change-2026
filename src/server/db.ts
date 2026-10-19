import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Auth is handled by Clerk, so all DB access goes through API routes and server
// components using the secret key (bypasses RLS). The "server-only" import makes
// the build fail if a client component ever imports this file.
export const supabase = createClient(env.supabaseUrl, env.supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
