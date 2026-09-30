import Image from "next/image";
import { redirect } from "next/navigation";

import { CountrySearch } from "@/components/country-search";
import { DestinationCard } from "@/components/destination-card";
import { GlimpseRow } from "@/components/glimpse-row";
import { countryName } from "@/lib/countries";
import { emptyLibrary } from "@/lib/marks";
import { loadEnabledCountries, loadGlimpses, loadLibrary, loadStories } from "@/lib/remote";
import { requireSession } from "@/lib/session";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const session = await requireSession();
  if (session.role === "tcc") redirect("/storefront");
  const { country = "" } = await searchParams;
  const code = country.toUpperCase();
  const [countries, stories, glimpses, library] = await Promise.all([
    loadEnabledCountries(),
    loadStories(session.token),
    loadGlimpses(session.token, code || undefined),
    loadLibrary(session.token),
  ]);
  const selected = countries.find((item) => item.code === code);
  const place = selected?.name ?? "";
  const visibleStories = (stories ?? []).filter((story) => {
    if (!code) return true;
    const stored = story.destination.country;
    return stored.toUpperCase() === code || stored.toLowerCase() === place.toLowerCase();
  });
  const destinations = visibleStories
    .filter((story) => story.itineraries.length > 0)
    .sort((a, b) => b.itineraries.length - a.itineraries.length);
  const traveler = session.role === "traveler";
  const marks = library ?? emptyLibrary;
  const first = session.displayName.split(" ")[0] || "there";

  return (
    <div className="h-full overflow-y-auto pb-8">
      <header className="grid gap-4 px-5 pt-8">
        <div className="flex items-center gap-3">
          <Image src="/travelhues-mark.png" alt="" width={36} height={36} />
          <div>
            <h1 className="font-display text-3xl">Hi, {first}</h1>
            <p className="text-sm text-muted-foreground">Where are you wandering today?</p>
          </div>
        </div>
        <CountrySearch countries={countries} selected={selected ? code : ""} />
      </header>
      <section className="mt-8 grid gap-3">
        <div className="px-5">
          <h2 className="font-display text-2xl">Shorts</h2>
        </div>
        <GlimpseRow glimpses={glimpses ?? []} country={selected ? code : ""} />
      </section>
      <section className="mt-8 grid gap-4 px-5 md:grid-cols-2 xl:grid-cols-3">
        <h2 className="font-display text-2xl md:col-span-2 xl:col-span-3">Top destinations</h2>
        {destinations.length === 0 ? (
          <p className="text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
            {place ? `No itineraries in ${countryName(code)} yet.` : "No destinations with itineraries yet."}
          </p>
        ) : (
          destinations.map((story) => (
            <DestinationCard key={story.slug} story={story} traveler={traveler} library={marks} />
          ))
        )}
      </section>
    </div>
  );
}
