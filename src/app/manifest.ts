import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Travelhues",
    short_name: "Travelhues",
    description: "Stories, spots, and day-by-day itineraries.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#d5e3e6",
    theme_color: "#e12e2f",
    lang: "en",
    categories: ["travel"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
