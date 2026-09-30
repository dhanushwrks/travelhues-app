import { RequestReceived } from "@/components/request-received";
import { WaitlistForm } from "@/components/waitlist-form";

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ received?: string }>;
}) {
  const { received } = await searchParams;

  return (
    <div className="h-full overflow-y-auto">
      {received === "1" ? <RequestReceived /> : <WaitlistForm />}
    </div>
  );
}
