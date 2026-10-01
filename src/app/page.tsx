import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { CountrySearch } from "@/components/country-search";
import { CreatorCard } from "@/components/creator-card";
import { DestinationCard } from "@/components/destination-card";
import { GlimpseRow } from "@/components/glimpse-row";
import { LoginGateButton } from "@/components/login-prompt";
import { countryName } from "@/lib/countries";
import { emptyLibrary, storyLikeTotals } from "@/lib/marks";
import { loadEnabledCountries, loadGlimpses, loadLibrary, loadProfile, loadStories } from "@/lib/remote";
import { GUEST_SHORTS_LIMIT, getSession } from "@/lib/session";
import type { Story } from "@/lib/types";

const GUEST_DESTINATION_LIMIT = 3;
const GUEST_CREATOR_LIMIT = 3;
const CREATOR_PREVIEW_LIMIT = 4;
const DESTINATION_PREVIEW_LIMIT = 4;
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const session = await getSession();
  if (session?.role === "tcc") redirect("/storefront");
  if (session?.role === "admin") redirect("/admin");
  const guest = !session;
  const token = session?.token;
  const { country = "" } = await searchParams;
  const code = country.toUpperCase();
  const [countries, stories, glimpses, library] = await Promise.all([
    loadEnabledCountries(),
    loadStories(token),
    loadGlimpses(token, code || undefined),
    loadLibrary(token),
  ]);
  const selected = countries.find((item) => item.code === code);
  const place = selected?.name ?? "";
  const visibleStories = (stories ?? []).filter((story) => {
    if (!code) return true;
    const stored = story.destination.country;
    return stored.toUpperCase() === code || stored.toLowerCase() === place.toLowerCase();
  });
  const marks = library ?? emptyLibrary;
  const likeTotals = storyLikeTotals(marks);
  const destinations = visibleStories
    .filter((story) => story.itineraries.length > 0)
    .sort((a, b) => (likeTotals.get(b.slug) ?? 0) - (likeTotals.get(a.slug) ?? 0) || b.itineraries.length - a.itineraries.length);
  const rankedCreators = topCreators(visibleStories, likeTotals);
  const creators = await Promise.all(
    rankedCreators
      .slice(0, guest ? GUEST_CREATOR_LIMIT : CREATOR_PREVIEW_LIMIT)
      .map(async (creator) => {
        const profile = await creatorProfile(token, creator.username, creator.bio);
        return {
          ...creator,
          blurb: profile.blurb,
          introVideoUrl: profile.introVideoUrl,
        };
      }),
  );
  const first = guest ? "Wanderer" : session.displayName.split(" ")[0] || "there";
  const suggested = suggestCountries(countries);
  const shortPreview = (glimpses ?? []).slice(0, GUEST_SHORTS_LIMIT);
  const destinationPreview = destinations.slice(0, guest ? GUEST_DESTINATION_LIMIT : DESTINATION_PREVIEW_LIMIT);

  return (
    <div className="h-full overflow-y-auto pb-8">
      <header className="grid gap-3 px-5 pt-8">
        <div className="flex items-center gap-3">
          <Image src="/travelhues-mark.png" alt="" width={36} height={36} />
          <h1 className="font-display text-3xl">Hi, {first}</h1>
        </div>
        <p className="text-base text-muted-foreground">Where are you wandering today?</p>
        <CountrySearch countries={countries} suggested={suggested} selected={selected ? code : ""} />
      </header>
      <section className="mt-8 grid gap-3">
        <div className="px-5">
          <h2 className="font-display text-2xl">Hues</h2>
        </div>
        <GlimpseRow
          glimpses={shortPreview}
          country={selected ? code : ""}
          guest={guest}
          moreAvailable={(glimpses ?? []).length > GUEST_SHORTS_LIMIT}
        />
      </section>
      <section className="mt-8">
        <div className="flex items-center justify-between gap-3 px-5">
          <h2 className="font-display text-2xl">Top destinations</h2>
          {guest ? (
            <LoginGateButton
              className="shrink-0 text-sm font-medium text-primary"
              title="Sign in to see more destinations"
              body="Sign in to browse every destination with itineraries on Travelhues."
            >
              View all
            </LoginGateButton>
          ) : (
            <Link
              href={selected ? `/destinations?country=${code}` : "/destinations"}
              className="shrink-0 text-sm font-medium text-primary"
            >
              View all
            </Link>
          )}
        </div>
        {destinations.length === 0 ? (
          <p className="px-5 pt-4 text-sm text-muted-foreground">
            {place ? `No itineraries in ${countryName(code)} yet.` : "No destinations with itineraries yet."}
          </p>
        ) : (
          <CardRow>
            {destinationPreview.map((story) => (
              <li key={story.slug} className={cardWidth}>
                <DestinationCard story={story} library={marks} guest={guest} />
              </li>
            ))}
            {guest ? (
              <li className={cardWidth}>
                <LoginGateButton
                  className="flex h-full min-h-72 w-full items-center justify-center rounded-3xl border border-dashed border-foreground/25 px-6 text-center text-sm font-medium"
                  title="Sign in to see more destinations"
                  body="Sign in to browse every destination with itineraries on Travelhues."
                >
                  Login to view more
                </LoginGateButton>
              </li>
            ) : (
              <li className={cardWidth}>
                <Link
                  href={selected ? `/destinations?country=${code}` : "/destinations"}
                  className="flex h-full min-h-72 items-center justify-center rounded-3xl border border-dashed border-foreground/25 px-6 text-center text-sm font-medium"
                >
                  View all
                </Link>
              </li>
            )}
          </CardRow>
        )}
      </section>
      <section className="mt-8">
        <div className="flex items-center justify-between gap-3 px-5">
          <h2 className="font-display text-2xl">Top creators</h2>
          {guest ? (
            <LoginGateButton
              className="shrink-0 text-sm font-medium text-primary"
              title="Sign in to see all creators"
              body="Sign in to browse every creator on Travelhues."
            >
              View all
            </LoginGateButton>
          ) : (
            <Link href="/creators" className="shrink-0 text-sm font-medium text-primary">
              View all
            </Link>
          )}
        </div>
        {creators.length === 0 ? (
          <p className="px-5 pt-4 text-sm text-muted-foreground">No creators in this search yet.</p>
        ) : (
          <CardRow>
            {creators.map((creator) => (
              <li key={creator.username} className="w-72 shrink-0 snap-start">
                <CreatorCard creator={creator} guest={guest} />
              </li>
            ))}
            {guest ? (
              <li className="w-72 shrink-0 snap-start">
                <LoginGateButton
                  className="flex h-full min-h-56 w-full items-center justify-center rounded-3xl border border-dashed border-foreground/25 px-6 text-center text-sm font-medium"
                  title="Sign in to see all creators"
                  body="Sign in to browse every creator on Travelhues."
                >
                  Login to view all
                </LoginGateButton>
              </li>
            ) : (
              <li className="w-72 shrink-0 snap-start">
                <Link
                  href="/creators"
                  className="flex h-full min-h-56 items-center justify-center rounded-3xl border border-dashed border-foreground/25 px-6 text-center text-sm font-medium"
                >
                  View all creators
                </Link>
              </li>
            )}
          </CardRow>
        )}
      </section>
    </div>
  );
}

