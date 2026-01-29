import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export function createSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: req.headers.get("Authorization")! },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
