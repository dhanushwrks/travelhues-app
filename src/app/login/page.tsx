import Image from "next/image";
import Link from "next/link";

import { BrandFooter } from "@/components/brand-footer";
import { loadBrandLinks } from "@/lib/remote";

export default async function LoginDoorPage() {
  const links = await loadBrandLinks();

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-center px-5 pt-6">
        <Image
          src="/travelhues-logo.png"
          alt="Travelhues"
          width={374}
          height={102}
          priority
          className="h-12 w-fit"
        />
      </div>
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-8 md:px-10">
        <div className="w-full max-w-3xl text-center">
          <h1 className="font-display text-4xl">Come in</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Choose how you use Travelhues. The two accounts stay separate.
          </p>
          <div className="mt-8 grid gap-3 text-left md:grid-cols-2">
            <Link href="/login/user" className="rounded-3xl bg-primary px-5 py-5 text-primary-foreground">
              <span className="block text-lg font-medium">User</span>
              <span className="mt-1 block text-sm text-primary-foreground/85">Browse stories. Sign in with Google or email.</span>
            </Link>
            <Link href="/login/tcc" className="rounded-3xl border border-border bg-background px-5 py-5">
              <span className="block text-lg font-medium">Creator</span>
              <span className="mt-1 block text-sm text-muted-foreground">Write stories. New creators join the waitlist.</span>
            </Link>
          </div>
        </div>
      </div>
      <BrandFooter links={links} />
    </div>
  );
}
