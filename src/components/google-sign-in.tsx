"use client";

import { useState } from "react";

import { Loader } from "@/components/loader";
import { browserSupabase } from "@/lib/supabase";

export function GoogleSignInButton({
  className,
  allowed = true,
  onBlocked,
}: {
  className?: string;
  allowed?: boolean;
  onBlocked?: () => void;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function continueWithGoogle() {
    setError("");
    if (!allowed) {
      onBlocked?.();
      return;
    }
    setPending(true);
    const supabase = browserSupabase();
    if (!supabase) {
      setPending(false);
      setError("Google sign-in is not configured");
      return;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setPending(false);
      setError(oauthError.message);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={pending}
        className={`flex items-center justify-center gap-2 disabled:opacity-60 ${className ?? ""}`}
      >
        {pending ? <Loader label="Opening Google" /> : <><GoogleMark />Continue with Google</>}
      </button>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="size-4">
      <path
        fill="#EA4335"
        d="M9 7.2v3.5h4.9c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.8-1.6 2.8-4 2.8-6.8 0-.6 0-1.2-.1-1.8H9z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.4 0 4.5-.8 6-2.2l-3-2.3c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7L.9 13c1.5 3 4.6 5 8.1 5z"
      />
      <path
        fill="#4A90E2"
        d="M4 10.7A5.4 5.4 0 0 1 4 7.3L.9 5A9 9 0 0 0 0 9c0 1.4.3 2.8.9 4l3.1-2.3z"
      />
      <path
        fill="#FBBC05"
        d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6C13.5.9 11.4 0 9 0 5.5 0 2.4 2 .9 5L4 7.3C4.7 5.2 6.7 3.6 9 3.6z"
      />
    </svg>
  );
}
