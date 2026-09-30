"use client";

import { LocateFixed, Search, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const apiKey =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCXkJRf9b0Y0d3bfiHNVUzG89FUdgx8Glk";

type LoaderMaps = {
  Map?: typeof google.maps.Map;
  importLibrary?: (name: string) => Promise<unknown>;
  __ib__?: () => void;
};

let mapsPromise: Promise<void> | null = null;
let placesBlocked = false;

function mapsHolder() {
  const holder = window as unknown as { google?: { maps?: LoaderMaps } };
  holder.google ??= {};
  holder.google.maps ??= {};
  return holder.google.maps;
}

function ensureLoader() {
  if (!apiKey) throw new Error("Missing Google Maps API key");
  const maps = mapsHolder();
  if (typeof maps.importLibrary === "function") return;

  const requested = new Set<string>();
  let loading: Promise<void> | null = null;
  const bootstrap = (name: string) => {
    requested.add(name);
    loading ??= new Promise<void>((resolve, reject) => {
      const params = new URLSearchParams({
        key: apiKey,
        v: "weekly",
        libraries: [...requested].join(","),
        callback: "google.maps.__ib__",
      });
      maps.__ib__ = () => resolve();
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      script.async = true;
      script.onerror = () => {
        loading = null;
        reject(new Error("Google Maps failed to load"));
      };
      document.head.appendChild(script);
    });
    return loading.then(() => {
      const current = mapsHolder().importLibrary;
      if (current && current !== bootstrap) return current(name);
      return undefined;
    });
  };
  maps.importLibrary = bootstrap;
}

function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.Map) return Promise.resolve();
  if (!apiKey) return Promise.reject(new Error("Missing Google Maps API key"));
  if (!mapsPromise) {
    try {
      ensureLoader();
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error("Missing Google Maps API key"));
    }
    const load = mapsHolder().importLibrary;
    if (!load) {
      mapsPromise = Promise.reject(new Error("Google Maps failed to load"));
    } else {
      mapsPromise = load("maps")
        .then(() => undefined)
        .catch((error: unknown) => {
          mapsPromise = null;
          throw error;
        });
    }
  }
  return mapsPromise;
}

function placeSearchError(reason: unknown) {
  const message = reason instanceof Error ? reason.message : "";
  if (/permission|not allowed|REQUEST_DENIED|ApiNotActivatedMapError/i.test(message)) {
    return "Place search is not enabled for this map key yet.";
  }
  return message || "Place search is not available";
}

function loadPlaces() {
  return loadGoogleMaps().then(async () => {
    if (window.google.maps.places?.AutocompleteSuggestion) return;
    if (typeof window.google.maps.importLibrary !== "function") {
      throw new Error("Place search is not available");
    }
    await window.google.maps.importLibrary("places");
  });
}

function circleIcon(scale: number) {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale,
    fillColor: "#e12e2f",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

const quietMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#efece6" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5c6570" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#efece6" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e6e2da" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d7e4d4" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e3dfd6" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8b9198" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f7f4ef" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c5d5e4" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6a7f90" }] },
];

function quietMapOptions(options: google.maps.MapOptions): google.maps.MapOptions {
  return {
    styles: quietMapStyle,
    renderingType: google.maps.RenderingType.RASTER,
    backgroundColor: "#efece6",
    clickableIcons: false,
    keyboardShortcuts: false,
    cameraControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    rotateControl: false,
    scaleControl: false,
    zoomControl: true,
    ...options,
  };
}

export type MapPoint = {
  id: string;
  lng: number;
  lat: number;
  label: string;
};

function MapFallback({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-40 items-center justify-center bg-muted px-5 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function RouteMap({
  points,
  onSelect,
}: {
  points: MapPoint[];
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const markers: google.maps.Marker[] = [];
    let line: google.maps.Polyline | null = null;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const map =
          mapRef.current ??
          new google.maps.Map(
            containerRef.current,
            quietMapOptions({
              center: { lat: 15.5, lng: 100.5 },
              zoom: 5,
            }),
          );
        mapRef.current = map;

        if (points.length > 1) {
          line = new google.maps.Polyline({
            map,
            path: points.map((point) => ({ lat: point.lat, lng: point.lng })),
            strokeColor: "#e12e2f",
            strokeOpacity: 0.9,
            strokeWeight: 3,
          });
        }

        points.forEach((point, index) => {
          const marker = new google.maps.Marker({
            map,
            position: { lat: point.lat, lng: point.lng },
            title: point.label,
            icon: circleIcon(14),
            label: {
              text: String(index + 1),
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: "600",
              fontFamily: "Sora, sans-serif",
            },
          });
          marker.addListener("click", () => onSelectRef.current(point.id));
          markers.push(marker);
        });

        if (points.length === 1) {
          map.setCenter({ lat: points[0].lat, lng: points[0].lng });
          map.setZoom(13);
          return;
        }
        if (points.length > 1) {
          const bounds = new google.maps.LatLngBounds();
          points.forEach((point) =>
            bounds.extend({ lat: point.lat, lng: point.lng }),
          );
          map.fitBounds(bounds, 48);
        }
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      });

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.setMap(null));
      line?.setMap(null);
    };
  }, [points]);

  if (error) return <MapFallback message={error} />;

  return <div ref={containerRef} className="h-full min-h-40 w-full" />;
}

