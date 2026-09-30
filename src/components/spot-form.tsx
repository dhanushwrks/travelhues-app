"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { PlaceCard, PlacePicker, PlaceSearch, blankPlace, type ChosenPlace } from "@/components/maps";
import { PictureTray } from "@/components/picture-tray";
import { fetchSpotCatalog, seedSpotCatalog, type SpotCatalogItem } from "@/lib/spot-catalog";
import { createDeskSpot, useDesk } from "@/lib/studio-desk";

const field = "w-full rounded-2xl border border-border bg-background px-4 py-3";

const centers: Record<string, { lat: number; lng: number }> = {
  IN: { lat: 22.5, lng: 79 },
  TH: { lat: 15.8, lng: 100.9 },
};

const difficulties = ["Easy", "Moderate", "Hard"];
const seasons = ["Year round", "Dry months", "Cool months", "Monsoon"];
const ages = ["All ages", "Families", "Adults"];

export function SpotForm({ storyId, returnTo }: { storyId: string; returnTo?: string }) {
  const router = useRouter();
  const back = returnTo ?? `/studio/${storyId}?tab=spots`;
  const { stories } = useDesk();
  const story = stories.find((item) => item.id === storyId);
  const center = centers[story?.country ?? ""] ?? centers.IN;

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tips, setTips] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [catalog, setCatalog] = useState<SpotCatalogItem[]>(seedSpotCatalog);
  const [placeName, setPlaceName] = useState("");
  const [placeCard, setPlaceCard] = useState<ChosenPlace | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [cost, setCost] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [season, setSeason] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const chosen = catalog.find((item) => item.slug === category);

  useEffect(() => {
    let active = true;
    void fetchSpotCatalog().then((next) => {
      if (active) setCatalog(next);
    });
    return () => {
      active = false;
    };
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Add a name");
      return;
    }
    if (summary.trim().length < 20) {
      setError("About needs at least a sentence");
      return;
    }
    if (!category) {
      setError("Choose a category");
      return;
    }
    if (!placeName.trim()) {
      setError("Name the place");
      return;
    }
    if (lat == null || lng == null) {
      setError("Drop a pin on the map");
      return;
    }
    if (images.length === 0) {
      setError("Add at least one picture");
      return;
    }
    if (!validLink(affiliateUrl) || !validLink(referenceUrl)) {
      setError("Links need to start with https://");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await createDeskSpot(storyId, {
        title: title.trim(),
        summary: summary.trim(),
        tips: tips.trim(),
        category,
        subcategory,
        placeName: placeName.trim(),
        lat,
        lng,
        images,
        duration: duration.trim(),
        cost: cost.trim(),
        difficulty,
        season,
        ageGroup,
        affiliateUrl: affiliateUrl.trim(),
        referenceUrl: referenceUrl.trim(),
      });
      router.push(back);
      router.refresh();
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Could not save the spot");
    }
  }

  return (
    <form onSubmit={save} className="grid h-full gap-5 overflow-y-auto px-5 pt-5 pb-10 md:mx-auto md:max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={back} className="text-sm font-medium" aria-label="Story">
          ←
        </Link>
        <h1 className="text-lg font-medium">New spot</h1>
      </div>
      <p className="text-sm leading-6">
        <span className="font-medium">What is a spot?</span> One stop in this story. A room, a meal, a walk, a shop.
        Plans line these up by day.
      </p>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Name</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="The place, in a few words" className={field} />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">About it</span>
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={5}
          placeholder="What you would tell a friend before they go"
          className={field}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Tips</span>
        <span className="text-muted-foreground">Optional. A trick worth knowing before they go.</span>
        <textarea
          value={tips}
          onChange={(event) => setTips(event.target.value)}
          rows={4}
          placeholder="Go before noon. Cash is easier than a card."
          className={field}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Category</span>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setSubcategory("");
            }}
            className={field}
          >
            <option value="">Choose one</option>
            {catalog.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Kind</span>
          <select
            value={subcategory}
            onChange={(event) => setSubcategory(event.target.value)}
            disabled={!chosen}
            className={field}
          >
            <option value="">{chosen ? "Choose one" : "Pick a category first"}</option>
            {chosen ? chosen.kinds.map((item) => <option key={item}>{item}</option>) : null}
          </select>
        </label>
      </div>
      <div className="grid gap-2 text-sm">
        <span className="font-medium">Where is it</span>
        <span className="text-muted-foreground">Search for the place. The card under the map is the one travelers can trust.</span>
        <PlaceSearch
          country={story?.country}
          center={center}
          onChoose={(place) => {
            setPlaceCard(place);
            setPlaceName(place.name);
            setLat(place.lat);
            setLng(place.lng);
          }}
        />
        <div className="overflow-hidden rounded-3xl border border-border">
          <PlacePicker
            lat={lat}
            lng={lng}
            centerLat={center.lat}
            centerLng={center.lng}
            onPick={(nextLat, nextLng) => {
              setLat(nextLat);
              setLng(nextLng);
              setPlaceCard((current) =>
                current && Math.abs(current.lat - nextLat) < 0.0002 && Math.abs(current.lng - nextLng) < 0.0002
                  ? current
                  : blankPlace({
                      name: current?.name || "Pinned place",
                      lat: nextLat,
                      lng: nextLng,
                    }),
              );
            }}
            onNamed={(name) => {
              setPlaceName((current) => current || name);
              setPlaceCard((current) => (current && current.name !== "Pinned place" ? current : current ? { ...current, name } : current));
            }}
          />
          {placeCard ? <PlaceCard place={placeCard} /> : (
            <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
              The place card shows up here, with a photo, rating, and the address.
            </p>
          )}
        </div>
        <label className="relative">
          <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={placeName}
            onChange={(event) => setPlaceName(event.target.value)}
            placeholder="Place name"
            aria-label="Place name"
            className={`${field} pl-10`}
          />
        </label>
      </div>
      <PictureTray images={images} onChange={setImages} />
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Practical details</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            <span>Duration</span>
            <input value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="45 min" className={field} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Estimated cost</span>
            <input
              inputMode="numeric"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              placeholder="Baht"
              className={field}
            />
          </label>
          <Select label="Difficulty" value={difficulty} options={difficulties} onChange={setDifficulty} />
          <Select label="Season" value={season} options={seasons} onChange={setSeason} />
        </div>
        <Select label="Age group" value={ageGroup} options={ages} onChange={setAgeGroup} />
      </fieldset>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Booking link</span>
        <span className="text-muted-foreground">Optional. Only if you send people somewhere to book.</span>
        <input
          value={affiliateUrl}
          onChange={(event) => setAffiliateUrl(event.target.value)}
          placeholder="https://"
          inputMode="url"
          className={field}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Reference</span>
        <span className="text-muted-foreground">Optional. The official page, if there is one.</span>
        <input
          value={referenceUrl}
          onChange={(event) => setReferenceUrl(event.target.value)}
          placeholder="https://"
          inputMode="url"
          className={field}
        />
      </label>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <Link href={back} className="rounded-full border border-border px-4 py-3 text-center text-sm font-medium">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Saving" : "Create spot"}
        </button>
      </div>
    </form>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={field}>
        <option value="">Not needed</option>
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function validLink(value: string) {
  const trimmed = value.trim();
  return trimmed === "" || /^https:\/\/\S+$/i.test(trimmed);
}
