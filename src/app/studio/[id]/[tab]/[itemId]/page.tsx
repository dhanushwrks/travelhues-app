import { notFound, redirect } from "next/navigation";

import { StudioItem } from "@/components/studio-item";
import type { StoryTab } from "@/lib/mock/studio";
import { requireSession } from "@/lib/session";

const tabs: StoryTab[] = ["spots", "plans", "blogs"];

export default async function StudioItemPage({
  params,
}: {
  params: Promise<{ id: string; tab: string; itemId: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  const { id, tab, itemId } = await params;
  if (!tabs.includes(tab as StoryTab)) notFound();
  return <StudioItem storyId={id} tab={tab as StoryTab} itemId={itemId} />;
}
