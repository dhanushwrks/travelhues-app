import Image from "next/image";
import Link from "next/link";

import { mediaUrl } from "@/lib/api";
import { countryFlag, countryName } from "@/lib/countries";
import type { Person } from "@/lib/profile";
import { ProfileMast } from "@/components/profile-mast";
import { ReportControl } from "@/components/report-control";
import { ShareProfileButton } from "@/components/share-profile-button";
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
      <ProfileMast
        className="mx-4"
        name={person.displayName}
        introVideoUrl={person.role === "tcc" ? person.introVideoUrl : undefined}
        cover={person.coverUrl ? <UserPhoto src={mediaUrl(person.coverUrl)} className="absolute inset-0 size-full object-cover" /> : null}
        avatar={person.avatarUrl ? <UserPhoto src={mediaUrl(person.avatarUrl)} className="absolute inset-0 size-full object-cover" /> : null}
      />
      <div className="px-5 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">Hey, {first}</h2>
            <p className="text-sm text-muted-foreground">@{person.username}</p>
          </div>
          {person.role === "tcc" ? (
            <div className="mt-1 flex shrink-0 items-center gap-3">
              <Link
                href={`/u/${person.username}`}
                className="rounded-full bg-primary/10 px-4 py-2 text-sm"
              >
                View storefront
              </Link>
              <ShareProfileButton username={person.username} />
            </div>
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
        {!editHref ? (
          <div className="mt-3">
            <ReportControl
              targetKind="profile"
              targetId={person.username}
              targetLabel={`@${person.username}`}
              targetOwnerUsername={person.username}
              targetOwnerRole={person.role === "admin" ? "traveler" : person.role}
            />
          </div>
        ) : null}
        <dl className="mt-5 grid grid-cols-3 text-center">
          <Stat value={person.counts.stories} label="Stories" />
          <Stat value={person.counts.spots} label="Finds" />
          <Stat value={person.counts.itineraries} label="Itineraries" />
        </dl>
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

function UserPhoto({ src, className }: { src: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} />
  );
}

