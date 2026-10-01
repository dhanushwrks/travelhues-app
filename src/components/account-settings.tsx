"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiBase, apiMessage } from "@/lib/api";
import { clearSession, readCookie } from "@/lib/browser-session";
import { Loader } from "@/components/loader";

export function AccountSettings({
  hidden,
  creator = true,
  hasPassword = true,
}: {
  hidden: boolean;
  creator?: boolean;
  hasPassword?: boolean;
}) {
  const router = useRouter();
  const [isHidden, setHidden] = useState(hidden);
  const [passwordReady, setPasswordReady] = useState(hasPassword);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountAction, setAccountAction] = useState<"disable" | "delete" | "logout" | null>(null);
  const [accountPending, setAccountPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const settingPassword = !passwordReady;
  const passwordLabel = settingPassword ? "Set password" : "Change password";

  async function saveHidden(next: boolean) {
    setHidden(next);
    setError("");
    const response = await fetch(`${apiBase}/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${readCookie("th_access")}`,
      },
      body: JSON.stringify({ hidden: next }),
    });
    if (!response.ok) {
      setHidden(!next);
      setError(await apiMessage(response));
    }
  }

  function reviewPassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (password !== confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }
    if (!settingPassword && password === currentPassword) {
      setError("Choose a password that is different from the current one");
      return;
    }
    setReviewing(true);
  }

  async function savePassword() {
    setSaving(true);
    setError("");
    setNotice("");
    const response = await fetch(`${apiBase}/me/password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${readCookie("th_access")}`,
      },
      body: JSON.stringify(
        settingPassword
          ? { password, confirmPassword }
          : { currentPassword, password, confirmPassword },
      ),
    });
    setSaving(false);
    if (!response.ok) {
      setReviewing(false);
      setError(await apiMessage(response));
      return;
    }
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
    setChanging(false);
    setReviewing(false);
    setPasswordReady(true);
    setNotice(settingPassword ? "Password set" : "Password updated");
    router.refresh();
  }

  useEffect(() => {
    if (!reviewing) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) setReviewing(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reviewing, saving]);

  async function runAccountAction() {
    if (!accountAction) return;
    if (accountAction === "logout") {
      clearSession();
      router.push("/login");
      router.refresh();
      return;
    }
    setAccountPending(true);
    setError("");
    const disabling = accountAction === "disable";
    const response = await fetch(disabling ? `${apiBase}/me/disable` : `${apiBase}/me`, {
      method: disabling ? "POST" : "DELETE",
      headers: { Authorization: `Bearer ${readCookie("th_access")}` },
    });
    if (!response.ok) {
      setAccountPending(false);
      setAccountAction(null);
      setError(await apiMessage(response));
      return;
    }
    clearSession();
    router.push("/login");
    router.refresh();
  }

  return (
    <section className="mt-8 grid gap-4 border-t border-border pt-6">
      <h3 className="font-display text-2xl">Settings</h3>
      {creator ? (
        <label className="grid gap-1 text-sm">
          <span className="flex items-center justify-between gap-3 font-medium">
            Make profile hidden
            <input
              type="checkbox"
              checked={isHidden}
              onChange={(event) => void saveHidden(event.target.checked)}
            />
          </span>
          <span className="text-muted-foreground">Other people will not see your profile.</span>
        </label>
      ) : null}
      {changing ? (
        <form onSubmit={reviewPassword} className="grid gap-3">
          {settingPassword ? null : (
            <PasswordField
              label="Current password"
              value={currentPassword}
              autoComplete="current-password"
              onChange={setCurrentPassword}
            />
          )}
          <PasswordField
            label={settingPassword ? "Password" : "New password"}
            value={password}
            autoComplete="new-password"
            onChange={setPassword}
          />
          <PasswordField
            label={settingPassword ? "Confirm password" : "Confirm new password"}
            value={confirmPassword}
            autoComplete="new-password"
            onChange={setConfirmPassword}
          />
          <div className="flex gap-4">
            <button type="submit" className="text-sm font-medium">
              {settingPassword ? "Review password" : "Review change"}
            </button>
            <button
              type="button"
              className="text-sm text-muted-foreground"
              onClick={() => {
                setChanging(false);
                setError("");
                setCurrentPassword("");
                setPassword("");
                setConfirmPassword("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="justify-self-start text-sm font-medium underline" onClick={() => setChanging(true)}>
          {passwordLabel}
        </button>
      )}
      <p className="-mt-2 text-sm text-muted-foreground">
        {settingPassword
          ? "Add a password so you can also sign in with email."
          : "Asks for the current password, then confirms before it changes."}
      </p>
      {reviewing ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#12232a]/40 px-5"
          role="presentation"
          onClick={() => {
            if (!saving) setReviewing(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-confirm-title"
            className="grid w-full max-w-sm gap-4 rounded-3xl bg-card p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid gap-1">
              <h4 id="password-confirm-title" className="font-display text-2xl">
                {settingPassword ? "Set password?" : "Change password?"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {settingPassword
                  ? "You can keep using Google, and also sign in with email and this password."
                  : "The new password replaces the current one. Use it the next time you sign in."}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full px-4 py-2 text-sm"
                disabled={saving}
                onClick={() => setReviewing(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
                disabled={saving}
                onClick={() => void savePassword()}
              >
                {saving ? (
                  <Loader label={settingPassword ? "Setting" : "Changing"} className="size-4" />
                ) : (
                  passwordLabel
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className="justify-self-start text-sm font-medium underline"
        onClick={() => setAccountAction("disable")}
      >
        Disable account
      </button>
      <p className="-mt-2 text-sm text-muted-foreground">
        Hides your profile and what you published. Signing in again turns it back on.
      </p>
      <button
        type="button"
        className="justify-self-start text-sm font-medium text-primary underline"
        onClick={() => setAccountAction("delete")}
      >
        Delete account
      </button>
      <p className="-mt-2 text-sm text-muted-foreground">
        Marks your account and everything you published as deleted. You cannot sign in again.
      </p>
      {accountAction ? (
        <ConfirmDialog
          title={accountDialog[accountAction].title}
          body={accountDialog[accountAction].body}
          confirmLabel={accountDialog[accountAction].confirmLabel}
          pending={accountPending}
          pendingLabel={accountDialog[accountAction].pendingLabel}
          onCancel={() => {
            if (!accountPending) setAccountAction(null);
          }}
          onConfirm={() => void runAccountAction()}
        />
      ) : null}
      <button
        type="button"
        className="justify-self-start text-sm font-medium underline"
        onClick={() => setAccountAction("logout")}
      >
        Log out
      </button>
      {notice ? <p className="text-sm">{notice}</p> : null}
      {error ? <p className="text-sm text-primary">{error}</p> : null}
    </section>
  );
}

const accountDialog = {
  disable: {
    title: "Disable account?",
    body: "Your profile and the stories, finds, plans, blogs, and hues you published stay hidden until you sign in again.",
    confirmLabel: "Disable account",
    pendingLabel: "Disabling",
  },
  delete: {
    title: "Delete account?",
    body: "Your account and the content that belongs to it are marked deleted. Sign-in stops working for this account.",
    confirmLabel: "Delete account",
    pendingLabel: "Deleting",
  },
  logout: {
    title: "Log out?",
    body: "You will leave this account on this device. Sign in again when you want to come back.",
    confirmLabel: "Log out",
    pendingLabel: "Logging out",
  },
} as const;

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  pending,
  pendingLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  pending: boolean;
  pendingLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, pending]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#12232a]/40 px-5"
      role="presentation"
      onClick={() => {
        if (!pending) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-confirm-title"
        className="grid w-full max-w-sm gap-4 rounded-3xl bg-card p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-1">
          <h4 id="account-confirm-title" className="font-display text-2xl">
            {title}
          </h4>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="rounded-full px-4 py-2 text-sm" disabled={pending} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? <Loader label={pendingLabel} className="size-4" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  autoComplete,
  onChange,
}: {
  label: string;
  value: string;
  autoComplete: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span>{label}</span>
      <input
        type="password"
        required
        minLength={6}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none"
      />
    </label>
  );
}
