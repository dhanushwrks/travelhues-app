import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { AccountSettings } from "@/components/account-settings";
import { ProfileMast } from "@/components/profile-mast";
import { mediaUrl } from "@/lib/api";
import { countryFlag, countryName } from "@/lib/countries";
import type { Library } from "@/lib/marks";
import type { Person } from "@/lib/profile";

export function TravelerProfile({ person, library }: { person: Person; library: Library }) {
  const first = person.displayName.split(" ")[0] || person.displayName;
  const saves = library.marks.filter((mark) => mark.action === "save");
  const spots = saves.filter((mark) => mark.kind === "spot").length;
  const itineraries = saves.filter((mark) => mark.kind === "itinerary").length;
  const cover = mediaUrl(person.coverUrl);
  const avatar = mediaUrl(person.avatarUrl);

  return (
    <div className="h-full overflow-y-auto pb-10">
      <header className="flex items-center justify-between px-5 pt-5">
        <h1 className="text-lg font-medium">Profile</h1>
        <Link href="/account/edit" className="rounded-full bg-primary/10 px-4 py-2 text-sm">
          Edit
        </Link>
      </header>
      <ProfileMast
        className="mx-4"
        name={person.displayName}
        cover={cover ? <Photo src={cover} className="absolute inset-0 size-full object-cover" /> : null}
        avatar={avatar ? <Photo src={avatar} className="absolute inset-0 size-full object-cover" /> : null}
      />
      <div className="px-5 pt-2">
        <h2 className="font-display text-3xl">Hey, {first}</h2>
        <p className="text-sm text-muted-foreground">@{person.username}</p>
        {person.country ? (
          <p className="mt-2 text-sm">
            {countryFlag(person.country)} {countryName(person.country)}
          </p>
        ) : null}
        {person.homeAirport ? (
          <p className="mt-1 text-sm text-muted-foreground">Flights from {person.homeAirport}</p>
        ) : null}
        {person.hobbies.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {person.hobbies.map((hobby) => (
              <li key={hobby} className="rounded-full bg-secondary px-3 py-1 text-sm">
                {hobby}
              </li>
            ))}
          </ul>
        ) : null}
        <Link
          href="/account/saved"
          className="mt-6 flex items-center justify-between rounded-2xl bg-secondary px-4 py-4"
        >
          <span>
            <span className="block font-medium">Saved</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {spots} {spots === 1 ? "find" : "finds"} · {itineraries}{" "}
              {itineraries === 1 ? "itinerary" : "itineraries"}
            </span>
          </span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
        <AccountSettings hidden={person.hidden} creator={false} hasPassword={person.hasPassword !== false} />
      </div>
    </div>
  );
}

function Photo({ src, className }: { src: string; className: string }) {
  if (src.includes("images.unsplash.com")) {
    return <Image src={src} alt="" fill className={className} sizes="100vw" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} />
  );
}
