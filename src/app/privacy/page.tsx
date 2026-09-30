import type { Metadata } from "next";

import { BackLink } from "@/components/back-link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto grid w-full max-w-md gap-4 px-5 pt-6 pb-10">
        <div className="relative flex items-center justify-center">
          <BackLink className="absolute left-0" />
          <h1 className="font-display text-2xl">Privacy Policy</h1>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          This Privacy Policy is a placeholder while Travelhues finalizes its legal documents. We
          collect account details you provide (such as name, email, and profile information), and
          technical data needed to run sign-in, waitlist, and the app.
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          We use this information to operate Travelhues, secure accounts, review creator requests,
          and improve the product. We do not sell your personal information.
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          You can ask to update or delete your account data through the Travelhues desk. This notice
          may change; we will post updates on this page.
        </p>
      </article>
    </div>
  );
}
