import { notFound, redirect } from "next/navigation";

import { StoryPieceForm } from "@/components/story-piece-form";
import type { StoryTab } from "@/lib/mock/studio";
import { requireSession } from "@/lib/session";

const tabs: StoryTab[] = ["spots", "plans", "blogs"];

export default async function NewStoryPiecePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; tab: string }>;
  searchParams: Promise<{ from?: string; plan?: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  const { id, tab } = await params;
  const { from, plan } = await searchParams;
  if (!tabs.includes(tab as StoryTab)) notFound();
  return <StoryPieceForm storyId={id} tab={tab as StoryTab} fromPlan={from === "plan"} planId={plan ?? ""} />;
}
