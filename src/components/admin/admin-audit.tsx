"use client";

import { useEffect, useState } from "react";

import { PageLoader } from "@/components/loader";
import { fetchAuditLog } from "@/lib/admin-api";
import type { AuditEntry } from "@/lib/admin-types";
import { readCookie } from "@/lib/browser-session";

export function AdminAuditPage() {
  const token = readCookie("th_access");
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchAuditLog(token)
      .then(setEntries)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load audit log"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <PageLoader label="Loading audit log" />;

  return (
    <div className="px-5 py-6 md:px-8">
      <h1 className="font-display text-3xl">Audit log</h1>
      <p className="mt-1 text-sm text-muted-foreground">Who did what, when, and why.</p>
      {error ? <p className="mt-4 text-sm text-primary">{error}</p> : null}
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
        {entries.length === 0 ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">No audit entries yet.</li>
        ) : (
          entries.map((entry) => (
            <li key={entry.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  {entry.action} · {entry.target}
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                by {entry.actor}
                {entry.reason ? ` · ${entry.reason}` : ""}
                {entry.note ? ` · ${entry.note}` : ""}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
