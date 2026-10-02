import Link from "next/link";

import { formatInr } from "@/lib/format";
import type { PublicFlightDeal } from "@/lib/types";

export function FlightDealCard({
  deal,
  compact = false,
}: {
  deal: PublicFlightDeal;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/deals/${deal.id}`}
      className={
        compact
          ? "block rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm transition-colors hover:bg-muted/40"
          : "block rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm transition-colors hover:bg-muted/40"
      }
    >
      <p
        className={
          compact
            ? "font-display text-base leading-tight tracking-tight"
            : "font-display text-lg leading-tight tracking-tight"
        }
      >
        {deal.originIata} → {deal.destinationIata}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">
        From {formatInr(deal.priceInr)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {deal.travelMonthLabel} · {deal.tripDays} {deal.tripDays === 1 ? "day" : "days"}
      </p>
      {!compact && deal.offerPercent > 0 ? (
        <p className="mt-1 text-[11px] font-medium text-primary">{deal.offerPercent}% off</p>
      ) : null}
    </Link>
  );
}
