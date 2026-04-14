import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigErrorMessage =
  "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deploy environment.";

if (!hasSupabaseEnv) {
  console.warn(supabaseConfigErrorMessage);
}

const fallbackUrl = "https://placeholder.supabase.co";
const fallbackAnonKey = "placeholder-anon-key";

export const supabase = createClient(
  hasSupabaseEnv ? supabaseUrl : fallbackUrl,
  hasSupabaseEnv ? supabaseAnonKey : fallbackAnonKey,
);

export const isSupabaseConfigured = hasSupabaseEnv;