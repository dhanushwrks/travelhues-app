"use client";

import { useState } from "react";

import { browserSupabase, googleReady } from "@/lib/supabase";

export function GoogleSignInButton({ className }: { className?: string }) {
  const [error, setError] = useState("");

  async function continueWithGoogle() {
    setError("");
    const supabase = browserSupabase();
    if (!supabase) {
      setError("Google sign-in is not configured");
      return;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) setError(oauthError.message);
  }

  if (!googleReady) return null;

  return (
    <div className="grid gap-2">
      <button type="button" onClick={continueWithGoogle} className={className}>
        Continue with Google
      </button>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
    </div>
  );
}
