"use client";

import { useEffect, useMemo, useState } from "react";

import { ModerationConfirmSheet } from "@/components/admin/moderation-confirm-sheet";
import { PageLoader } from "@/components/loader";
import { fetchReports, updateReport } from "@/lib/admin-api";
import type { AdminReport, ModerationReason } from "@/lib/admin-types";
import { readCookie } from "@/lib/browser-session";

type CaseAction =
  | "dismiss"
  | "warn"
  | "unpublish"
  | "remove"
  | "suspend"
  | "block"
  | "escalate_copyright"
  | null;

export function AdminReportsPage() {
  const token = readCookie("th_access");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("open");
  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [action, setAction] = useState<CaseAction>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function reload() {
    setReports(await fetchReports(token));
  }

  useEffect(() => {
    void reload()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load reports"))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(
    () =>
      reports.filter((report) => {
        if (category !== "all" && report.category !== category) return false;
        if (status === "open") return report.status === "open" || report.status === "in_review";
        if (status !== "all" && report.status !== status) return false;
        return true;
      }),
    [reports, category, status],
  );

  async function run(next: CaseAction, report: AdminReport, input?: { reason: ModerationReason; note: string }) {
    setPending(true);
    try {
      if (next === "dismiss" || next === "warn" || next === "escalate_copyright") {
        await updateReport(token, report.id, {
          action: next,
          reason: input?.reason ?? "other",
          note: input?.note ?? next,
        });
      } else if (next) {
        await updateReport(token, report.id, {
          action: next,
          reason: input?.reason ?? "other",
          note: input?.note ?? "",
        });
      }
      await reload();
      setAction(null);
      setSelected(null);
    } finally {
      setPending(false);
    }
  }

  if (loading) return <PageLoader label="Loading reports" />;

  return (
    <div className="px-5 py-6 md:px-8">
      <h1 className="font-display text-3xl">Reports</h1>
      <p className="mt-1 text-sm text-muted-foreground">Triage community reports within 48 hours.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
        >
          <option value="open">Open</option>
          <option value="actioned">Actioned</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
        >
          <option value="all">All categories</option>
          <option value="spam">Spam</option>
          <option value="misleading">Misleading</option>
          <option value="inappropriate">Inappropriate</option>
          <option value="harassment">Harassment</option>
          <option value="copyright">Copyright</option>
          <option value="other">Other</option>
        </select>
      </div>
      {error ? <p className="mt-4 text-sm text-primary">{error}</p> : null}
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
        {filtered.length === 0 ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">No reports in this view.</li>
        ) : (
          filtered.map((report) => (
            <li key={report.id} className="grid gap-3 px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {report.targetLabel}{" "}
                    <span className="text-muted-foreground">({report.targetKind})</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {report.category} · by @{report.reporterUsername} · owner @{report.targetOwnerUsername} (
                    {report.targetOwnerRole}) · {report.status}
                  </p>
                  {report.details ? <p className="mt-2 text-sm">{report.details}</p> : null}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(report.createdAt).toLocaleString()}
                </span>
              </div>
              {report.status === "open" || report.status === "in_review" ? (
                <div className="flex flex-wrap gap-2">
                  <CaseButton label="Dismiss" onClick={() => void run("dismiss", report)} />
                  <CaseButton label="Warn" onClick={() => void run("warn", report)} />
                  <CaseButton
                    label="Unpublish"
                    onClick={() => {
                      setSelected(report);
                      setAction("unpublish");
                    }}
                  />
                  <CaseButton
                    label="Hard remove"
                    onClick={() => {
                      setSelected(report);
                      setAction("remove");
                    }}
                  />
                  <CaseButton
                    label="Suspend owner"
                    onClick={() => {
                      setSelected(report);
                      setAction("suspend");
                    }}
                  />
                  <CaseButton
                    label="Block owner"
                    tone="danger"
                    onClick={() => {
                      setSelected(report);
                      setAction("block");
                    }}
                  />
                  {report.category === "copyright" ? (
                    <CaseButton
                      label="Escalate copyright"
                      onClick={() => void run("escalate_copyright", report)}
                    />
                  ) : null}
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>

      <ModerationConfirmSheet
        open={Boolean(action && selected && ["unpublish", "remove", "suspend", "block"].includes(action))}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setSelected(null);
          }
        }}
        title={action ? `${action} · ${selected?.targetLabel}` : "Confirm"}
        description="This closes the report as actioned and writes an audit entry."
        confirmLabel="Confirm"
        pending={pending}
        onConfirm={(input) => run(action, selected!, input)}
      />
    </div>
  );
}

function CaseButton({
  label,
  onClick,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm ${
        tone === "danger" ? "bg-primary text-primary-foreground" : "border border-border"
      }`}
    >
      {label}
    </button>
  );
}
