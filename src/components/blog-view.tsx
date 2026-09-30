import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
        ) : null}
      </div>
      <div className="relative mx-5 mt-4 aspect-[4/3] overflow-hidden rounded-3xl bg-secondary">
        <Cover src={blog.coverUrl || "/blog-thumb.svg"} />
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
      <div
        className="blog-view mt-5 px-5 text-[15px] leading-7"
        dangerouslySetInnerHTML={{ __html: blogMarkup(blog.body) }}
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
