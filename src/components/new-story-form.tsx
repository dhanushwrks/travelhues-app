"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Loader } from "@/components/loader";
import { apiBase } from "@/lib/api";
import { readCookie } from "@/lib/browser-session";

const api = apiBase;

export function NewStoryForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "");
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    try {
      const response = await fetch(`${api}/stories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${readCookie("th_access")}`,
        },
        body: JSON.stringify({
          slug,
          title,
          summary: form.get("summary"),
          coverUrl: form.get("coverUrl"),
          destination: {
            name: form.get("destination"),
            country: form.get("country"),
            lat: Number(form.get("lat")),
            lng: Number(form.get("lng")),
          },
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string | string[];
        slug?: string;
      };
      if (!response.ok) {
        const message = Array.isArray(payload.message)
          ? payload.message.join(" ")
          : payload.message;
        setError(message || "Could not create the story");
        return;
      }
      router.push(`/stories/${payload.slug ?? slug}`);
      router.refresh();
    } catch {
      setError("Could not reach Travelhues");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 overflow-y-auto px-5 pt-8 pb-10">
      <h1 className="font-display text-3xl">New story</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        This story is yours. Travelers will see it after you save.
      </p>
      <Label name="title" label="Title" />
      <Label name="summary" label="Summary" area />
      <Label name="coverUrl" label="Cover image URL" />
      <Label name="destination" label="Place" />
      <Label name="country" label="Country" />
      <Label name="lat" label="Latitude" type="number" defaultValue="13.7563" />
      <Label name="lng" label="Longitude" type="number" defaultValue="100.5018" />
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader label="Saving" /> : "Save story"}
      </button>
    </form>
  );
}

function Label({
  name,
  label,
  type = "text",
  area = false,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  area?: boolean;
  defaultValue?: string;
}) {
  const className = "rounded-2xl border border-border bg-background px-4 py-3";
  return (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      {area ? (
        <textarea name={name} required className={`${className} min-h-24`} />
      ) : (
        <input
          name={name}
          type={type}
          required
          step="any"
          defaultValue={defaultValue}
          className={className}
        />
      )}
    </label>
  );
}
