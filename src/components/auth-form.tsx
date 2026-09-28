"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiBase } from "@/lib/api";
import { saveSession, type AccountRole } from "@/lib/browser-session";
import { browserSupabase, googleReady } from "@/lib/supabase";

export function AuthForm({
  mode,
  intent,
}: {
  mode: "login" | "signup";
  intent: "traveler" | "tcc";
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const creator = intent === "tcc";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body =
      mode === "login"
        ? {
            email: form.get("email"),
            password: form.get("password"),
            intent,
          }
        : {
            email: form.get("email"),
            password: form.get("password"),
            displayName: form.get("displayName"),
            role: "traveler",
          };
    try {
      const response = await fetch(`${apiBase}/auth/${mode === "login" ? "login" : "signup"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        message?: string | string[];
        accessToken?: string;
        user?: { role: AccountRole; username: string; displayName: string };
      };
      if (!response.ok || !payload.accessToken || !payload.user) {
        setError(
          Array.isArray(payload.message)
            ? payload.message.join(" ")
            : payload.message || "Could not sign in",
        );
        return;
      }
      saveSession({ accessToken: payload.accessToken, user: payload.user });
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not reach Travelhues");
    } finally {
      setPending(false);
    }
  }

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

  return (
    <form onSubmit={onSubmit} className="grid gap-4 px-5 pt-10 pb-8">
      <Image src="/travelhues-logo.png" alt="Travelhues" width={374} height={102} className="h-12 w-fit" />
      <h1 className="font-display text-3xl">
        {mode === "signup" ? "Create an account" : creator ? "Creator sign in" : "Sign in"}
      </h1>
      <p className="text-sm leading-6 text-muted-foreground">
        {mode === "signup"
          ? "This account browses stories. Creators join the waitlist."
          : creator
            ? "Use the email from the invite that opened your creator account."
            : "Travelers browse stories. Creators write them."}
      </p>
      {mode === "signup" ? <Input name="displayName" label="Name" /> : null}
      <Input name="email" label="Email" type="email" />
      <Input name="password" label="Password" type="password" />
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Please wait" : mode === "signup" ? "Create account" : "Sign in"}
      </button>
      {mode === "login" && !creator && googleReady ? (
        <button
          type="button"
          onClick={continueWithGoogle}
          className="rounded-full border border-border px-4 py-3 text-sm"
        >
          Continue with Google
        </button>
      ) : null}
      <Link href="/login" className="text-sm text-muted-foreground">
        Other ways to sign in
      </Link>
    </form>
  );
}

function Input({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        required
        autoComplete={type === "password" ? "current-password" : "on"}
        className="rounded-2xl border border-border bg-background px-4 py-3"
      />
    </label>
  );
}
