import { redirect } from "next/navigation";

import { CreatorStorefront } from "@/components/creator-storefront";
import { requireSession } from "@/lib/session";

export default async function StorefrontPage() {
  const session = await requireSession();
  if (session.role !== "tcc") redirect("/");

  return <CreatorStorefront name={session.displayName} username={session.username} />;
}
