"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Loader } from "@/components/loader";
import { Field, controlClass } from "@/components/profile-fields";
import { apiBase, apiMessage } from "@/lib/api";
import { readCookie } from "@/lib/browser-session";
import type { Story } from "@/lib/types";

export function GlimpseForm({
  stories,
  countries,
}: {
  stories: Story[];
  countries: { code: string; name: string }[];
}) {
  const router = useRouter();
  const open = countries;
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [storySlug, setStorySlug] = useState("");
  const [attachment, setAttachment] = useState("story");
  const story = stories.find((item) => item.slug === storySlug);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const link = storySlug
      ? attachment === "itinerary"
        ? { kind: "itinerary", storySlug, itinerarySlug: String(form.get("itinerarySlug") ?? "") }
        : attachment === "spot"
          ? { kind: "spot", storySlug, spotId: String(form.get("spotId") ?? "") }
          : { kind: "story", storySlug }
      : null;
    const response = await fetch(`${apiBase}/glimpses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${readCookie("th_access")}`,
      },
      body: JSON.stringify({
        caption: form.get("caption"),
        videoUrl: form.get("videoUrl"),
        posterUrl: form.get("posterUrl") || undefined,
        country: form.get("country"),
        link,
      }),
    });
    setPending(false);
    if (!response.ok) {
      setError(await apiMessage(response));
      return;
    }
    router.push("/hues");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 px-5 pt-8 pb-12">
      <h1 className="font-display text-3xl">Add a short</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        A short video. You can point it at a story, a day plan, or a find.
      </p>
      <Field label="Caption" hint="Up to 140 characters">
        <textarea name="caption" required maxLength={140} className={`${controlClass} min-h-24`} />
      </Field>
      <Field label="Video address" hint="A direct mp4 or webm link">
        <input name="videoUrl" type="url" required className={controlClass} placeholder="https://" />
      </Field>
      <Field label="Poster address" hint="Optional still image">
        <input name="posterUrl" type="url" className={controlClass} placeholder="https://" />
      </Field>
      <Field label="Country">
        <select name="country" required className={controlClass} defaultValue="">
          <option value="" disabled>
            {open.length ? "Choose" : "No countries are open"}
          </option>
          {open.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Link">
        <select
          className={controlClass}
          value={storySlug}
          onChange={(event) => setStorySlug(event.target.value)}
        >
          <option value="">No link</option>
          {stories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.title}
            </option>
          ))}
        </select>
      </Field>
      {story ? (
        <Field label="Attach">
          <select
            className={controlClass}
            value={attachment}
            onChange={(event) => setAttachment(event.target.value)}
          >
            <option value="story">The story</option>
            <option value="itinerary">An itinerary</option>
            <option value="spot">A find</option>
          </select>
        </Field>
      ) : null}
      {story && attachment === "itinerary" ? (
        <Field label="Itinerary">
          <select name="itinerarySlug" required className={controlClass} defaultValue="">
            <option value="" disabled>
              Choose
            </option>
            {story.itineraries.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {story && attachment === "spot" ? (
        <Field label="Find">
          <select name="spotId" required className={controlClass} defaultValue="">
            <option value="" disabled>
              Choose
            </option>
            {story.spots.map((spot) => (
              <option key={spot.id} value={spot.id}>
                {spot.title}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || open.length === 0}
        className="flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader label="Posting" /> : "Post hue"}
      </button>
    </form>
  );
}
