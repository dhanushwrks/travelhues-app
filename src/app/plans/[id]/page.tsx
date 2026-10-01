import { redirect } from "next/navigation";

import { StoryDesk } from "@/components/story-desk";
import { requireSession } from "@/lib/session";
import { DeskScope } from "@/lib/studio-desk";
import type { StoryTab } from "@/lib/mock/studio";

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "traveler") redirect("/");
  const { id } = await params;
  const { tab } = await searchParams;
  const initial: StoryTab = tab === "plans" ? "plans" : "spots";
  return (
    <DeskScope home="/plans">
      <StoryDesk key={`${id}-${initial}`} storyId={id} initialTab={initial} />
    </DeskScope>
  );
}
