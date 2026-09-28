import Image from "next/image";
import Link from "next/link";

import { AccountSettings } from "@/components/account-settings";
import type { Library } from "@/lib/marks";
import type { Person } from "@/lib/profile";

export function TravelerProfile({ person, library }: { person: Person; library: Library }) {
  const first = person.displayName.split(" ")[0] || person.displayName;
  const saves = library.marks.filter((mark) => mark.action === "save");
  const itineraries = saves.filter((mark) => mark.kind === "itinerary");
  const spots = saves.filter((mark) => mark.kind === "spot");

  return (
    <div className="h-full overflow-y-auto pb-10">
      <header className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <Image src="/travelhues-mark.png" alt="" width={28} height={28} />
          <h1 className="text-lg font-medium">Profile</h1>
        </div>
        <Link href="/account/edit" className="rounded-full bg-primary/10 px-4 py-2 text-sm">
          Edit
        </Link>
      </header>
      <div className="px-5 pt-6">
        <h2 className="font-display text-3xl">Hey, {first}</h2>
        <p className="text-sm text-muted-foreground">@{person.username}</p>
      </div>
      <section className="mt-8 px-5">
        <h3 className="font-display text-2xl">Saved itineraries</h3>
        {itineraries.length === 0 ? (
          <p className="pt-2 text-sm text-muted-foreground">Save an itinerary from a destination and it lands here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {itineraries.map((mark) => (
              <li key={`${mark.storySlug}-${mark.itinerarySlug}`}>
                <Link
                  href={`/stories/${mark.storySlug}/itineraries/${mark.itinerarySlug}`}
                  className="block py-3"
                >
                  <span className="block font-medium">{mark.title}</span>
                  <span className="block text-sm text-muted-foreground">{mark.storyTitle}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-8 px-5">
        <h3 className="font-display text-2xl">Saved spots</h3>
        {spots.length === 0 ? (
          <p className="pt-2 text-sm text-muted-foreground">Save a spot from a story and it lands here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {spots.map((mark) => (
              <li key={`${mark.storySlug}-${mark.spotId}`}>
                <Link href={`/stories/${mark.storySlug}?spot=${mark.spotId}`} className="block py-3">
                  <span className="block font-medium">{mark.title}</span>
                  <span className="block text-sm text-muted-foreground">{mark.storyTitle}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="px-5">
        <AccountSettings hidden={person.hidden} creator={false} />
      </div>
    </div>
  );
}
