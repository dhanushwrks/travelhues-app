"use client";

import { useEffect, useState } from "react";

import { Loader, PageLoader } from "@/components/loader";
import {
  createCopyrightClaim,
  fetchCopyrightClaims,
  updateCopyrightClaim,
} from "@/lib/admin-api";
import type { ContentKind, CopyrightClaim } from "@/lib/admin-types";
import { readCookie } from "@/lib/browser-session";

export function AdminCopyrightPage() {
  const token = readCookie("th_access");
  const [claims, setClaims] = useState<CopyrightClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    claimantName: "",
    claimantEmail: "",
    workDescription: "",
    infringingUrl: "",
    targetKind: "blog" as ContentKind,
    targetId: "",
    targetLabel: "",
    goodFaith: true,
  });

  async function reload() {
    setClaims(await fetchCopyrightClaims(token));
  }

  useEffect(() => {
    void reload()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load claims"))
      .finally(() => setLoading(false));
  }, [token]);

  async function createClaim(event: React.FormEvent) {
    event.preventDefault();
    setBusy("create");
    setError("");
    setNotice("");
    try {
      await createCopyrightClaim(token, form);
      setForm({
        claimantName: "",
        claimantEmail: "",
        workDescription: "",
        infringingUrl: "",
        targetKind: "blog",
        targetId: "",
        targetLabel: "",
        goodFaith: true,
      });
      await reload();
      setNotice("Claim recorded");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create claim");
    } finally {
      setBusy(null);
    }
  }

  async function act(id: string, action: "delist" | "hard_remove" | "resolve" | "reject") {
    setBusy(id + action);
    try {
      await updateCopyrightClaim(token, id, { action, note: action });
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update claim");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <PageLoader label="Loading copyright claims" />;

  return (
    <div className="px-5 py-6 md:px-8">
      <h1 className="font-display text-3xl">Copyright</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter claims from email and expedite delist or hard remove.
      </p>
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-primary">{error}</p> : null}

      <form onSubmit={createClaim} className="mt-8 grid max-w-2xl gap-3 rounded-2xl border border-border p-4">
        <h2 className="text-lg font-medium">New claim</h2>
        <Field
          label="Claimant name"
          value={form.claimantName}
          onChange={(value) => setForm({ ...form, claimantName: value })}
          required
        />
        <Field
          label="Claimant email"
          type="email"
          value={form.claimantEmail}
          onChange={(value) => setForm({ ...form, claimantEmail: value })}
          required
        />
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Work description</span>
          <textarea
            required
            rows={3}
            value={form.workDescription}
            onChange={(event) => setForm({ ...form, workDescription: event.target.value })}
            className="rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
        <Field
          label="Infringing URL"
          value={form.infringingUrl}
          onChange={(value) => setForm({ ...form, infringingUrl: value })}
          required
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Target kind</span>
            <select
              value={form.targetKind}
              onChange={(event) => setForm({ ...form, targetKind: event.target.value as ContentKind })}
              className="h-11 rounded-xl border border-border bg-background px-3"
            >
              <option value="story">Story</option>
              <option value="spot">Find</option>
              <option value="itinerary">Plan</option>
              <option value="blog">Blog</option>
              <option value="hue">Hue</option>
              <option value="post">Post</option>
            </select>
          </label>
          <Field
            label="Target id"
            value={form.targetId}
            onChange={(value) => setForm({ ...form, targetId: value })}
            required
          />
          <Field
            label="Target label"
            value={form.targetLabel}
            onChange={(value) => setForm({ ...form, targetLabel: value })}
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.goodFaith}
            onChange={(event) => setForm({ ...form, goodFaith: event.target.checked })}
          />
          Good-faith statement recorded
        </label>
        <button
          type="submit"
          disabled={busy === "create"}
          className="rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy === "create" ? <Loader label="Saving" /> : "Create claim"}
        </button>
      </form>

      <ul className="mt-8 divide-y divide-border rounded-2xl border border-border">
        {claims.map((claim) => (
          <li key={claim.id} className="grid gap-3 px-4 py-4">
            <div>
              <p className="font-medium">
                {claim.targetLabel}{" "}
                <span className="text-muted-foreground">({claim.targetKind})</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {claim.claimantName} · {claim.claimantEmail} · {claim.status}
              </p>
              <p className="mt-2 text-sm">{claim.workDescription}</p>
              <p className="mt-1 text-sm text-muted-foreground">{claim.infringingUrl}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {claim.status === "received" ? (
                <>
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void act(claim.id, "delist")}
                    className="rounded-full border border-border px-3 py-1.5 text-sm"
                  >
                    Delist
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void act(claim.id, "hard_remove")}
                    className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                  >
                    Hard remove
                  </button>
                </>
              ) : null}
              {claim.status === "delisted" || claim.status === "received" ? (
                <>
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void act(claim.id, "resolve")}
                    className="rounded-full border border-border px-3 py-1.5 text-sm"
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void act(claim.id, "reject")}
                    className="rounded-full border border-border px-3 py-1.5 text-sm"
                  >
                    Reject
                  </button>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-border bg-background px-3"
      />
    </label>
  );
}
