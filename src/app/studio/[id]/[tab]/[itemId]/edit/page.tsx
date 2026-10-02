import { notFound, redirect } from "next/navigation";

import { BlogForm } from "@/components/blog-form";
import { PlanForm } from "@/components/plan-form";
import { SpotForm } from "@/components/spot-form";
import { requireSession } from "@/lib/session";

export default async function EditPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; tab: string; itemId: string }>;
  searchParams: Promise<{ resume?: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  const { id, tab, itemId } = await params;
  const { resume } = await searchParams;
  if (tab === "spots") return <SpotForm storyId={id} spotId={itemId} />;
  if (tab === "plans") return <PlanForm storyId={id} planId={itemId} resume={resume === "1"} />;
  if (tab === "blogs") return <BlogForm storyId={id} blogId={itemId} />;
  notFound();
}