export type PlaceQuote = {
  author: string;
  rating: number | null;
  text: string;
  when: string;
};

export type ChosenPlace = {
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating: number | null;
  ratingCount: number | null;
  type: string;
  summary: string;
  reviewSummary: string;
  reviews: PlaceQuote[];
  photoUrl: string;
  placeId: string;
  source: "google" | "map";
};

export function blankPlace(partial: Pick<ChosenPlace, "name" | "lat" | "lng"> & Partial<ChosenPlace>): ChosenPlace {
  return {
    address: "",
    rating: null,
    ratingCount: null,
    type: "",
    summary: "",
    reviewSummary: "",
    reviews: [],
    photoUrl: "",
    placeId: "",
    source: "map",
    ...partial,
  };
}

type PlaceHit = {
  id: string;
  title: string;
  detail: string;
  source: "google" | "osm";
  prediction?: google.maps.places.PlacePrediction;
  lat?: number;
  lng?: number;
};

async function nominatimSearch(text: string, country?: string): Promise<PlaceHit[]> {
  const params = new URLSearchParams({ q: text, format: "jsonv2", limit: "5" });
  if (country && /^[A-Za-z]{2}$/.test(country)) params.set("countrycodes", country.toLowerCase());
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Place search is not available");
  const rows = (await response.json()) as Array<{
    place_id: number;
    name?: string;
    display_name: string;
    lat: string;
    lon: string;
  }>;
  return rows.map((row) => ({
    id: String(row.place_id),
    title: row.name || row.display_name.split(",")[0] || row.display_name,
    detail: row.display_name,
    source: "osm",
    lat: Number(row.lat),
    lng: Number(row.lon),
  }));
}

async function findPlaces(text: string, country: string | undefined, center: { lat: number; lng: number }) {
  if (!placesBlocked) {
    try {
      return await googlePlaces(text, country, center);
    } catch (reason) {
      const message = placeSearchError(reason);
      if (!message.startsWith("Place search is not enabled")) throw reason;
      placesBlocked = true;
    }
  }
  return nominatimSearch(text, country);
}

async function googlePlaces(text: string, country: string | undefined, center: { lat: number; lng: number }) {
  await loadPlaces();
  const region = country && /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : "";
  const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: text,
    includedRegionCodes: region ? [region] : undefined,
    locationBias: center,
  });
  return suggestions
    .map((item) => item.placePrediction)
    .filter((item): item is google.maps.places.PlacePrediction => item != null)
    .map((item) => ({
      id: item.placeId,
      title: item.mainText?.text || item.text.text,
      detail: item.secondaryText?.text || "",
      source: "google" as const,
      prediction: item,
    }));
}

function quotesFrom(place: google.maps.places.Place): PlaceQuote[] {
  return (place.reviews ?? []).slice(0, 3).flatMap((review) => {
    const text = review.text || review.originalText || "";
    if (!text) return [];
    return [
      {
        author: review.authorAttribution?.displayName || "Google reviewer",
        rating: review.rating,
        text,
        when: review.relativePublishTimeDescription || "",
      },
    ];
  });
}

function chosenFromGoogle(
  place: google.maps.places.Place,
  fallback: { name: string; lat: number; lng: number; address?: string; placeId?: string },
): ChosenPlace | null {
  const point = place.location;
  const name = place.displayName || fallback.name;
  if (!name) return null;
  return {
    name,
    lat: point?.lat() ?? fallback.lat,
    lng: point?.lng() ?? fallback.lng,
    address: place.formattedAddress || fallback.address || "",
    rating: place.rating ?? null,
    ratingCount: place.userRatingCount ?? null,
    type: place.primaryTypeDisplayName || "",
    summary: place.editorialSummary || "",
    reviewSummary: place.reviewSummary?.text || "",
    reviews: quotesFrom(place),
    photoUrl: place.photos?.[0]?.getURI({ maxWidth: 640 }) || "",
    placeId: place.id || fallback.placeId || "",
    source: "google",
  };
}

