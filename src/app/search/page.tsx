import { redirect } from "next/navigation";

import { SearchScreen } from "@/components/search-screen";
import { loadEnabledCountries } from "@/lib/remote";
import { getSession } from "@/lib/session";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; country?: string; spot?: string; sort?: string }>;
}) {
  const session = await getSession();
  if (session?.role === "tcc") redirect("/storefront");
  const initial = await searchParams;
  const countries = await loadEnabledCountries();
  return <SearchScreen countries={countries} initial={initial} guest={!session} />;
}
