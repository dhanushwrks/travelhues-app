import { GlimpsePlayer } from "@/components/glimpse-player";
import { loadGlimpses } from "@/lib/remote";
import { GUEST_SHORTS_LIMIT, getSession } from "@/lib/session";

export default async function HuesPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; start?: string }>;
}) {
  const session = await getSession();
  const guest = !session;
  const { country = "", start = "" } = await searchParams;
  const all = (await loadGlimpses(session?.token, country || undefined)) ?? [];
  const glimpses = guest ? all.slice(0, GUEST_SHORTS_LIMIT) : all;

  return (
    <GlimpsePlayer
      initial={glimpses}
      startId={start}
      traveler={session?.role === "traveler"}
      guest={guest}
      guestCapped={guest && all.length > GUEST_SHORTS_LIMIT}
    />
  );
}
