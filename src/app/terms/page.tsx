import type { Metadata } from "next";

import { BackLink } from "@/components/back-link";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto grid w-full max-w-md gap-4 px-5 pt-6 pb-10">
        <div className="relative flex items-center justify-center">
          <BackLink className="absolute left-0" />
          <h1 className="font-display text-2xl">Terms</h1>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          These Terms of Use are a placeholder while Travelhues finalizes its legal documents.
          By creating an account, joining the creator waitlist, or using Travelhues, you agree to
          use the service lawfully, respect other people&apos;s content, and keep your login details
          private.
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          Travelhues may update these terms. Continued use after an update means you accept the
          revised terms. If you do not agree, stop using the service and delete your account.
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          For questions, contact the Travelhues desk through the channels listed on the site.
        </p>
      </article>
    </div>
  );
}
