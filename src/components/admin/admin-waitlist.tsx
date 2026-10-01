"use client";

import { useEffect, useState } from "react";

import { Loader, PageLoader } from "@/components/loader";
import {
  fetchInvites,
  fetchWaitlist,
  inviteWaitlistEntry,
  rejectWaitlistEntry,
  revokeInvite,
} from "@/lib/admin-api";
import type { AdminInvite, WaitlistEntry } from "@/lib/admin-types";
import { readCookie } from "@/lib/browser-session";
import { countryFlag, countryName } from "@/lib/countries";

export function AdminWaitlistPage() {
  const token = readCookie("th_access");
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function reload() {
    const [w, i] = await Promise.all([fetchWaitlist(token), fetchInvites(token)]);
    setWaitlist(w);
    setInvites(i);
  }

  useEffect(() => {
    void reload()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load"))
      .finally(() => setLoading(false));
  }, [token]);

  async function invite(id: string) {
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const result = await inviteWaitlistEntry(token, id);
      await reload();
      const url = result?.invite?.url ?? "";
      if (url && typeof navigator !== "undefined") {
        await navigator.clipboard.writeText(`${window.location.origin}${url}`);
        setNotice("Invite created and link copied");
      } else {
        setNotice("Invite created");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not invite");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string, snooze: boolean) {
    const reason = window.prompt(snooze ? "Snooze reason" : "Reject reason") ?? "";
    if (!reason.trim()) return;
    setBusyId(id);
    try {
      await rejectWaitlistEntry(token, id, { reason: reason.trim(), snooze });
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update");
    } finally {
      setBusyId(null);
    }
  }

  async function revoke(id: string) {
    setBusyId(id);
    try {
      await revokeInvite(token, id);
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not revoke");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoader label="Loading waitlist" />;

  const pending = waitlist.filter((item) => item.status === "pending");

  return (
    <div className="px-5 py-6 md:px-8">
      <h1 className="font-display text-3xl">Waitlist & invites</h1>
      <p className="mt-1 text-sm text-muted-foreground">Approve creators and manage invite links.</p>
      {notice ? <p className="mt-4 text-sm text-foreground">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-primary">{error}</p> : null}

      <section className="mt-8">
        <h2 className="text-lg font-medium">Pending ({pending.length})</h2>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
          {pending.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">No pending applicants.</li>
          ) : (
            pending.map((entry) => (
              <li key={entry.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-medium">{entry.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.email} · {countryFlag(entry.country)} {countryName(entry.country)}
                  </p>
                  {entry.note ? <p className="mt-1 text-sm">{entry.note}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === entry.id}
                    onClick={() => void invite(entry.id)}
                    className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  >
                    {busyId === entry.id ? <Loader label="…" /> : "Invite"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === entry.id}
                    onClick={() => void reject(entry.id, true)}
                    className="rounded-full border border-border px-3 py-1.5 text-sm"
                  >
                    Snooze
                  </button>
                  <button
                    type="button"
                    disabled={busyId === entry.id}
                    onClick={() => void reject(entry.id, false)}
                    className="rounded-full border border-border px-3 py-1.5 text-sm"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">All waitlist</h2>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
          {waitlist.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{entry.name}</p>
                <p className="text-muted-foreground">{entry.email}</p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs uppercase tracking-wide">
                {entry.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Invites</h2>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
          {invites.map((invite) => (
            <li key={invite.id} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-medium">{invite.email}</p>
                <p className="text-muted-foreground">{invite.url}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs uppercase tracking-wide">
                  {invite.status}
                </span>
                {invite.status === "pending" ? (
                  <button
                    type="button"
                    disabled={busyId === invite.id}
                    onClick={() => void revoke(invite.id)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs"
                  >
                    Revoke
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
