"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { kindLabel, piecesServerSnapshot, piecesSnapshot, studioKinds, subscribeStudio } from "@/lib/mock/studio";

export function StudioHome() {
  const pieces = useSyncExternalStore(subscribeStudio, piecesSnapshot, piecesServerSnapshot);

  return (
    <div className="h-full overflow-y-auto px-5 pt-6 pb-10">
      <h1 className="font-display text-3xl">Studio</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Stories, spots, itineraries, and blogs. This desk is sample content until the API is connected.
      </p>
      {studioKinds.map((kind) => {
        const items = pieces.filter((piece) => piece.kind === kind);
        return (
          <section key={kind} className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl">{kindLabel[kind]}</h2>
              <Link href={`/studio/new?kind=${kind}`} className="text-sm text-primary">
                New
              </Link>
            </div>
            {items.length === 0 ? (
              <p className="pt-2 text-sm text-muted-foreground">Nothing here yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {items.map((piece) => (
                  <li key={piece.id}>
                    <Link href={`/studio/${piece.kind}/${piece.id}`} className="block py-3">
                      <span className="block font-medium">{piece.title}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{piece.summary}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {piece.status === "published" ? "Published" : "Draft"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
