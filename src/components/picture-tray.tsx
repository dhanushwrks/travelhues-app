"use client";

import { useState } from "react";

import { compressImage } from "@/components/profile-fields";

export function PictureTray({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [error, setError] = useState("");

  async function add(list: FileList | null) {
    if (!list) return;
    const next = [...images];
    for (const file of list) {
      if (next.length >= 5) break;
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setError("Pictures must be JPEG or PNG");
        return;
      }
      if (file.size > 5_000_000) {
        setError("Each picture must be under 5 MB");
        return;
      }
      try {
        next.push(await compressImage(file, 1920));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not read that picture");
        return;
      }
    }
    setError("");
    onChange(next);
  }

  return (
    <div className="grid gap-2 text-sm">
      <span className="font-medium">Pictures</span>
      <span className="text-muted-foreground">Up to five. JPEG or PNG, under 5 MB each.</span>
      <ul className="grid grid-cols-3 gap-2">
        {images.map((src, index) => (
          <li key={src.slice(0, 48) + index} className="relative aspect-square overflow-hidden rounded-2xl bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, item) => item !== index))}
              className="absolute top-1.5 right-1.5 rounded-full bg-background/90 px-2 py-0.5 text-xs"
            >
              Remove
            </button>
          </li>
        ))}
        {images.length < 5 ? (
          <li className={images.length === 0 ? "col-span-3" : ""}>
            <label
              className={`grid cursor-pointer place-items-center rounded-2xl border border-dashed border-foreground/25 text-center ${
                images.length === 0 ? "min-h-36" : "aspect-square"
              }`}
            >
              <span>
                <span className="block font-medium">Upload</span>
                <span className="mt-1 block text-xs text-muted-foreground">JPEG or PNG</span>
              </span>
              <input
                key={images.length}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                className="sr-only"
                onChange={(event) => void add(event.target.files)}
              />
            </label>
          </li>
        ) : null}
      </ul>
      {error ? <p className="text-primary">{error}</p> : null}
    </div>
  );
}
