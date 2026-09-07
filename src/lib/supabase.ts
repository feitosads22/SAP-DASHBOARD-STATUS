import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured =
  Boolean(url) && Boolean(anonKey) &&
  !url.includes("SEU-PROJETO") &&
  !anonKey.includes("SUA_ANON_KEY");

export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key"
);