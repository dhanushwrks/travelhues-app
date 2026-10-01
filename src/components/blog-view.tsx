"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PurchaseSheet } from "@/components/purchase-sheet";
import { ReportControl } from "@/components/report-control";
import { formatInr } from "@/lib/format";
import { blogMarkup } from "@/lib/mock/studio";
import { storyHref, type Story, type StoryBlog } from "@/lib/types";

export function BlogView({
  story,
  blog,
  editHref,
}: {
  story: Story;
  blog: StoryBlog;
  editHref?: string;
}) {
  const router = useRouter();
  const [purchaseOpen, setPurchaseOpen] = useState(Boolean(blog.locked));
  const locked = Boolean(blog.locked);

  return (
    <article className="h-full overflow-y-auto pb-10">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <Link
          href={`${storyHref(story)}?tab=blogs`}
          className="inline-flex h-11 items-center gap-1 text-sm font-medium text-primary"
        >
          <ChevronLeft className="size-4" />
          {story.title}
        </Link>
        {editHref ? (
          <Link href={editHref} className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium">
            Edit
          </Link>
        ) : (
          <ReportControl
            targetKind="blog"
            targetId={blog.slug}
            targetLabel={blog.title}
            targetOwnerUsername={story.creator.username}
            targetOwnerRole="tcc"
          />
        )}
      </div>
      <div className="relative mx-5 mt-4 aspect-[4/3] overflow-hidden rounded-3xl bg-secondary">
        <Cover src={blog.coverUrl || "/blog-thumb.svg"} />
        {locked ? (
          <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white shadow-sm">
            <Lock className="size-3.5" />
          </span>
        ) : null}
      </div>
      <div className="px-5 pt-4">
        <h1 className="font-display text-4xl leading-tight">{blog.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          By{" "}
          <Link href={`/u/${story.creator.username}`} className="text-foreground">
            {story.creator.displayName}
          </Link>
        </p>
      </div>
      {locked ? (
        <div className="mx-5 mt-5 grid gap-4 rounded-3xl bg-secondary p-5">
          <p className="text-sm leading-6">
            This content is purchase only. Please purchase at {formatInr(blog.priceInr ?? 99)}.
          </p>
          <button
            type="button"
            onClick={() => setPurchaseOpen(true)}
            className="rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            Purchase · {formatInr(blog.priceInr ?? 99)}
          </button>
        </div>
      ) : (
        <div
          className="blog-view mt-5 px-5 text-[15px] leading-7"
          dangerouslySetInnerHTML={{ __html: blogMarkup(blog.body) }}
        />
      )}
      <PurchaseSheet
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        storySlug={story.slug}
        kind="blog"
        itemId={blog.slug}
        title={blog.title}
        priceInr={blog.priceInr ?? 99}
        onPurchased={() => {
          setPurchaseOpen(false);
          router.refresh();
        }}
      />
    </article>
  );
}

function Cover({ src }: { src: string }) {
  if (src.includes("images.unsplash.com")) {
    return <Image src={src} alt="" fill className="object-cover" sizes="(min-width: 768px) 42rem, 100vw" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="size-full object-cover" />
  );
}
