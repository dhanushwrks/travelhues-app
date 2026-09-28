import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col justify-center px-5">
      <h1 className="font-display text-4xl">That page is not here</h1>
      <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
        The story or itinerary may have moved.
      </p>
      <Link href="/" className="mt-6 text-sm font-medium text-primary">
        Back to Explore
      </Link>
    </div>
  );
}
