"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { BackLink } from "@/components/back-link";
import { Loader } from "@/components/loader";
import { loginAdmin } from "@/lib/admin-api";
import { saveSession } from "@/lib/browser-session";

export function AdminLoginForm({ notice = "" }: { notice?: string }) {
  const router = useRouter();
  const [error, setError] = useState(notice);
  const [pending, setPending] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    try {
      const session = await loginAdmin(email, password);
      saveSession({ accessToken: session.accessToken, user: session.user });
      router.push("/admin");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full flex-col">
      <div className="relative flex items-center justify-center px-5 pt-6">
        <BackLink href="/login" label="All sign-in options" className="absolute left-5" />
        <Image src="/travelhues-logo.png" alt="Travelhues" width={374} height={102} className="h-10 w-fit" />
      </div>
      <div className="mx-auto w-full max-w-md px-5 pt-10 pb-16">
        <h1 className="font-display text-3xl">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Staff access for analytics, trust & safety, and platform settings.
        </p>
        <form onSubmit={onSubmit} className="mt-8 grid gap-4">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              defaultValue="admin@travelhues.in"
              className="h-11 rounded-xl border border-border bg-background px-3"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Password</span>
            <span className="relative">
              <input
                name="password"
                type={show ? "text" : "password"}
                required
                autoComplete="current-password"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 pr-11"
              />
              <button
                type="button"
                onClick={() => setShow((value) => !value)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </span>
          </label>
          {error ? <p className="text-sm text-primary">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {pending ? <Loader label="Signing in" /> : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Traveler or creator?{" "}
          <Link href="/login" className="font-medium text-primary">
            Choose account type
          </Link>
        </p>
      </div>
    </div>
  );
}
