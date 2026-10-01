import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { apiBase } from "@/lib/api";
import { supabaseKey, supabaseUrl } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const described = url.searchParams.get("error_description");
  if (described) return fail(url, described);
  if (!code) return fail(url, "Google did not return a sign-in code");

  const jar = await cookies();
  const pending: { name: string; value: string; options?: Record<string, unknown> }[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(cookiesToSet) {
        pending.push(...cookiesToSet);
      },
    },
  });

  const exchanged = await supabase.auth.exchangeCodeForSession(code);
  const token = exchanged.data.session?.access_token;
  if (exchanged.error || !token) {
    return fail(url, exchanged.error?.message || "Could not sign in");
  }

  const response = await fetch(`${apiBase}/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken: token }),
  });
  const payload = (await response.json().catch(() => null)) as {
    message?: string | string[];
    accessToken?: string;
    user?: { role: "tcc" | "traveler" | "admin"; username: string; displayName: string };
  } | null;
  if (!response.ok || !payload?.accessToken || !payload.user) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(" ")
      : payload?.message || "Could not sign in";
    return fail(url, message);
  }

  const home =
    payload.user.role === "admin" ? "/admin" : payload.user.role === "tcc" ? "/storefront" : "/";
  const dest = new URL(home, url.origin);
  const redirect = NextResponse.redirect(dest);
  for (const cookie of pending) {
    redirect.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  const maxAge = 60 * 60;
  const secure = url.protocol === "https:";
  const session = { path: "/", maxAge, sameSite: "lax" as const, secure };
  redirect.cookies.set("th_access", payload.accessToken, session);
  redirect.cookies.set("th_role", payload.user.role, session);
  redirect.cookies.set("th_username", payload.user.username, session);
  redirect.cookies.set("th_name", encodeURIComponent(payload.user.displayName), session);
  return redirect;
}

function fail(url: URL, message: string) {
  const dest = new URL("/login/user", url.origin);
  dest.searchParams.set("error", message.slice(0, 240));
  return NextResponse.redirect(dest);
}
