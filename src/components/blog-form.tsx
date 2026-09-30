"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ArchiveAction } from "@/components/archive-action";
import { BlogEditor } from "@/components/blog-editor";
import { compressImage } from "@/components/profile-fields";
import { Loader, PageLoader } from "@/components/loader";
import { blogExcerpt } from "@/lib/mock/studio";
import { addDeskBlog, updateDeskBlog, useDesk, useDeskHome } from "@/lib/studio-desk";

export function BlogForm({ storyId, blogId }: { storyId: string; blogId?: string }) {
  const router = useRouter();
  const home = useDeskHome();
  const { stories, status, problem } = useDesk();
  const story = stories.find((item) => item.id === storyId);
  const existing = blogId ? story?.blogs.find((item) => item.id === blogId) : undefined;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loaded, setLoaded] = useState(blogId ? "" : "new");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (blogId && existing && loaded !== existing.id) {
    setLoaded(existing.id);
    setTitle(existing.title);
    setBody(existing.body);
    setCoverUrl(existing.coverUrl ?? "");
  }

  if (blogId && !story && status !== "ready") {
    return (
      <div className="px-5 pt-6">
        <PageLoader label="Loading the blog" />
      </div>
    );
  }
  if (blogId && status === "error") {
    return <p className="px-5 pt-6 text-sm text-primary">{problem}</p>;
  }
  if (blogId && status === "ready" && !story) {
    return (
      <div className="px-5 pt-6">
        <p className="text-sm text-muted-foreground">That story is not in your studio.</p>
      </div>
    );
  }
  if (blogId && story && !existing) {
    return (
      <div className="px-5 pt-6">
        <Link href={`${home}/${storyId}?tab=blogs`} className="text-sm font-medium">
          ←
        </Link>
        <p className="pt-6 text-sm text-muted-foreground">That blog is not in this story.</p>
      </div>
    );
  }
  if (blogId && !loaded) return <PageLoader label="Loading the blog" />;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Add a title");
      return;
    }
    if (blogExcerpt(body).length < 12) {
      setError("Write a little more of the post");
      return;
    }
    setPending(true);
    try {
      const blog = { id: blogId ?? `blog-${Date.now()}`, title: title.trim(), body, coverUrl };
      if (blogId) await updateDeskBlog(storyId, blogId, blog);
      else await addDeskBlog(storyId, blog);
    } catch (caught) {
      setPending(false);
      setError(caught instanceof Error ? caught.message : "Could not save the blog");
      return;
    }
    router.push(blogId ? `${home}/${storyId}/blogs/${blogId}` : `${home}/${storyId}?tab=blogs`);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="grid h-full gap-4 overflow-y-auto px-5 pt-5 pb-10 md:mx-auto md:max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={blogId ? `${home}/${storyId}/blogs/${blogId}` : `${home}/${storyId}?tab=blogs`} className="text-sm font-medium">
          ←
        </Link>
        <h1 className="text-lg font-medium">{blogId ? "Edit blog" : "New blog"}</h1>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-2xl border border-border bg-background px-4 py-3"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Picture</span>
        <span className="text-muted-foreground">Optional. A thumbnail is used when this is empty.</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void compressImage(file, 1920)
              .then((next) => {
                setCoverUrl(next);
                setError("");
              })
              .catch((caught: unknown) => {
                setError(caught instanceof Error ? caught.message : "Could not read that picture");
              });
          }}
        />
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
        ) : null}
      </label>
      <div className="grid gap-1 text-sm">
        <span className="font-medium">Post</span>
        <BlogEditor key={loaded} value={body} onChange={setBody} />
      </div>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      {blogId && existing ? (
        <ArchiveAction
          storyId={storyId}
          kind="blogs"
          itemId={blogId}
          archived={existing.archived ?? false}
        />
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader label="Saving" /> : "Save"}
      </button>
    </form>
  );
}
