"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { BlogEditor } from "@/components/blog-editor";
import { PlanForm } from "@/components/plan-form";
import { SpotForm } from "@/components/spot-form";
import { blogExcerpt, type StoryTab } from "@/lib/mock/studio";
import { addDeskBlog, refreshDesk, useDesk } from "@/lib/studio-desk";

const titles: Record<StoryTab, string> = {
  spots: "New spot",
  plans: "New plan",
  blogs: "New blog",
};

export function StoryPieceForm({
  storyId,
  tab,
  fromPlan = false,
}: {
  storyId: string;
  tab: StoryTab;
  fromPlan?: boolean;
}) {
  const router = useRouter();
  useDesk();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  if (tab === "spots") {
    return <SpotForm storyId={storyId} returnTo={fromPlan ? `/studio/${storyId}/plans/new` : undefined} />;
  }
  if (tab === "plans") return <PlanForm storyId={storyId} />;

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
    await refreshDesk();
    try {
      await addDeskBlog(storyId, { id: `blog-${Date.now()}`, title: title.trim(), body });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the blog");
      return;
    }
    router.push(`/studio/${storyId}?tab=${tab}`);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="grid h-full gap-4 overflow-y-auto px-5 pt-5 pb-10 md:mx-auto md:max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/studio/${storyId}`} className="text-sm font-medium" aria-label="Story">
          ←
        </Link>
        <h1 className="text-lg font-medium">{titles[tab]}</h1>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-2xl border border-border bg-background px-4 py-3"
        />
      </label>
      <div className="grid gap-1 text-sm">
        <span className="font-medium">Post</span>
        <BlogEditor onChange={setBody} />
      </div>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <button type="submit" className="rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">
        Save
      </button>
    </form>
  );
}
