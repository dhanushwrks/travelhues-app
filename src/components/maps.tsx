"use client";

import { useEffect, useRef, useState } from "react";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

let mapsPromise: Promise<void> | null = null;

function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.Map) return Promise.resolve();
  if (!apiKey) {
    return Promise.reject(new Error("Missing Google Maps API key"));
  }
  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
      script.async = true;
      script.onerror = () => {
        mapsPromise = null;
        reject(new Error("Google Maps failed to load"));
      };
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }
  return mapsPromise;
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
