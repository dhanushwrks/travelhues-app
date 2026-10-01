import { redirect } from "next/navigation";

export default async function TripsPathRedirect({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  redirect(`/plans/${path.map(encodeURIComponent).join("/")}`);
}
