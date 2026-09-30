import { notFound, redirect } from "next/navigation";

import { PostView } from "@/components/post-view";
import { requireSession } from "@/lib/session";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");
  const { id } = await params;
  if (!id) notFound();
  return <PostView id={id} name={session.displayName} />;
}
