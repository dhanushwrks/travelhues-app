import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qiwhjjeaidwxhlnsmiug.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_AlMmgjgGpi4ySV74Q6kjHw_eJ61s0Lw";

let browser: ReturnType<typeof createBrowserClient> | null = null;

export function browserSupabase() {
  if (typeof window === "undefined") return null;
  browser ??= createBrowserClient(supabaseUrl, supabaseKey);
  return browser;
}

export const googleReady = Boolean(supabaseUrl && supabaseKey);

export { supabaseKey, supabaseUrl };
