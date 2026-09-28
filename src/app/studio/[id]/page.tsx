import { redirect } from "next/navigation";

import { StoryDesk } from "@/components/story-desk";
import { requireSession } from "@/lib/session";
import type { StoryTab } from "@/lib/mock/studio";

export default async function StudioStoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  const { id } = await params;
  const { tab } = await searchParams;
  const initial: StoryTab = tab === "plans" || tab === "blogs" ? tab : "spots";
  return <StoryDesk key={`${id}-${initial}`} storyId={id} initialTab={initial} />;
}
