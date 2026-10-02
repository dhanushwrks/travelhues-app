import Link from "next/link";

import { FlightDealCard } from "@/components/flight-deal-card";
import { loadFlightDeals, loadMe } from "@/lib/remote";
import { getSession } from "@/lib/session";

export default async function DealsPage() {
  const session = await getSession();
  const person = session?.token ? await loadMe(session.token) : null;
  const origin = person?.homeAirport?.toUpperCase() ?? "";
  const deals = (await loadFlightDeals(origin || undefined, 40)) ?? [];

  return (
    <div className="h-full overflow-y-auto px-5 pb-10 pt-8">
      <header className="grid gap-2">
        <h1 className="font-display text-3xl">Flight deals</h1>
        <p className="text-sm text-muted-foreground">
          {origin
            ? `Fares from ${origin} linked to destination stories.`
            : "Set your home airport to personalize deals."}
        </p>
      </header>
      {!origin && session ? (
        <p className="mt-4 text-sm">
          <Link href="/account/edit" className="font-medium underline">
            Add home airport in profile
          </Link>
        </p>
      ) : null}
      <ul className="mt-6 grid gap-4">
        {deals.map((deal) => (
          <li key={deal.id}>
            <FlightDealCard deal={deal} />
          </li>
        ))}
      </ul>
      {deals.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No active deals for this city yet.</p>
      ) : null}
    </div>
  );
}
