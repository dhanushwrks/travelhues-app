"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ModerationConfirmSheet } from "@/components/admin/moderation-confirm-sheet";
import { PageLoader } from "@/components/loader";
import { fetchContent, moderateContent } from "@/lib/admin-api";
import type { AdminContentItem, ContentKind, ModerationReason } from "@/lib/admin-types";
import { readCookie } from "@/lib/browser-session";
import { formatInr } from "@/lib/format";

type Action = "unpublish" | "remove" | "restore" | null;

export function AdminContentPage() {
  const token = readCookie("th_access");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminContentItem | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function reload() {
    setItems(await fetchContent(token, { q, status, kind }));
  }

  useEffect(() => {
    void reload()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load content"))
      .finally(() => setLoading(false));
  }, [token]);

  async function confirm(input: { reason: ModerationReason; note: string }) {
    if (!selected || !action) return;
    setPending(true);
    try {
      await moderateContent(token, selected.kind, selected.id, action, input);
      await reload();
      setAction(null);
      setSelected(null);
    } finally {
      setPending(false);
    }
  }

  if (loading) return <PageLoader label="Loading content" />;

  return (
    <div className="px-5 py-6 md:px-8">
      <h1 className="font-display text-3xl">Content</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Unpublish or hard-remove stories, finds, plans, blogs, and hues.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search title or owner"
          className="h-10 min-w-[12rem] flex-1 rounded-xl border border-border bg-background px-3 text-sm"
        />
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
        >
          <option value="all">All kinds</option>
          <option value="story">Stories</option>
          <option value="spot">Finds</option>
          <option value="itinerary">Plans</option>
          <option value="blog">Blogs</option>
          <option value="hue">Hues</option>
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="live">Live</option>
          <option value="staff_unpublished">Staff unpublished</option>
          <option value="removed">Removed</option>
          <option value="archived">Archived</option>
        </select>
        <button
          type="button"
          onClick={() => void reload()}
          className="h-10 rounded-full bg-secondary px-4 text-sm font-medium"
        >
          Filter
        </button>
      </div>
      {error ? <p className="mt-4 text-sm text-primary">{error}</p> : null}
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
        {items.map((item) => (
          <li key={`${item.kind}-${item.id}`} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                {item.kind} · @{item.ownerUsername} · {item.country} · {item.status}
                {item.purchaseOnly ? ` · ${formatInr(item.priceInr ?? 0)}` : ""}
              </p>
              {item.publicPath ? (
                <Link href={item.publicPath} className="mt-1 inline-block text-sm text-primary">
                  Public link
                </Link>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {item.status === "live" || item.status === "archived" ? (
                <>
                  <button
                    type="button"
                    className="rounded-full border border-border px-3 py-1.5 text-sm"
                    onClick={() => {
                      setSelected(item);
                      setAction("unpublish");
                    }}
                  >
                    Unpublish
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                    onClick={() => {
                      setSelected(item);
                      setAction("remove");
                    }}
                  >
                    Hard remove
                  </button>
                </>
              ) : null}
              {item.status === "staff_unpublished" ? (
                <button
                  type="button"
                  className="rounded-full border border-border px-3 py-1.5 text-sm"
                  onClick={() => {
                    setSelected(item);
                    setAction("restore");
                  }}
                >
                  Restore
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <ModerationConfirmSheet
        open={Boolean(action && selected)}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setSelected(null);
          }
        }}
        title={
          action === "unpublish"
            ? `Unpublish “${selected?.title}”`
            : action === "remove"
              ? `Hard remove “${selected?.title}”`
              : `Restore “${selected?.title}”`
        }
        description={
          action === "remove"
            ? "Hard remove is not reversible. Public URLs will show not found."
            : action === "unpublish"
              ? "Hidden from Explore and public URLs. Creator cannot self-restore."
              : "Return this item to public discovery."
        }
        confirmLabel={
          action === "remove" ? "Hard remove" : action === "unpublish" ? "Unpublish" : "Restore"
        }
        pending={pending}
        onConfirm={confirm}
      />
    </div>
  );
}

export type { ContentKind };
