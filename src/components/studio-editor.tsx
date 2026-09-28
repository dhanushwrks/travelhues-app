"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import {
  kindSingular,
  piecesServerSnapshot,
  piecesSnapshot,
  savePiece,
  subscribeStudio,
  type StudioKind,
  type StudioPiece,
} from "@/lib/mock/studio";

export function StudioEditor({
  kind,
  pieceId,
}: {
  kind: StudioKind;
  pieceId?: string;
}) {
  const router = useRouter();
  const pieces = useSyncExternalStore(subscribeStudio, piecesSnapshot, piecesServerSnapshot);
  const found = pieceId ? pieces.find((piece) => piece.kind === kind && piece.id === pieceId) : undefined;
  const [title, setTitle] = useState(found?.title ?? "");
  const [summary, setSummary] = useState(found?.summary ?? "");
  const [status, setStatus] = useState<StudioPiece["status"]>(found?.status ?? "draft");
  const [error, setError] = useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || summary.trim().length < 12) {
      setError("Add a title and a short summary.");
      return;
    }
    savePiece({
      id: pieceId || `${kind}-${Date.now()}`,
      kind,
      title: title.trim(),
      summary: summary.trim(),
      status,
    });
    router.push("/studio");
    router.refresh();
  }

  const singular = kindSingular[kind];

  return (
    <form onSubmit={onSubmit} className="grid gap-4 px-5 pt-6 pb-10">
      <Link href="/studio" className="text-sm text-primary">
        Studio
      </Link>
      <h1 className="font-display text-3xl">{pieceId ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`}</h1>
      {pieceId && !found ? (
        <p className="text-sm text-muted-foreground">That piece is not in the sample desk.</p>
      ) : (
        <>
          <label className="grid gap-1 text-sm">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Summary
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={4}
              className="rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as StudioPiece["status"])}
              className="rounded-2xl border border-border bg-background px-4 py-3"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          {error ? <p className="text-sm text-primary">{error}</p> : null}
          <button type="submit" className="rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">
            Save
          </button>
          <p className="text-sm text-muted-foreground">Saved on this phone only, until the API exists.</p>
        </>
      )}
    </form>
  );
}
