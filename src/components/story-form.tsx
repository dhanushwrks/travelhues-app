"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { BackLink } from "@/components/back-link";
import { Loader, PageLoader } from "@/components/loader";
import { countryFlag } from "@/lib/countries";
import { createDeskStory, updateDeskStory, useDesk, useDeskHome } from "@/lib/studio-desk";

export function StoryForm({
  countries,
  storyId,
}: {
  countries: { code: string; name: string }[];
  storyId?: string;
}) {
  const router = useRouter();
  const home = useDeskHome();
  const trip = home === "/plans";
  const editing = Boolean(storyId);
  const { stories, status, problem } = useDesk();
  const existing = storyId ? stories.find((item) => item.id === storyId) : undefined;

  const [country, setCountry] = useState(countries[0]?.code ?? "");
  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [hydrated, setHydrated] = useState(!editing);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing || !existing || hydrated) return;
    setCountry(existing.country);
    setTitle(existing.title);
    setAbout(existing.about);
    setCoverUrl(existing.coverUrl);
    setVideoUrl(existing.videoUrl);
    setHydrated(true);
  }, [editing, existing, hydrated]);

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

  async function save(event: FormEvent) {
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
      const payload = {
        country,
        title: title.trim(),
        about: about.trim(),
        coverUrl,
      };
      if (storyId) {
        await updateDeskStory(storyId, payload);
        router.push(`${home}/${storyId}`);
      } else {
        const id = await createDeskStory(payload);
        router.push(`${home}/${id}`);
      }
      router.refresh();
    } catch (caught) {
      setSaving(false);
      setError(
        caught instanceof Error
          ? caught.message
          : trip
            ? "Could not save the trip"
            : "Could not save the story",
      );
    }
  }

  if (editing && !existing && status !== "ready") {
    return (
      <div className="px-5 pt-6">
        <BackLink href={home} />
        {status === "error" ? (
          <p className="pt-6 text-sm text-primary">{problem}</p>
        ) : (
          <PageLoader label={trip ? "Loading the trip" : "Loading the story"} />
        )}
      </div>
    );
  }

  if (editing && !existing) {
    return (
      <div className="px-5 pt-6">
        <BackLink href={home} />
        <p className="pt-6 text-sm text-muted-foreground">
          {trip ? "That trip is not in your list." : "That story is not on this desk."}
        </p>
      </div>
    );
  }

  const back = storyId ? `${home}/${storyId}` : home;
  const heading = editing
    ? trip
      ? "Edit trip"
      : "Edit story"
    : trip
      ? "New trip"
      : "New story";

  return (
    <form onSubmit={save} className="relative grid h-full gap-5 overflow-y-auto px-5 pt-5 pb-10 md:mx-auto md:max-w-2xl">
      <div className="flex items-center gap-3">
        <BackLink href={back} label={trip ? "My plans" : "Studio"} />
        <h1 className="text-lg font-medium">{heading}</h1>
      </div>
      {editing ? null : (
        <p className="text-sm leading-6">
          {trip ? (
            <>
              <span className="font-medium">What is a trip?</span> A plan is one place you are planning. You add the
              finds yourself, then build an itinerary from those finds.
            </>
          ) : (
            <>
              <span className="font-medium">What is a story?</span> A story is one country you know well enough to share:
              the places worth stopping, a plan for the days, and the notes you would send a friend.
            </>
          )}
        </p>
      )}
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
        <span className="font-medium">{trip ? "Trip title" : "Story title"}</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={trip ? "Title for your trip" : "Title for your story"}
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
      {trip ? null : (
        <UploadWell
          label="Highlight video"
          hint="A short video of the story. MP4 or MOV, under 100 MB"
          changeLabel="Change video"
          video={videoUrl}
          accept="video/mp4,video/quicktime"
          onFile={(file) => void onVideo(file)}
        />
      )}
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <Link href={back} className="rounded-full border border-border px-4 py-3 text-center text-sm font-medium">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={reading || saving || (editing && !hydrated)}
          className="flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving || reading ? (
            <Loader label={reading ? "Reading photo" : "Saving"} />
          ) : editing ? (
            "Save"
          ) : trip ? (
            "Create trip"
          ) : (
            "Create story"
          )}
        </button>
      </div>
      {editing ? null : (
        <p className="text-sm leading-6 text-muted-foreground">
          {trip
            ? "After this, add finds, then build an itinerary from those finds."
            : "After this, you can add finds, a plan, and blogs inside the story."}
        </p>
      )}
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