async function withReviews(place: google.maps.places.Place, chosen: ChosenPlace) {
  try {
    await place.fetchFields({ fields: ["reviews", "reviewSummary"] });
  } catch {
    return chosen;
  }
  return {
    ...chosen,
    reviewSummary: place.reviewSummary?.text || chosen.reviewSummary,
    reviews: quotesFrom(place),
  };
}

async function nominatimAt(lat: number, lng: number) {
  const params = new URLSearchParams({ format: "jsonv2", lat: String(lat), lon: String(lng), zoom: "18" });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { name?: string; display_name?: string };
  const name = body.name || body.display_name?.split(",")[0] || "";
  if (!name) return null;
  return blankPlace({ name, lat, lng, address: body.display_name || "" });
}

export async function nearbyPlaces(lat: number, lng: number): Promise<ChosenPlace[]> {
  if (!placesBlocked) {
    try {
      await loadPlaces();
      const { places } = await google.maps.places.Place.searchNearby({
        fields: [
          "displayName",
          "location",
          "formattedAddress",
          "rating",
          "userRatingCount",
          "photos",
          "primaryTypeDisplayName",
          "editorialSummary",
          "id",
        ],
        locationRestriction: { center: { lat, lng }, radius: 200 },
        maxResultCount: 4,
        rankPreference: "DISTANCE",
      });
      const found = places.flatMap((place) => {
        const chosen = chosenFromGoogle(place, { name: "", lat, lng });
        return chosen ? [{ place, chosen }] : [];
      });
      if (found[0]) found[0].chosen = await withReviews(found[0].place, found[0].chosen);
      if (found.length > 0) return found.map((item) => item.chosen);
    } catch (reason) {
      const message = placeSearchError(reason);
      if (message.startsWith("Place search is not enabled")) placesBlocked = true;
    }
  }
  try {
    const named = await nominatimAt(lat, lng);
    return named ? [named] : [];
  } catch {
    return [];
  }
}

export function PlaceSearch({
  country,
  center,
  onChoose,
}: {
  country?: string;
  center: { lat: number; lng: number };
  onChoose: (place: ChosenPlace) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceHit[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const chosen = useRef("");
  const ticket = useRef(0);
  const onChooseRef = useRef(onChoose);

  useEffect(() => {
    onChooseRef.current = onChoose;
  }, [onChoose]);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2 || text === chosen.current) {
      setSuggestions([]);
      return;
    }
    const current = ++ticket.current;
    const handle = window.setTimeout(() => {
      void findPlaces(text, country, center)
        .then((hits) => {
          if (current !== ticket.current) return;
          setError("");
          setSuggestions(hits);
          setOpen(hits.length > 0);
        })
        .catch((reason: unknown) => {
          if (current !== ticket.current) return;
          setSuggestions([]);
          setError(reason instanceof Error ? reason.message : "Place search is not available");
        });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [query, country, center.lat, center.lng]);

  async function choose(hit: PlaceHit) {
    setBusy(true);
    setError("");
    try {
      let name = hit.title;
      let lat = hit.lat;
      let lng = hit.lng;
      if (hit.prediction) {
        const place = hit.prediction.toPlace();
        await place.fetchFields({
          fields: [
            "displayName",
            "location",
            "formattedAddress",
            "rating",
            "userRatingCount",
            "photos",
            "primaryTypeDisplayName",
            "editorialSummary",
            "id",
          ],
        });
        const point = place.location;
        if (!point) throw new Error("That place has no point on the map");
        const picked = chosenFromGoogle(place, {
          name: hit.title,
          lat: point.lat(),
          lng: point.lng(),
          address: hit.detail,
          placeId: hit.prediction.placeId,
        });
        if (!picked) throw new Error("That place has no name");
        name = picked.name;
        lat = picked.lat;
        lng = picked.lng;
        chosen.current = name;
        setQuery(name);
        setSuggestions([]);
        setOpen(false);
        onChooseRef.current(await withReviews(place, picked));
        return;
      }
      if (lat == null || lng == null) throw new Error("That place has no point on the map");
      chosen.current = name;
      setQuery(name);
      setSuggestions([]);
      setOpen(false);
      onChooseRef.current(
        blankPlace({
          name,
          lat,
          lng,
          address: hit.detail,
        }),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not use that place");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid gap-2">
      <label className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => {
            chosen.current = "";
            setQuery(event.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            if (suggestions[0]) void choose(suggestions[0]);
          }}
          placeholder="Search for a place"
          aria-label="Search for a place"
          autoComplete="off"
          className="w-full rounded-2xl border border-border bg-background py-3 pr-4 pl-10"
        />
      </label>
      {open && suggestions.length > 0 ? (
        <ul className="absolute top-14 z-20 max-h-64 w-full overflow-y-auto rounded-2xl border border-border bg-background shadow-sm">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void choose(item)}
                className="block w-full px-4 py-3 text-left"
              >
                <span className="block text-sm font-medium">{item.title}</span>
                {item.detail && item.detail !== item.title ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.detail}</span>
                ) : null}
              </button>
            </li>
          ))}
          <li className="px-4 py-2 text-[11px] text-muted-foreground">
            {suggestions.some((item) => item.source === "google") ? "Google" : "OpenStreetMap"}
          </li>
        </ul>
      ) : null}
      {busy ? <p className="text-sm text-muted-foreground">Finding that place</p> : null}
      {error ? <p className="text-sm text-primary">{error}</p> : null}
    </div>
  );
}

