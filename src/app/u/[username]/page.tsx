import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Storefront } from "@/components/storefront";
import { emptyLibrary } from "@/lib/marks";
import { loadLibrary, loadProfile } from "@/lib/remote";
import { getSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const session = await getSession();
  const person = await loadProfile(session?.token, username);
  if (!person || person.role !== "tcc") return { title: "Storefront" };
  return { title: person.displayName, description: person.bio };
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await getSession();
  const [person, library] = await Promise.all([
    loadProfile(session?.token, username),
    session ? loadLibrary(session.token) : Promise.resolve(null),
  ]);
  if (!person || person.role !== "tcc") notFound();

  return (
    <Storefront person={person} library={library ?? emptyLibrary} guestPreview={!session} />
  );
}
