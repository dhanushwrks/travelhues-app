import Image from "next/image";
import Link from "next/link";
import { Link2 } from "lucide-react";

import { mediaUrl } from "@/lib/api";
import { countryFlag, countryName } from "@/lib/countries";
import type { Person } from "@/lib/profile";
import { SocialLinks } from "@/components/social-links";
import { storyHref } from "@/lib/types";

export function ProfileView({
  person,
  editHref,
  showStories = false,
  children,
}: {
  person: Person;
  editHref?: string;
  showStories?: boolean;
  children?: React.ReactNode;
}) {
  const first = person.displayName.split(" ")[0] || person.displayName;
  const extra = person.countriesTraveled.length;

  return (
    <div className="h-full overflow-y-auto pb-10">
      <header className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <Image src="/travelhues-mark.png" alt="" width={28} height={28} />
          <h1 className="text-lg font-medium">Profile</h1>
        </div>
        {editHref ? (
          <Link href={editHref} className="rounded-full bg-primary/10 px-4 py-2 text-sm">
            Edit
          </Link>
        ) : null}
      </header>
      <div className="relative mt-4 h-40 bg-secondary md:h-56">
        {person.coverUrl ? <UserPhoto src={mediaUrl(person.coverUrl)} className="size-full object-cover" /> : null}
        <Portrait src={person.avatarUrl} name={person.displayName} />
      </div>
      <div className="px-5 pt-4">
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">Hey, {first}</h2>
            <p className="text-sm text-muted-foreground">@{person.username}</p>
          </div>
          {person.role === "tcc" ? (
            <Link href={`/u/${person.username}`} aria-label="Storefront" className="mt-1">
              <Link2 className="size-5" />
            </Link>
          ) : null}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <p>
            {person.country ? `${countryFlag(person.country)} ${countryName(person.country)}` : person.role === "tcc" ? "Creator" : "Traveler"}
          </p>
          {extra > 0 ? (
            <p className="text-muted-foreground">+{extra} {extra === 1 ? "country" : "countries"}</p>
          ) : null}
        </div>
        <dl className="mt-5 grid grid-cols-3 text-center">
          <Stat value={person.counts.stories} label="Stories" />
          <Stat value={person.counts.spots} label="Spots" />
          <Stat value={person.counts.itineraries} label="Itineraries" />
        </dl>
        {person.role === "tcc" && editHref ? (
          <Link href="/stories/new" className="mt-4 inline-flex text-sm font-medium text-primary">
            Add a story
          </Link>
        ) : null}
        <SocialLinks links={person.socials} />
        {person.headline ? <p className="mt-5 text-sm font-medium">{person.headline}</p> : null}
        {person.bio ? (
          <section className="mt-5">
            <h3 className="font-medium">About</h3>
            <p className="mt-2 text-sm leading-6">{person.bio}</p>
          </section>
        ) : null}
        {person.hobbies.length > 0 ? (
          <section className="mt-5">
            <h3 className="font-medium">Hobbies</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {person.hobbies.map((hobby) => (
                <li key={hobby} className="rounded-full bg-secondary px-3 py-1 text-sm">
                  {hobby}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {showStories && person.stories.length > 0 ? (
          <section className="mt-8">
            <h3 className="font-display text-2xl">Stories</h3>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {person.stories.map((story) => (
                <li key={story.slug}>
                  <Link href={storyHref(story)} className="block">
                    <span className="relative block aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
                      <Image src={story.coverUrl} alt="" fill className="object-cover" sizes="430px" />
                    </span>
                    <span className="mt-2 block text-base font-medium">{story.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="font-display text-2xl">{value}</dt>
      <dd className="text-xs text-muted-foreground">{label}</dd>
    </div>
  );
}

function Portrait({ src, name }: { src: string; name: string }) {
  const url = mediaUrl(src);
  return (
    <span className="absolute bottom-4 left-5 z-10 grid size-24 place-items-center overflow-hidden rounded-full border-4 border-card bg-secondary font-display text-3xl">
      {url.includes("images.unsplash.com") ? (
        <Image src={url} alt="" fill className="object-cover" sizes="80px" />
      ) : url ? (
        <UserPhoto src={url} className="size-full object-cover" />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}

function UserPhoto({ src, className }: { src: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} />
  );
}

