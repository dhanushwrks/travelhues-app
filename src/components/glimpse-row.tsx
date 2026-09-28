import Link from "next/link";

import type { Glimpse } from "@/lib/glimpse";

export function GlimpseRow({
  glimpses,
  country,
}: {
  glimpses: Glimpse[];
  country: string;
}) {
  const preview = glimpses.slice(0, 5);
  const more = glimpses.length > 5;
  const feed = country ? `/glimpse?country=${country}` : "/glimpse";

  if (preview.length === 0) {
    return <p className="px-5 text-sm text-muted-foreground">No glimpses in this search yet.</p>;
  }

  return (
    <ul className="flex gap-3 overflow-x-auto px-5 pb-1">
      {preview.map((glimpse) => (
        <li key={glimpse.id} className="w-28 shrink-0">
          <Link href={`${feed}${feed.includes("?") ? "&" : "?"}start=${glimpse.id}`} className="block">
            <span className="relative block aspect-[9/16] overflow-hidden rounded-2xl bg-foreground">
              {glimpse.posterUrl ? (
                <Poster src={glimpse.posterUrl} />
              ) : (
                <span className="absolute inset-x-0 bottom-0 p-2 text-xs text-background">{glimpse.caption}</span>
              )}
            </span>
            <span className="mt-1 block truncate text-xs">{glimpse.displayName}</span>
          </Link>
        </li>
      ))}
      {more ? (
        <li className="w-28 shrink-0">
          <Link
            href={feed}
            className="grid aspect-[9/16] place-items-center rounded-2xl bg-foreground px-3 text-center text-sm text-background"
          >
            View more
          </Link>
        </li>
      ) : null}
    </ul>
  );
}

function Poster({ src }: { src: string }) {
  return (
    // Posters can be any creator image URL, which the optimizer does not accept.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="size-full object-cover" />
  );
}
