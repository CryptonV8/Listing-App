import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keeps startup explicit when env vars are missing.
  // This is expected before environment setup.
  console.warn("Supabase environment variables are not set yet.");
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");