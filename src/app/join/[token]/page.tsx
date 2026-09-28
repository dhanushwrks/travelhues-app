import { InviteForm, type InvitePrefill } from "@/components/invite-form";
import { apiBase } from "@/lib/api";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const response = await fetch(`${apiBase}/invites/${token}`, { cache: "no-store" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    return (
      <div className="grid gap-3 px-5 pt-10">
        <h1 className="font-display text-3xl">This link is closed</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {body?.message || "Ask the desk for a new invite."}
        </p>
      </div>
    );
  }
  const invite = (await response.json()) as { prefill: InvitePrefill | null };
  return (
    <div className="h-full overflow-y-auto">
      <InviteForm token={token} prefill={invite.prefill} />
    </div>
  );
}
