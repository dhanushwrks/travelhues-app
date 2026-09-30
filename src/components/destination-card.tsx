import Image from "next/image";
import Link from "next/link";
import { BookOpen, Heart, MapPin, Route, Share2, type LucideIcon } from "lucide-react";

import { countryLabel } from "@/lib/countries";
import { storyLikeCount, type Library } from "@/lib/marks";
import { storyHref, type Story } from "@/lib/types";

export function DestinationCard({ story, library }: { story: Story; library: Library }) {
  const blogs = story.blogs?.length ?? 0;
  const likes = storyLikeCount(library, story.slug);

  return (
    <article className="h-full overflow-hidden rounded-3xl bg-card ring-1 ring-border">
      <Link href={storyHref(story)} className="block">
        <span className="relative block aspect-[16/9] bg-muted">
          <Image
            src={story.coverUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
          />
        </span>
        <span className="block px-4 pt-3">
          <span className="block font-display text-2xl">{story.title}</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            {countryLabel(story.destination.country)} · {story.creator.displayName}
          </span>
        </span>
        <p className="mt-3 flex items-center gap-3 px-4 text-sm text-muted-foreground">
          <Count icon={Heart} value={likes} label={likes === 1 ? "like" : "likes"} />
          <Count icon={Share2} value={0} label="shares" />
        </p>
        <p className="mt-2 flex flex-nowrap items-center gap-x-1.5 overflow-hidden px-4 pb-4 text-[13px] text-muted-foreground">
          <Count icon={MapPin} value={story.spots.length} label="Spots" named />
          <span aria-hidden>|</span>
          <Count icon={Route} value={story.itineraries.length} label="Plans" named />
          <span aria-hidden>|</span>
          <Count icon={BookOpen} value={blogs} label="Reads" named />
        </p>
      </Link>
    </article>
  );
}

function Count({
  icon: Icon,
  value,
  label,
  named = false,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  named?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={named ? `${label} ${value}` : `${value} ${label}`}>
      <Icon className="size-4 text-primary" aria-hidden />
      {named ? <span>{label}</span> : null}
      <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}
