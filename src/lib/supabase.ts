import { createBrowserClient } from "@supabase/ssr";

let browser: ReturnType<typeof createBrowserClient> | null = null;

export function browserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || typeof window === "undefined") return null;
  browser ??= createBrowserClient(url, key);
  return browser;
}

export const googleReady = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
