"use client";

import { useState } from "react";

import { Loader } from "@/components/loader";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { moderationReasons, type ModerationReason } from "@/lib/admin-types";

export function ModerationConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  impact,
  confirmLabel,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  impact?: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: (input: { reason: ModerationReason; note: string }) => Promise<void> | void;
}) {
  const [reason, setReason] = useState<ModerationReason>("tos");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!note.trim()) {
      setError("Add a short note for the audit log");
      return;
    }
    try {
      await onConfirm({ reason, note: note.trim() });
      setNote("");
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not complete action");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex flex-col gap-0 overflow-hidden rounded-t-3xl p-0 data-[side=bottom]:left-1/2 data-[side=bottom]:w-full data-[side=bottom]:max-w-xl data-[side=bottom]:-translate-x-1/2"
      >
        <div className="border-b border-border px-5 pt-5 pr-12 pb-3">
          <SheetTitle className="text-lg font-medium">{title}</SheetTitle>
          <SheetDescription className="mt-1 text-sm text-muted-foreground">{description}</SheetDescription>
        </div>
        <div className="grid gap-4 px-5 py-5">
          {impact ? (
            <p className="rounded-2xl bg-secondary px-4 py-3 text-sm leading-6">{impact}</p>
          ) : null}
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Reason</span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as ModerationReason)}
              className="h-11 rounded-xl border border-border bg-background px-3"
            >
              {moderationReasons.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="What happened and why this action"
              className="rounded-xl border border-border bg-background px-3 py-2"
            />
          </label>
          {error ? <p className="text-sm text-primary">{error}</p> : null}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              className="rounded-full border border-border py-3 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={pending}
              className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {pending ? <Loader label="Working" /> : confirmLabel}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
