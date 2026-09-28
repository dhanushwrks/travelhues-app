import Image from "next/image";
import Link from "next/link";
import { Link2 } from "lucide-react";

import { mediaUrl } from "@/lib/api";
import { countryFlag, countryName } from "@/lib/countries";
import type { Person } from "@/lib/profile";

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
      <div className="relative mt-4 h-28 bg-secondary">
        {person.coverUrl ? <UserPhoto src={mediaUrl(person.coverUrl)} className="size-full object-cover" /> : null}
      </div>
      <div className="px-5">
        <Portrait src={person.avatarUrl} name={person.displayName} />
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
        {person.socials.length > 0 ? (
          <ul className="mt-5 flex gap-3">
            {person.socials.map((link) => (
              <li key={`${link.platform}-${link.url}`}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={socialLabel(link.platform)}
                  className="grid size-10 place-items-center rounded-full bg-secondary text-foreground"
                >
                  <SocialIcon platform={link.platform} />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
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
            <ul className="mt-4 space-y-4">
              {person.stories.map((story) => (
                <li key={story.slug}>
                  <Link href={`/stories/${story.slug}`} className="block">
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
    <span className="relative -mt-10 grid size-20 place-items-center overflow-hidden rounded-full border-4 border-card bg-secondary text-xl">
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

function socialLabel(platform: string) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    youtube: "YouTube",
    x: "X",
    tiktok: "TikTok",
    website: "Link",
  };
  return labels[platform] ?? "Link";
}

function SocialIcon({ platform }: { platform: string }) {
  if (platform === "instagram") return <InstagramMark />;
  if (platform === "youtube") return <YouTubeMark />;
  return <Link2 className="size-5" aria-hidden />;
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YouTubeMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}
