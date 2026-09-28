import Image from "next/image";

import { DestinationCard } from "@/components/destination-card";
import { mediaUrl } from "@/lib/api";
import { countryFlag, countryName } from "@/lib/countries";
import type { Library } from "@/lib/marks";
import type { Person, SocialLink } from "@/lib/profile";

export function Storefront({
  person,
  traveler,
  library,
}: {
  person: Person;
  traveler: boolean;
  library: Library;
}) {
  return (
    <div className="h-full overflow-y-auto pb-10">
      <header className="flex items-center gap-2 px-5 pt-5">
        <Image src="/travelhues-mark.png" alt="" width={28} height={28} />
        <h1 className="text-lg font-medium">Storefront</h1>
      </header>
      <div className="relative mt-4 h-28 bg-secondary">
        {person.coverUrl ? <UserPhoto src={mediaUrl(person.coverUrl)} className="size-full object-cover" /> : null}
      </div>
      <div className="px-5">
        <div className="-mt-8 size-16 overflow-hidden rounded-full bg-card ring-4 ring-background">
          {person.avatarUrl ? (
            <UserPhoto src={mediaUrl(person.avatarUrl)} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center font-display text-xl">
              {person.displayName.slice(0, 1)}
            </span>
          )}
        </div>
        <h2 className="mt-3 font-display text-3xl">{person.displayName}</h2>
        <p className="text-sm text-muted-foreground">@{person.username}</p>
        {person.country ? (
          <p className="mt-2 text-sm">
            {countryFlag(person.country)} {countryName(person.country)}
          </p>
        ) : null}
        {person.bio ? <p className="mt-4 text-[15px] leading-6">{person.bio}</p> : null}
        {person.socials.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-3 text-sm">
            {person.socials.map((link) => (
              <li key={`${link.platform}-${link.url}`}>
                <a href={link.url} target="_blank" rel="noreferrer" className="underline">
                  {label(link)}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <section className="mt-8 grid gap-4 px-5">
        <h3 className="font-display text-2xl">Destinations</h3>
        {person.stories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No destinations published yet.</p>
        ) : (
          person.stories.map((story) => (
            <DestinationCard key={story.slug} story={story} traveler={traveler} library={library} />
          ))
        )}
      </section>
    </div>
  );
}

function label(link: SocialLink) {
  return link.platform.charAt(0).toUpperCase() + link.platform.slice(1);
}

function UserPhoto({ src, className }: { src: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} />
  );
}
