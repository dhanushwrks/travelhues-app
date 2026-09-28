import Image from "next/image";
import Link from "next/link";

export default function LoginDoorPage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 pt-10 pb-10">
      <Image
        src="/travelhues-logo.png"
        alt="Travelhues"
        width={374}
        height={102}
        priority
        className="h-12 w-fit"
      />
      <h1 className="mt-8 font-display text-4xl">Come in</h1>
      <p className="mt-2 max-w-[28ch] text-sm leading-6 text-muted-foreground">
        Choose how you use Travelhues. The two accounts stay separate.
      </p>
      <div className="mt-8 grid gap-3">
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
  );
}
