"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiBase, apiMessage } from "@/lib/api";
import { saveSession, type AccountRole } from "@/lib/browser-session";
import { browserSupabase, googleReady } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = browserSupabase();
    if (!supabase) return;
    const params = new URLSearchParams(window.location.search);
    const described = params.get("error_description");
    const code = params.get("code");
    let active = true;
    void (async () => {
      if (described) {
        if (active) setError(described);
        return;
      }
      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.getSession();
      if (!active) return;
      const token = result.data.session?.access_token;
      if (result.error || !token) {
        setError(result.error?.message || "Google did not return a session");
        return;
      }
      const response = await fetch(`${apiBase}/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token }),
      });
      if (!response.ok) {
        setError(await apiMessage(response));
        return;
      }
      const payload = (await response.json()) as {
        accessToken: string;
        user: { role: AccountRole; username: string; displayName: string };
      };
      saveSession({ accessToken: payload.accessToken, user: payload.user });
      router.push(payload.user.role === "tcc" ? "/storefront" : "/");
      router.refresh();
    })();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="grid gap-3 px-5 pt-10">
      <h1 className="font-display text-3xl">
        {error || !googleReady ? "Could not sign in" : "Signing in"}
      </h1>
      <p className="text-sm leading-6 text-muted-foreground">
        {error || (googleReady ? "Checking the Google session." : "Google sign-in is not configured")}
      </p>
    </div>
  );
}
