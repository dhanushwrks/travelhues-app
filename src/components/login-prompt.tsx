"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

export function LoginPrompt({
  open,
  onClose,
  title = "Sign in to continue",
  body = "Create a free traveler account or sign in to unlock the rest of Travelhues.",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  body?: string;
}) {
  const [next, setNext] = useState("/");

  useEffect(() => {
    if (!open) return;
    setNext(`${window.location.pathname}${window.location.search}`);
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#12232a]/40 px-5"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        className="grid w-full max-w-sm gap-4 rounded-3xl bg-card p-6 text-left"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-1">
          <h2 id="login-prompt-title" className="font-display text-2xl">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="rounded-full px-4 py-2 text-sm" onClick={onClose}>
            Not now
          </button>
          <Link
            href={`/login/user?next=${encodeURIComponent(next)}`}
            className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export function LoginGateButton({
  className,
  children,
  title,
  body,
}: {
  className?: string;
  children: ReactNode;
  title?: string;
  body?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <LoginPrompt open={open} onClose={() => setOpen(false)} title={title} body={body} />
    </>
  );
}

/** Full-card gate: looks like a link, opens sign-in instead of navigating. */
export function LoginGateCard({
  className,
  children,
  title,
  body,
  label,
}: {
  className?: string;
  children: ReactNode;
  title?: string;
  body?: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-label={label} className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <LoginPrompt open={open} onClose={() => setOpen(false)} title={title} body={body} />
    </>
  );
}
