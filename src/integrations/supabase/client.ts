import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error("VITE_SUPABASE_URL is not defined in environment variables.");
}
if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "VITE_SUPABASE_ANON_KEY is not defined in environment variables.",
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
