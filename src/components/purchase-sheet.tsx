"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Loader } from "@/components/loader";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatInr } from "@/lib/format";
import { readDealAttribution } from "@/lib/deal-attribution";
import { purchaseContent, type PurchaseKind } from "@/lib/remote";
import { readCookie } from "@/lib/browser-session";

export function PurchaseLockBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute top-2 right-2 z-10 grid size-8 place-items-center rounded-full bg-white shadow-sm ${className}`}
      aria-hidden
    >
      <Lock className="size-3.5 text-foreground" strokeWidth={2.25} />
    </span>
  );
}

export function PurchaseSheet({
  open,
  onOpenChange,
  storySlug,
  kind,
  itemId,
  title,
  priceInr = 99,
  onPurchased,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storySlug: string;
  kind: PurchaseKind;
  itemId: string;
  title: string;
  priceInr?: number;
  onPurchased?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const token = readCookie("th_access");

  async function buy() {
    if (!token) {
      router.push("/login/user");
      return;
    }
    setPending(true);
    setError("");
    try {
      const sourceDealId = readDealAttribution();
      await purchaseContent(token, {
        storySlug,
        kind,
        itemId,
        ...(sourceDealId ? { sourceDealId } : {}),
      });
      onOpenChange(false);
      onPurchased?.();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not complete purchase");
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex flex-col gap-0 overflow-hidden rounded-t-3xl p-0 data-[side=bottom]:left-1/2 data-[side=bottom]:w-full data-[side=bottom]:max-w-[430px] data-[side=bottom]:-translate-x-1/2 md:data-[side=bottom]:max-w-xl"
      >
        <div className="border-b border-border px-5 pt-5 pr-12 pb-3">
          <SheetTitle className="text-lg font-medium">Purchase only</SheetTitle>
          <SheetDescription className="mt-1 text-sm text-muted-foreground">{title}</SheetDescription>
        </div>
        <div className="grid gap-4 px-5 py-5">
          <div className="flex gap-3 rounded-2xl bg-secondary p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-background">
              <Lock className="size-4" />
            </span>
            <p className="text-sm leading-6">
              This content is purchase only. Please purchase at {formatInr(priceInr)}.
            </p>
          </div>
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
              onClick={() => void buy()}
              disabled={pending}
              className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {pending ? <Loader label="Purchasing" /> : `Purchase · ${formatInr(priceInr)}`}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
