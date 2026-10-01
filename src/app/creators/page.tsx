import { redirect } from "next/navigation";

import { CreatorsScreen } from "@/components/creators-screen";
import { requireSession } from "@/lib/session";

export default async function CreatorsPage() {
  const session = await requireSession();
  if (session.role === "tcc") redirect("/storefront");
  return <CreatorsScreen />;
}
