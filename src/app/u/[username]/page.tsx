import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Storefront } from "@/components/storefront";
import { emptyLibrary } from "@/lib/marks";
import { loadGlimpses, loadLibrary, loadProfile } from "@/lib/remote";
import { requireSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const session = await requireSession();
  const person = await loadProfile(session.token, username);
  if (!person || person.role !== "tcc") return { title: "Storefront" };
  return { title: person.displayName, description: person.bio };
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await requireSession();
  const [person, glimpses, library] = await Promise.all([
    loadProfile(session.token, username),
    loadGlimpses(session.token),
    loadLibrary(session.token),
  ]);
  if (!person || person.role !== "tcc") notFound();
  const shorts = (glimpses ?? []).filter((item) => item.username === person.username);

  return <Storefront person={person} shorts={shorts} library={library ?? emptyLibrary} />;
}
