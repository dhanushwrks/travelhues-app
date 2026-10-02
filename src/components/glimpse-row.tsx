"use client";

import Link from "next/link";

import { LoginGateButton, LoginGateCard } from "@/components/login-prompt";
import type { Glimpse } from "@/lib/glimpse";

export function GlimpseRow({
  glimpses,
  country,
  guest = false,
  moreAvailable = false,
}: {
  glimpses: Glimpse[];
  country: string;
  guest?: boolean;
  moreAvailable?: boolean;
}) {
  const preview = glimpses.slice(0, 5);
  const more = moreAvailable || glimpses.length > 5 || preview.length >= 5;
  const shortsBase = country ? `/shorts?country=${encodeURIComponent(country)}` : "/shorts";

  if (preview.length === 0) {
    return <p className="px-5 text-sm text-muted-foreground">No hues in this search yet.</p>;
  }

  return (
    <ul className="flex gap-3 overflow-x-auto px-5 pb-1">
      {preview.map((glimpse) => {
        const tile = (
          <>
            <span className="relative block aspect-[9/16] overflow-hidden rounded-2xl bg-foreground">
              {glimpse.posterUrl ? (
                <Poster src={glimpse.posterUrl} />
              ) : (
                <span className="absolute inset-x-0 bottom-0 p-2 text-xs text-background">{glimpse.caption}</span>
              )}
            </span>
            <span className="mt-1 block truncate text-xs">{glimpse.displayName}</span>
          </>
        );
        return (
          <li key={glimpse.id} className="w-28 shrink-0">
            {guest ? (
              <LoginGateCard
                className="block w-full text-left"
                label={glimpse.displayName || glimpse.caption}
                title="Sign in to watch this short"
                body="Sign in to open hues, stories, and creator pages."
              >
                {tile}
              </LoginGateCard>
            ) : (
              <Link
                href={`${shortsBase}${shortsBase.includes("?") ? "&" : "?"}start=${glimpse.id}`}
                className="block"
              >
                {tile}
              </Link>
            )}
          </li>
        );
      })}
      {more ? (
        <li className="w-28 shrink-0">
          {guest ? (
            <LoginGateButton
              className="grid aspect-[9/16] w-full place-items-center rounded-2xl bg-foreground px-3 text-center text-sm text-background"
              title="Sign in to watch more hues"
              body="You’ve seen a preview. Sign in to load fresh hues and keep scrolling."
            >
              Login to view more
            </LoginGateButton>
          ) : (
            <Link
              href={shortsBase}
              className="grid aspect-[9/16] place-items-center rounded-2xl bg-foreground px-3 text-center text-sm text-background"
            >
              View more
            </Link>
          )}
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