export function PlacePicker({
  lat,
  lng,
  centerLat,
  centerLng,
  onPick,
}: {
  lat: number | null;
  lng: number | null;
  centerLat: number;
  centerLng: number;
  onPick: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onPickRef = useRef(onPick);
  const targetRef = useRef({ lat, lng });
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  targetRef.current = { lat, lng };

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  function showPin(map: google.maps.Map, position: { lat: number; lng: number }, zoomIn: boolean) {
    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({ map, position, icon: circleIcon(8) });
    } else {
      markerRef.current.setMap(map);
      markerRef.current.setPosition(position);
    }
    map.panTo(position);
    if (zoomIn && (map.getZoom() ?? 0) < 13) map.setZoom(15);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const start = targetRef.current;
        const pinned = start.lat != null && start.lng != null;
        const map = new google.maps.Map(
          containerRef.current,
          quietMapOptions({
            center: pinned ? { lat: start.lat as number, lng: start.lng as number } : { lat: centerLat, lng: centerLng },
            zoom: pinned ? 15 : 5,
          }),
        );
        mapRef.current = map;
        if (pinned) showPin(map, { lat: start.lat as number, lng: start.lng as number }, false);
        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          const next = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          showPin(map, next, true);
          onPickRef.current(next.lat, next.lng);
        });
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      });

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [centerLat, centerLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat == null || lng == null || !window.google?.maps) return;
    showPin(map, { lat, lng }, true);
  }, [lat, lng]);

  function locate() {
    if (!navigator.geolocation) {
      setError("This browser cannot share a location");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        const map = mapRef.current;
        if (map) showPin(map, next, true);
        onPickRef.current(next.lat, next.lng);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Allow location to drop a pin here");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  if (error && !mapRef.current) return <MapFallback message="The map did not load. Search for the place instead." />;

  return (
    <div>
      <div className="relative h-72 w-full">
        <div ref={containerRef} className="size-full" />
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-background px-3 py-2 text-sm shadow-sm disabled:opacity-60"
        >
          <LocateFixed className="size-4" />
          {locating ? "Locating" : "Locate"}
        </button>
      </div>
      {error ? <p className="px-3 py-2 text-center text-xs text-primary">{error}</p> : null}
    </div>
  );
}

export function PinMap({
  lng,
  lat,
  label,
}: {
  lng: number;
  lat: number;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let marker: google.maps.Marker | null = null;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const map = new google.maps.Map(
          containerRef.current,
          quietMapOptions({
            center: { lat, lng },
            zoom: 14,
            disableDefaultUI: true,
            gestureHandling: "none",
          }),
        );
        marker = new google.maps.Marker({
          map,
          position: { lat, lng },
          title: label,
          icon: circleIcon(8),
        });
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      });

    return () => {
      cancelled = true;
      marker?.setMap(null);
    };
  }, [lng, lat, label]);

  if (error) return <MapFallback message={error} />;

  return <div ref={containerRef} className="h-40 w-full" />;
}

