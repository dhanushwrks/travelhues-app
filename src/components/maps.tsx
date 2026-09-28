"use client";

import { LocateFixed, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
          new google.maps.Map(containerRef.current, {
            center: { lat: 15.5, lng: 100.5 },
            zoom: 5,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
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

export type ChosenPlace = {
  name: string;
  lat: number;
  lng: number;
};

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
  const [suggestions, setSuggestions] = useState<google.maps.places.PlacePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const chosen = useRef("");
  const session = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const ticket = useRef(0);
  const onChooseRef = useRef(onChoose);

  useEffect(() => {
    onChooseRef.current = onChoose;
  }, [onChoose]);

  useEffect(() => {
    const text = query.trim();
    if (placesBlocked) {
      setError("Place search is not enabled for this map key yet.");
      return;
    }
    if (text.length < 2 || text === chosen.current) {
      setSuggestions([]);
      return;
    }
    const current = ++ticket.current;
    const handle = window.setTimeout(() => {
      void loadPlaces()
        .then(async () => {
          session.current ??= new google.maps.places.AutocompleteSessionToken();
          const region = country && /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : "";
          const { suggestions: next } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: text,
            sessionToken: session.current,
            includedRegionCodes: region ? [region] : undefined,
            locationBias: center,
          });
          if (current !== ticket.current) return;
          setError("");
          setSuggestions(
            next
              .map((item) => item.placePrediction)
              .filter((item): item is google.maps.places.PlacePrediction => item != null),
          );
          setOpen(true);
        })
        .catch((reason: unknown) => {
          if (current !== ticket.current) return;
          setSuggestions([]);
          const message = placeSearchError(reason);
          if (message.startsWith("Place search is not enabled")) placesBlocked = true;
          setError(message);
        });
    }, 280);
    return () => window.clearTimeout(handle);
  }, [query, country, center.lat, center.lng]);

  async function choose(prediction: google.maps.places.PlacePrediction) {
    setBusy(true);
    setError("");
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["displayName", "location"] });
      const point = place.location;
      if (!point) throw new Error("That place has no point on the map");
      const name = place.displayName || prediction.mainText?.text || prediction.text.text;
      chosen.current = name;
      setQuery(name);
      setSuggestions([]);
      setOpen(false);
      session.current = new google.maps.places.AutocompleteSessionToken();
      onChooseRef.current({ name, lat: point.lat(), lng: point.lng() });
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
            <li key={item.placeId}>
              <button
                type="button"
                onClick={() => void choose(item)}
                className="block w-full px-4 py-3 text-left"
              >
                <span className="block text-sm font-medium">{item.mainText?.text}</span>
                {item.secondaryText?.text ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.secondaryText.text}</span>
                ) : null}
              </button>
            </li>
          ))}
          <li className="px-4 py-2 text-[11px] text-muted-foreground">Google</li>
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
  onNamed,
}: {
  lat: number | null;
  lng: number | null;
  centerLat: number;
  centerLng: number;
  onPick: (lat: number, lng: number) => void;
  onNamed?: (name: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onPickRef = useRef(onPick);
  const onNamedRef = useRef(onNamed);
  const targetRef = useRef({ lat, lng });
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  targetRef.current = { lat, lng };

  useEffect(() => {
    onPickRef.current = onPick;
    onNamedRef.current = onNamed;
  }, [onPick, onNamed]);

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
        const map = new google.maps.Map(containerRef.current, {
          center: pinned ? { lat: start.lat as number, lng: start.lng as number } : { lat: centerLat, lng: centerLng },
          zoom: pinned ? 15 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
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
        void window.google.maps
          .importLibrary("geocoding")
          .then(() => new google.maps.Geocoder().geocode({ location: next }))
          .then(({ results }) => {
            const label = results[0]?.address_components.find((part) =>
              part.types.some((type) =>
                ["point_of_interest", "establishment", "premise", "route", "neighborhood"].includes(type),
              ),
            )?.long_name;
            if (label) onNamedRef.current?.(label);
          })
          .catch(() => undefined);
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
    <div className="relative h-56 w-full">
      <div ref={containerRef} className="size-full" />
      <button
        type="button"
        onClick={locate}
        disabled={locating}
        aria-label="Locate on the map"
        className="absolute right-3 bottom-3 grid size-11 place-items-center rounded-full bg-background shadow-sm disabled:opacity-60"
      >
        <LocateFixed className="size-5" />
      </button>
      {error ? (
        <p className="absolute inset-x-3 bottom-16 rounded-2xl bg-background/95 px-3 py-2 text-center text-xs text-primary">
          {error}
        </p>
      ) : null}
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
        const map = new google.maps.Map(containerRef.current, {
          center: { lat, lng },
          zoom: 14,
          disableDefaultUI: true,
          gestureHandling: "none",
          clickableIcons: false,
        });
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
