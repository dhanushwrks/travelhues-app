import Link from "next/link";

import { DealsExplore } from "@/components/deals-explore";
import { fetchFlightDealsPage, loadMe } from "@/lib/remote";
import { getSession } from "@/lib/session";

export default async function DealsPage() {
  const session = await getSession();
  const person = session?.token ? await loadMe(session.token) : null;
  const origin = person?.homeAirport?.toUpperCase() ?? "";
  const firstPage = await fetchFlightDealsPage({
    origin: origin || undefined,
    limit: 5,
    offset: 0,
    sort: "featured",
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 px-5 pb-2 pt-8">
        <header className="grid gap-1">
          <h1 className="font-display text-2xl">Flight deals</h1>
          <p className="text-sm text-muted-foreground">
            Fares linked to destination stories. Filter by origin or sort by offer.
          </p>
        </header>
        {!origin && session ? (
          <p className="mt-3 text-sm">
            <Link href="/account/edit" className="font-medium text-primary underline">
              Add home airport
            </Link>{" "}
            to personalize the default filter.
          </p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-10">
        <DealsExplore
          initialOrigin={origin}
          initialItems={firstPage.items}
          initialHasMore={firstPage.hasMore}
        />
      </div>
    </div>
  );
}
