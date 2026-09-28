"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { countryFlag } from "@/lib/countries";
import { createDeskStory } from "@/lib/studio-desk";

export function StoryForm({ countries }: { countries: { code: string; name: string }[] }) {
  const router = useRouter();
  const [country, setCountry] = useState(countries[0]?.code ?? "");
  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onCover(file: File | undefined) {
    if (!file) return;
    setError("");
    setReading(true);
    try {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        throw new Error("Cover must be a JPEG or PNG");
      }
      if (file.size > 2_000_000) throw new Error("Cover must be under 2 MB");
      setCoverUrl(await readDataUrl(file));
    } catch (caught) {
      setCoverUrl("");
      setError(caught instanceof Error ? caught.message : "Could not read that picture");
    } finally {
      setReading(false);
    }
  }

  async function onVideo(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!["video/mp4", "video/quicktime"].includes(file.type)) {
      setError("Video must be an MP4 or MOV");
      return;
    }
    if (file.size > 100_000_000) {
      setError("Video must be under 100 MB");
      return;
    }
    setVideoUrl(URL.createObjectURL(file));
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!country) {
      setError("Choose a country");
      return;
    }
    if (!title.trim()) {
      setError("Add a title");
      return;
    }
    if (about.trim().length < 20) {
      setError("About needs at least a sentence");
      return;
    }
    if (!coverUrl) {
      setError("Upload a cover picture");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const id = await createDeskStory({
        country,
        title: title.trim(),
        about: about.trim(),
        coverUrl,
      });
      router.push(`/studio/${id}`);
      router.refresh();
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Could not save the story");
    }
  }

  return (
    <form onSubmit={create} className="relative grid h-full gap-5 overflow-y-auto px-5 pt-5 pb-10 md:mx-auto md:max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/studio" className="text-sm font-medium" aria-label="Studio">
          ←
        </Link>
        <h1 className="text-lg font-medium">New story</h1>
      </div>
      <p className="text-sm leading-6">
        <span className="font-medium">What is a story?</span> A story is one country you know well enough to share:
        the places worth stopping, a plan for the days, and the notes you would send a friend.
      </p>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Country</span>
        <select
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className="rounded-2xl border border-border bg-background px-4 py-3"
        >
          {countries.length === 0 ? <option value="">No countries are open</option> : null}
          {countries.map((item) => (
            <option key={item.code} value={item.code}>
              {countryFlag(item.code)} {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Story title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title for your story"
          className="rounded-2xl border border-border bg-background px-4 py-3"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">About it</span>
        <textarea
          value={about}
          onChange={(event) => setAbout(event.target.value)}
          rows={5}
          placeholder="The overview of the journey"
          className="rounded-2xl border border-border bg-background px-4 py-3"
        />
      </label>
      <UploadWell
        label="Cover picture"
        hint="JPEG or PNG, under 2 MB"
        changeLabel="Change picture"
        preview={coverUrl}
        accept="image/jpeg,image/png"
        onFile={(file) => void onCover(file)}
      />
      <UploadWell
        label="Highlight video"
        hint="A short glimpse of the story. MP4 or MOV, under 100 MB"
        changeLabel="Change video"
        video={videoUrl}
        accept="video/mp4,video/quicktime"
        onFile={(file) => void onVideo(file)}
      />
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/studio" className="rounded-full border border-border px-4 py-3 text-center text-sm font-medium">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={reading || saving}
          className="rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Saving" : "Create story"}
        </button>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        After this, you can add spots, a plan, and blogs inside the story.
      </p>
    </form>
  );
}

function UploadWell({
  label,
  hint,
  changeLabel,
  preview,
  video,
  accept,
  onFile,
}: {
  label: string;
  hint: string;
  changeLabel: string;
  preview?: string;
  video?: string;
  accept: string;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <div className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{hint}</span>
      {video ? (
        <video src={video} controls playsInline className="w-full rounded-2xl bg-black" />
      ) : (
        <label className="grid min-h-40 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-foreground/25 text-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="max-h-48 w-full object-cover" />
          ) : (
            <span className="px-4 py-8">
              <span className="block font-medium">Upload</span>
              <span className="mt-1 block text-muted-foreground">{hint}</span>
            </span>
          )}
          <input type="file" accept={accept} onChange={(event) => onFile(event.target.files?.[0])} className="sr-only" />
        </label>
      )}
      {preview || video ? (
        <label className="w-fit cursor-pointer text-sm text-primary">
          {changeLabel}
          <input type="file" accept={accept} onChange={(event) => onFile(event.target.files?.[0])} className="sr-only" />
        </label>
      ) : null}
    </div>
  );
}

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that picture"));
    reader.readAsDataURL(file);
  });
}
