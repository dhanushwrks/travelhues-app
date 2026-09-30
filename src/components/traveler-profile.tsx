import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { AccountSettings } from "@/components/account-settings";
import { mediaUrl } from "@/lib/api";
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
      <div className="relative mt-4 h-40 bg-secondary md:h-56">
        {cover ? <Photo src={cover} className="size-full object-cover" /> : null}
        <span className="absolute bottom-4 left-5 z-10 grid size-24 place-items-center overflow-hidden rounded-full border-4 border-card bg-secondary font-display text-3xl">
          {avatar ? <Photo src={avatar} className="size-full object-cover" /> : person.displayName.slice(0, 1)}
        </span>
      </div>
      <div className="px-5 pt-4">
        <h2 className="mt-3 font-display text-3xl">Hey, {first}</h2>
        <p className="text-sm text-muted-foreground">@{person.username}</p>
        <Link
          href="/account/saved"
          className="mt-6 flex items-center justify-between rounded-2xl bg-secondary px-4 py-4"
        >
          <span>
            <span className="block font-medium">Saved</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {spots} {spots === 1 ? "spot" : "spots"} · {itineraries}{" "}
              {itineraries === 1 ? "itinerary" : "itineraries"}
            </span>
          </span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
        <AccountSettings hidden={person.hidden} creator={false} />
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