const cardWidth = "w-[calc(100%-3rem)] max-w-sm shrink-0 snap-start";

function suggestCountries<T>(countries: T[]) {
  const pool = [...countries];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = pool[index];
    pool[index] = pool[swap];
    pool[swap] = current;
  }
  return pool.slice(0, 3);
}

function CardRow({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-1">
      {children}
      <li aria-hidden className="-ml-4 w-5 shrink-0" />
    </ul>
  );
}

function topCreators(stories: Story[], likeTotals: Map<string, number>) {
  const grouped = new Map<
    string,
    {
      username: string;
      displayName: string;
      avatarUrl: string;
      coverUrl: string;
      bio: string;
      stories: number;
      likes: number;
    }
  >();
  for (const story of stories) {
    const username = story.creator.username;
    if (!username) continue;
    const current = grouped.get(username);
    const likes = likeTotals.get(story.slug) ?? 0;
    if (!current) {
      grouped.set(username, {
        username,
        displayName: story.creator.displayName,
        avatarUrl: story.creator.avatarUrl,
        coverUrl: story.coverUrl,
        bio: story.creator.bio,
        stories: 1,
        likes,
      });
      continue;
    }
    current.stories += 1;
    current.likes += likes;
  }
  return [...grouped.values()].sort((a, b) => b.stories - a.stories || b.likes - a.likes);
}

async function creatorProfile(token: string | undefined, username: string, bio: string) {
  try {
    const person = await loadProfile(token, username);
    return {
      blurb: person?.headline?.trim() || person?.bio?.trim() || bio.trim(),
      introVideoUrl: person?.introVideoUrl?.trim() || "",
    };
  } catch {
    return { blurb: bio.trim(), introVideoUrl: "" };
  }
}
