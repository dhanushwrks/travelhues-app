"use client";

import { useEffect, useState } from "react";

import { PageLoader } from "@/components/loader";
import { fetchPurchases, refundPurchase } from "@/lib/admin-api";
import type { AdminPurchase } from "@/lib/admin-types";
import { readCookie } from "@/lib/browser-session";
import { formatInr } from "@/lib/format";

export function AdminPurchasesPage() {
  const token = readCookie("th_access");
  const [purchases, setPurchases] = useState<AdminPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function reload() {
    setPurchases(await fetchPurchases(token));
  }

  useEffect(() => {
    void reload()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load purchases"))
      .finally(() => setLoading(false));
  }, [token]);

  function exportCsv() {
    const header = ["id", "buyer", "story", "kind", "item", "amountInr", "status", "createdAt"];
    const rows = purchases.map((item) =>
      [
        item.id,
        item.buyerUsername,
        item.storySlug,
        item.kind,
        item.itemTitle,
        item.amountInr,
        item.status,
        item.createdAt,
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "travelhues-purchases.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function refund(id: string) {
    const note = window.prompt("Refund note (required)") ?? "";
    if (!note.trim()) return;
    setBusy(id);
    try {
      await refundPurchase(token, id, note.trim());
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not refund");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <PageLoader label="Loading purchases" />;

  return (
    <div className="px-5 py-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Purchases</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ledger of unlocks. Refund when paid content is removed.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium"
        >
          Export CSV
        </button>
      </div>
      {error ? <p className="mt-4 text-sm text-primary">{error}</p> : null}
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
        {purchases.map((purchase) => (
          <li key={purchase.id} className="grid gap-2 px-4 py-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="font-medium">{purchase.itemTitle}</p>
              <p className="text-sm text-muted-foreground">
                @{purchase.buyerUsername} · {purchase.kind} · {purchase.storySlug} · {purchase.status}
              </p>
              <p className="mt-1 text-sm">{formatInr(purchase.amountInr)}</p>
            </div>
            {purchase.status === "completed" ? (
              <button
                type="button"
                disabled={busy === purchase.id}
                onClick={() => void refund(purchase.id)}
                className="rounded-full border border-border px-3 py-1.5 text-sm"
              >
                Refund
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
