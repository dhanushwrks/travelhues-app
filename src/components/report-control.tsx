"use client";

import { Flag } from "lucide-react";
import { useState } from "react";

import { Loader } from "@/components/loader";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { submitReport } from "@/lib/admin-api";
import { reportCategories, type ContentKind, type ReportCategory } from "@/lib/admin-types";
import { readCookie } from "@/lib/browser-session";

export function ReportControl({
  targetKind,
  targetId,
  targetLabel,
  targetOwnerUsername,
  targetOwnerRole,
  className = "",
}: {
  targetKind: ContentKind;
  targetId: string;
  targetLabel: string;
  targetOwnerUsername: string;
  targetOwnerRole: "tcc" | "traveler";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory>("spam");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function send() {
    setPending(true);
    setError("");
    try {
      await submitReport(readCookie("th_access") || undefined, {
        category,
        details: details.trim(),
        targetKind,
        targetId,
        targetLabel,
        targetOwnerUsername,
        targetOwnerRole,
      });
      setDone(true);
      setDetails("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit report");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setDone(false);
          setError("");
        }}
        className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground ${className}`}
        aria-label="Report"
      >
        <Flag className="size-3.5" />
        Report
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="flex flex-col gap-0 overflow-hidden rounded-t-3xl p-0 data-[side=bottom]:left-1/2 data-[side=bottom]:w-full data-[side=bottom]:max-w-[430px] data-[side=bottom]:-translate-x-1/2 md:data-[side=bottom]:max-w-xl"
        >
          <div className="border-b border-border px-5 pt-5 pr-12 pb-3">
            <SheetTitle className="text-lg font-medium">Report</SheetTitle>
            <SheetDescription className="mt-1 text-sm text-muted-foreground">{targetLabel}</SheetDescription>
          </div>
          <div className="grid gap-4 px-5 py-5">
            {done ? (
              <p className="text-sm">Thanks — the desk will review this.</p>
            ) : (
              <>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Why are you reporting this?</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as ReportCategory)}
                    className="h-11 rounded-xl border border-border bg-background px-3"
                  >
                    {reportCategories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Details</span>
                  <textarea
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    rows={3}
                    className="rounded-xl border border-border bg-background px-3 py-2"
                    placeholder="Optional context for the review team"
                  />
                </label>
                {error ? <p className="text-sm text-primary">{error}</p> : null}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void send()}
                  className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {pending ? <Loader label="Sending" /> : "Submit report"}
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
