"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function RequestReceived() {
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("th-join-name")?.trim() ?? "";
      setName(stored.split(/\s+/)[0] ?? "");
    } catch {
      setName("");
    }
  }, []);

  return (
    <div className="flex min-h-full flex-col px-6 pt-10 pb-8 md:mx-auto md:w-full md:max-w-md">
      <RequestMark />
      <h1 className="mt-8 font-display text-[1.85rem] leading-[1.15]">
        {name ? `${name}, we've taken your request` : "We've taken your request"}
      </h1>
      <p className="mt-3 max-w-[36ch] text-sm leading-6 text-muted-foreground">
        You're on the list to join as a creator. Our team will follow up. Explore whenever you're ready.
      </p>
      <Link
        href="/"
        className="mt-auto flex h-12 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
      >
        Explore
      </Link>
    </div>
  );
}

function RequestMark() {
  return (
    <svg viewBox="0 0 320 230" className="w-full max-w-[280px]" aria-hidden="true">
      <ellipse cx="168" cy="206" rx="108" ry="14" fill="#d5e3e6" />
      <g transform="rotate(-7 156 118)">
        <rect x="46" y="48" width="214" height="140" rx="18" fill="#f4f7f6" stroke="#12232a" strokeWidth="1.6" />
        <rect x="64" y="66" width="92" height="78" rx="10" fill="#d5e3e6" />
        <path d="M64 124c16-22 28-18 40-6 8 8 16-16 28-22 10-5 18 8 24 18v30H64Z" fill="#12232a" />
        <circle cx="136" cy="84" r="7" fill="#e12e2f" />
        <path d="M174 82h68M174 98h58M174 114h44" stroke="#12232a" strokeOpacity="0.28" strokeWidth="2.4" strokeLinecap="round" />
        <g transform="translate(198 132)">
          <rect width="40" height="36" rx="4" fill="none" stroke="#e12e2f" strokeWidth="1.5" strokeDasharray="2.2 2.2" />
          <path d="M20 8a6 6 0 0 0-6 6c0 5 6 11 6 11s6-6 6-11a6 6 0 0 0-6-6Z" fill="none" stroke="#e12e2f" strokeWidth="1.5" />
          <circle cx="20" cy="14" r="1.6" fill="#e12e2f" />
        </g>
      </g>
      <g className="motion-safe:animate-[request-drift_3.4s_ease-in-out_infinite]">
        <path d="M214 28l62 22-46 8 8 28-18-22-6 2Z" fill="#e12e2f" />
        <path d="M230 58l22 6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
