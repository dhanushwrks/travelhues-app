import { redirect } from "next/navigation";
import Link from "next/link";

import { DestinationCard } from "@/components/destination-card";
import { countryName } from "@/lib/countries";
import { emptyLibrary } from "@/lib/marks";
import { loadEnabledCountries, loadLibrary, loadStories } from "@/lib/remote";
import { requireSession } from "@/lib/session";

export default async function DestinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const session = await requireSession();
  if (session.role === "tcc") redirect("/storefront");
  const { country = "" } = await searchParams;
  const code = country.toUpperCase();
  const [countries, stories, library] = await Promise.all([
    loadEnabledCountries(),
    loadStories(session.token),
    loadLibrary(session.token),
  ]);
  const selected = countries.find((item) => item.code === code);
  const place = selected?.name ?? "";
  const destinations = (stories ?? [])
    .filter((story) => {
      if (!code) return true;
      const stored = story.destination.country;
      return stored.toUpperCase() === code || stored.toLowerCase() === place.toLowerCase();
    })
    .filter((story) => story.itineraries.length > 0)
    .sort((a, b) => b.itineraries.length - a.itineraries.length);
  const marks = library ?? emptyLibrary;

  return (
    <div className="h-full overflow-y-auto px-5 pt-6 pb-10">
      <Link href={selected ? `/?country=${code}` : "/"} className="text-sm font-medium">
        Explore
      </Link>
      <h1 className="mt-3 font-display text-3xl">Top destinations</h1>
      {selected ? <p className="mt-1 text-sm text-muted-foreground">{countryName(code)}</p> : null}
      {destinations.length === 0 ? (
        <p className="pt-8 text-sm text-muted-foreground">No destinations with itineraries yet.</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {destinations.map((story) => (
            <li key={story.slug}>
              <DestinationCard story={story} library={marks} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
