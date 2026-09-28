import { notFound, redirect } from "next/navigation";

import { StudioEditor } from "@/components/studio-editor";
import { studioKinds, type StudioKind } from "@/lib/mock/studio";
import { requireSession } from "@/lib/session";

export default async function StudioPiecePage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  const { kind, id } = await params;
  if (!studioKinds.includes(kind as StudioKind)) notFound();
  return <StudioEditor kind={kind as StudioKind} pieceId={id} />;
}
