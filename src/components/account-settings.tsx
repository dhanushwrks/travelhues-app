"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiBase, apiMessage } from "@/lib/api";
import { clearSession, readCookie } from "@/lib/browser-session";

export function AccountSettings({ hidden, creator = true }: { hidden: boolean; creator?: boolean }) {
  const router = useRouter();
  const [isHidden, setHidden] = useState(hidden);
  const [password, setPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

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

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    const response = await fetch(`${apiBase}/me/password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${readCookie("th_access")}`,
      },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setError(await apiMessage(response));
      return;
    }
    setPassword("");
    setChanging(false);
    setNotice("Password updated");
  }

  async function removeAccount() {
    setError("");
    const response = await fetch(`${apiBase}/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${readCookie("th_access")}` },
    });
    if (!response.ok) {
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
        <form onSubmit={savePassword} className="grid gap-2">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-border bg-background px-4 py-3 text-sm"
            placeholder="New password"
          />
          <button type="submit" className="justify-self-start text-sm font-medium">
            Save password
          </button>
        </form>
      ) : (
        <button type="button" className="justify-self-start text-sm font-medium underline" onClick={() => setChanging(true)}>
          Change password
        </button>
      )}
      <p className="-mt-2 text-sm text-muted-foreground">Replaces the current password.</p>
      {confirming ? (
        <button type="button" className="justify-self-start text-sm font-medium text-primary" onClick={() => void removeAccount()}>
          Delete permanently
        </button>
      ) : (
        <button type="button" className="justify-self-start text-sm font-medium text-primary underline" onClick={() => setConfirming(true)}>
          Delete account
        </button>
      )}
      <p className="-mt-2 text-sm text-muted-foreground">This permanently deletes your account and cannot be undone.</p>
      <button
        type="button"
        className="justify-self-start text-sm font-medium underline"
        onClick={() => {
          clearSession();
          router.push("/login");
          router.refresh();
        }}
      >
        Log out
      </button>
      {notice ? <p className="text-sm">{notice}</p> : null}
      {error ? <p className="text-sm text-primary">{error}</p> : null}
    </section>
  );
}
