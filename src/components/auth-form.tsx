"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GoogleSignInButton } from "@/components/google-sign-in";
import { Loader } from "@/components/loader";
import { apiBase } from "@/lib/api";
import { saveSession, type AccountRole } from "@/lib/browser-session";

export function AuthForm({
  mode,
  intent,
  notice = "",
}: {
  mode: "login" | "signup";
  intent: "traveler" | "tcc";
  notice?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState(notice);
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
      router.push(payload.user.role === "tcc" ? "/storefront" : "/");
      router.refresh();
    } catch {
      setError("Could not reach Travelhues");
    } finally {
      setPending(false);
    }
  }

  const title = mode === "signup" ? "Create an account" : creator ? "Creator sign in" : "Sign in";
  const lead = creator
    ? "Use the email from the invite that opened your creator account."
    : mode === "signup"
      ? "This account browses stories."
      : "Browse stories from people who have already made the trip.";

  return (
    <form
      onSubmit={onSubmit}
      className={
        creator
          ? "grid w-full max-w-md gap-4 px-5 py-8 text-center"
          : "grid w-full gap-4 px-5 pt-10 pb-8 md:mx-auto md:max-w-md md:py-16"
      }
    >
      <Link href="/login" className="justify-self-start text-sm font-medium" aria-label="Choose user or creator">
        ←
      </Link>
      <Image
        src="/travelhues-logo.png"
        alt="Travelhues"
        width={374}
        height={102}
        className={creator ? "mx-auto h-12 w-fit" : "h-12 w-fit"}
      />
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="text-sm leading-6 text-muted-foreground">{lead}</p>
      {!creator && mode === "login" ? (
        <>
          <GoogleSignInButton className="rounded-full border border-border bg-background px-4 py-3 text-sm font-medium" />
          <p className="text-center text-sm text-muted-foreground">or</p>
        </>
      ) : null}
      {mode === "signup" ? <Input name="displayName" label="Name" /> : null}
      <Input name="email" label="Email" type="email" />
      <Input name="password" label="Password" type="password" />
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader label={mode === "signup" ? "Creating account" : "Signing in"} /> : mode === "signup" ? "Create account" : "Sign in"}
      </button>
      {creator ? (
        <div className="grid gap-3">
          <p className="text-center text-sm leading-6 text-muted-foreground">
            New to Travelhues? Join the waitlist now. Join as a creator.
          </p>
          <Link href="/join" className="rounded-full border border-border px-4 py-3 text-center text-sm font-medium">
            Join the waitlist
          </Link>
        </div>
      ) : mode === "signup" ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Writing stories? <Link href="/join" className="font-medium text-foreground">Join the waitlist</Link>
        </p>
      ) : (
        <p className="text-center text-sm leading-6 text-muted-foreground">
          New to Travelhues? <Link href="/signup" className="font-medium text-foreground">Sign Up</Link>
        </p>
      )}
    </form>
  );
}

function Input({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <label className="grid gap-1 text-left text-sm">
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
