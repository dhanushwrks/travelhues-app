import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BlogView } from "@/components/blog-view";
import { loadStory } from "@/lib/remote";
import { requireSession } from "@/lib/session";
import { blogHref } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ creator: string; slug: string; blogSlug: string }>;
}): Promise<Metadata> {
  const { slug, blogSlug } = await params;
  const session = await requireSession();
  const story = await loadStory(session.token, slug);
  const blog = story?.blogs?.find((item) => item.slug === blogSlug && !item.archived);
  if (!blog) return { title: "Blog" };
  return { title: blog.title };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ creator: string; slug: string; blogSlug: string }>;
}) {
  const { creator, slug, blogSlug } = await params;
  const session = await requireSession();
  const story = await loadStory(session.token, slug);
  const blog = story?.blogs?.find((item) => item.slug === blogSlug && !item.archived);
  if (!story || !blog) notFound();
  if (story.creator.username !== creator) redirect(blogHref(story, blogSlug));

  return (
    <BlogView
      story={story}
      blog={blog}
      editHref={
        session.role === "tcc" && session.username === story.creator.username
          ? `/studio/${story.slug}/blogs/${blog.slug}/edit`
          : undefined
      }
    />
  );
}
