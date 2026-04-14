import { createClient } from "@supabase/supabase-js";

const defaultSupabaseUrl = "https://qogvqzihbcwhkmxedhnk.supabase.co";
const defaultSupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZ3ZxemloYmN3aGtteGVkaG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzgyMzcsImV4cCI6MjA5MTc1NDIzN30.G_u8U56cq8BXu2bPwfDcMdQDv-kgiG9z50GBEhY0dNI";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultSupabaseAnonKey;

export const supabaseConfigErrorMessage =
  "Supabase configuration is unavailable. Check your project URL and anon key.";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);