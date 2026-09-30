import { GlimpsePlayer } from "@/components/glimpse-player";
import { loadGlimpses } from "@/lib/remote";
import { requireSession } from "@/lib/session";

export default async function ShortsPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; start?: string }>;
}) {
  const session = await requireSession();
  const { country = "", start = "" } = await searchParams;
  const glimpses = (await loadGlimpses(session.token, country || undefined)) ?? [];
  return (
    <GlimpsePlayer
      initial={glimpses}
      startId={start}
      traveler={session.role === "traveler"}
    />
  );
}
