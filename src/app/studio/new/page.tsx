import { redirect } from "next/navigation";

import { StudioEditor } from "@/components/studio-editor";
import { studioKinds, type StudioKind } from "@/lib/mock/studio";
import { requireSession } from "@/lib/session";

export default async function NewStudioPiecePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  const { kind = "story" } = await searchParams;
  const selected = studioKinds.includes(kind as StudioKind) ? (kind as StudioKind) : "story";
  return <StudioEditor kind={selected} />;
}
