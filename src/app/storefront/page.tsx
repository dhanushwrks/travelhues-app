import { redirect } from "next/navigation";

import { CreatorStorefront } from "@/components/creator-storefront";
import { loadMe } from "@/lib/remote";
import { requireSession } from "@/lib/session";

export default async function StorefrontPage() {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");

  const person = await loadMe(session.token);

  return (
    <CreatorStorefront
      name={person?.displayName || session.displayName}
      username={person?.username || session.username}
      avatarUrl={person?.avatarUrl ?? ""}
    />
  );
}
