"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { ConsentCheckbox, consentRequiredMessage } from "@/components/consent-checkbox";
import { GoogleSignInButton } from "@/components/google-sign-in";
import { BackLink } from "@/components/back-link";
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
  const [consent, setConsent] = useState(false);
  const creator = intent === "tcc";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "signup" && !consent) {
      setError(consentRequiredMessage);
      return;
    }
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
    <div className="flex w-full flex-col">
      <div className="relative flex items-center justify-center px-5 pt-6">
        <BackLink href="/login" label="Choose user or creator" className="absolute left-5" />
        <Image
          src="/travelhues-logo.png"
          alt="Travelhues"
          width={374}
          height={102}
          className="h-12 w-fit"
        />
      </div>
      <form
        onSubmit={onSubmit}
        className="mx-auto grid w-full max-w-md gap-4 px-5 pt-8 pb-8 text-center"
      >
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="text-sm leading-6 text-muted-foreground">{lead}</p>
      {!creator && mode === "login" ? (
        <>
          <ConsentCheckbox
            id="google-legal-consent"
            required={false}
            checked={consent}
            onChange={(checked) => {
              setConsent(checked);
              if (checked) setError("");
            }}
          />
          <GoogleSignInButton
            allowed={consent}
            onBlocked={() => setError(consentRequiredMessage)}
            className="rounded-full border border-border bg-background px-4 py-3 text-sm font-medium"
          />
          <p className="text-center text-sm text-muted-foreground">or</p>
        </>
      ) : null}
      {mode === "signup" ? <Input name="displayName" label="Name" /> : null}
      <Input name="email" label="Email" type="email" />
      <Input name="password" label="Password" type="password" />
      {mode === "signup" ? (
        <ConsentCheckbox
          checked={consent}
          onChange={(checked) => {
            setConsent(checked);
            if (checked) setError("");
          }}
        />
      ) : null}
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || (mode === "signup" && !consent)}
        className="flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader label={mode === "signup" ? "Creating account" : "Signing in"} /> : mode === "signup" ? "Create account" : "Sign in"}
      </button>
      {creator ? (
        <div className="grid gap-3">
          <p className="text-center text-sm leading-6 text-muted-foreground">
            Are you a Travel Creator? Join the waitlist now.
          </p>
          <Link href="/join" className="rounded-full border border-border px-4 py-3 text-center text-sm font-medium">
            Join the waitlist
          </Link>
        </div>
      ) : mode === "signup" ? (
        <p className="text-center text-sm leading-6 text-muted-foreground">
          Already have an account? <Link href="/login/user" className="font-medium text-foreground">Sign in</Link>
        </p>
      ) : (
        <p className="text-center text-sm leading-6 text-muted-foreground">
          New to Travelhues? <Link href="/signup" className="font-medium text-foreground">Sign Up</Link>
        </p>
      )}
      </form>
    </div>
  );
}

function Input({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";

  return (
    <label className="grid gap-1 text-left text-sm">
      <span>{label}</span>
      <span className="relative block">
        <input
          name={name}
          type={password && visible ? "text" : type}
          required
          autoComplete={password ? "current-password" : "on"}
          className={`w-full rounded-2xl border border-border bg-background px-4 py-3 text-base ${password ? "pr-12" : ""}`}
        />
        {password ? (
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((value) => !value)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
          >
            {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        ) : null}
      </span>
    </label>
  );
}