function GooglePlaceDetails({ placeId, onFail }: { placeId: string; onFail: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let timer = 0;

    loadPlaces()
      .then(() => {
        if (cancelled) return;
        const details = new google.maps.places.PlaceDetailsElement();
        details.style.width = "100%";
        details.style.maxHeight = "22rem";
        details.style.overflow = "auto";
        details.style.border = "none";
        details.style.colorScheme = "light";
        details.style.setProperty("--gmp-mat-color-surface", "#f4f7f6");
        details.style.setProperty("--gmp-mat-color-on-surface", "#12232a");
        details.style.setProperty("--gmp-mat-color-on-surface-variant", "#5c6570");
        details.style.setProperty("--gmp-mat-color-primary", "#e12e2f");
        details.style.setProperty("--gmp-mat-color-outline-decorative", "transparent");
        details.style.setProperty("--gmp-mat-font-family", "inherit");

        const request = new google.maps.places.PlaceDetailsPlaceRequestElement({ place: placeId });
        const config = new google.maps.places.PlaceContentConfigElement();
        const media = new google.maps.places.PlaceMediaElement();
        media.lightboxPreferred = true;
        config.append(
          media,
          new google.maps.places.PlaceRatingElement(),
          new google.maps.places.PlaceTypeElement(),
          new google.maps.places.PlaceSummaryElement(),
          new google.maps.places.PlaceReviewSummaryElement(),
          new google.maps.places.PlaceReviewsElement(),
          new google.maps.places.PlaceAttributionElement(),
        );
        details.append(request, config);
        timer = window.setTimeout(() => onFailRef.current(), 8000);
        details.addEventListener("gmp-load", () => window.clearTimeout(timer));
        details.addEventListener("gmp-error", () => {
          window.clearTimeout(timer);
          onFailRef.current();
        });
        host.replaceChildren(details);
      })
      .catch(() => {
        if (!cancelled) onFailRef.current();
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      host.replaceChildren();
    };
  }, [placeId]);

  return <div ref={hostRef} className="border-t border-border bg-card" />;
}

export function PlaceCard({ place }: { place: ChosenPlace }) {
  const [widgetFailed, setWidgetFailed] = useState(false);
  const reviews =
    place.ratingCount != null
      ? `${place.ratingCount.toLocaleString()} ${place.ratingCount === 1 ? "review" : "reviews"}`
      : "";

  useEffect(() => {
    setWidgetFailed(false);
  }, [place.placeId]);

  if (place.placeId && !widgetFailed) {
    return <GooglePlaceDetails placeId={place.placeId} onFail={() => setWidgetFailed(true)} />;
  }

  const rich = Boolean(place.reviewSummary || place.reviews.length);

  return (
    <article className={rich ? "grid gap-3 border-t border-border bg-card p-3" : "flex gap-3 border-t border-border bg-card p-3"}>
      <div className={rich ? "relative h-40 w-full overflow-hidden rounded-2xl bg-[#efece6]" : "relative size-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-[#efece6]"}>
        {place.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={place.photoUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-[#8b9198]">
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2.5c-3.6 0-6.5 2.8-6.5 6.3 0 4.7 6.5 12.2 6.5 12.2s6.5-7.5 6.5-12.2c0-3.5-2.9-6.3-6.5-6.3zm0 8.6a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6z"
              />
            </svg>
          </span>
        )}
      </div>
      <div className="min-w-0 py-0.5">
        <p className="truncate text-[15px] font-medium">{place.name}</p>
        {place.rating != null ? (
          <p className="mt-0.5 flex items-center gap-1 text-sm">
            <Star className="size-3.5 fill-current text-[#e12e2f]" />
            <span>{place.rating.toFixed(1)}</span>
            {reviews ? <span className="text-muted-foreground">· {reviews}</span> : null}
          </p>
        ) : null}
        {place.type ? <p className="mt-0.5 text-sm text-muted-foreground">{place.type}</p> : null}
        {place.summary ? <p className="mt-1 line-clamp-2 text-sm leading-5">{place.summary}</p> : null}
        {place.reviewSummary ? <p className="mt-1 line-clamp-3 text-sm leading-5">{place.reviewSummary}</p> : null}
        {place.reviews.slice(0, 2).map((review) => (
          <blockquote key={`${review.author}-${review.when}-${review.text.slice(0, 24)}`} className="mt-2 border-l-2 border-[#d5e3e6] pl-2">
            <p className="line-clamp-3 text-sm leading-5">{review.text}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {review.author}
              {review.rating != null ? ` · ${review.rating.toFixed(1)}` : ""}
              {review.when ? ` · ${review.when}` : ""}
            </p>
          </blockquote>
        ))}
        {place.address ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{place.address}</p> : null}
        {place.source === "google" ? <p className="mt-1 text-[11px] text-muted-foreground">Google</p> : null}
      </div>
    </article>
  );
}
