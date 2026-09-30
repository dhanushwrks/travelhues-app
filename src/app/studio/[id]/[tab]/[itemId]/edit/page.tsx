import { notFound, redirect } from "next/navigation";

import { PlanForm } from "@/components/plan-form";
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
  if (tab !== "plans") notFound();
  const { resume } = await searchParams;
  return <PlanForm storyId={id} planId={itemId} resume={resume === "1"} />;
}
