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
        Browse stories from people who have already made the trip.
      </p>
      <div className="mt-8 grid gap-3">
        <Link
          href="/login/user"
          className="rounded-full bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-full border border-border px-4 py-3 text-center text-sm"
        >
          Create an account
        </Link>
      </div>
      <div className="mt-12 grid gap-3">
        <h2 className="font-display text-2xl">I write the stories</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Creator accounts open after a review, or from a link we send you.
        </p>
        <Link
          href="/join"
          className="rounded-full bg-foreground px-4 py-3 text-center text-sm font-medium text-background"
        >
          Join the waitlist
        </Link>
        <Link href="/login/tcc" className="text-sm">
          Creator sign in
        </Link>
      </div>
    </div>
  );
}
