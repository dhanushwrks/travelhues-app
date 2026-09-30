import { notFound, redirect } from "next/navigation";

import { StudioItem } from "@/components/studio-item";
import type { StoryTab } from "@/lib/mock/studio";
import { requireSession } from "@/lib/session";
import { DeskScope } from "@/lib/studio-desk";

const tabs: StoryTab[] = ["spots", "plans"];

export default async function TripItemPage({
  params,
}: {
  params: Promise<{ id: string; tab: string; itemId: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "traveler") redirect("/");
  const { id, tab, itemId } = await params;
  if (!tabs.includes(tab as StoryTab)) notFound();
  return (
    <DeskScope home="/trips">
      <StudioItem storyId={id} tab={tab as StoryTab} itemId={itemId} />
    </DeskScope>
  );
}
