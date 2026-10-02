import { GlimpsePlayer } from "@/components/glimpse-player";
import { loadGlimpses, loadShortAdsForFeed } from "@/lib/remote";
import { GUEST_SHORTS_LIMIT, getSession } from "@/lib/session";

export default async function HuesPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; start?: string }>;
}) {
  const session = await getSession();
  const guest = !session;
  const { country = "", start = "" } = await searchParams;
  const [all, ads] = await Promise.all([
    loadGlimpses(session?.token, country || undefined),
    loadShortAdsForFeed(),
  ]);
  const list = all ?? [];
  const glimpses = guest ? list.slice(0, GUEST_SHORTS_LIMIT) : list;

  return (
    <GlimpsePlayer
      initial={glimpses}
      ads={ads}
      startId={start}
      traveler={session?.role === "traveler"}
      guest={guest}
      guestCapped={guest && list.length > GUEST_SHORTS_LIMIT}
    />
  );
}
