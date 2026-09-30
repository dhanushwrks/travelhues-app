"use client";

import { ChevronDown, CircleX, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { SocialIcon } from "@/components/social-links";
import { apiBase } from "@/lib/api";
import { countryFlag } from "@/lib/countries";
import {
  platformIds,
  platformPlaceholders,
  platforms,
  type PlatformId,
  type SocialLink,
} from "@/lib/profile";

export type Country = { code: string; name: string };

export const controlClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none";

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/countries`)
      .then((response) => response.json())
      .then((payload: Country[]) => {
        if (active) setCountries(payload);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return countries;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      {label ? <span>{label}</span> : null}
      {children}
      {hint ? <span className="text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function CountryField({
  countries,
  label,
  value,
  onChange,
}: {
  countries: Country[];
  label: string;
  value: string;
  onChange: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = countries.find((country) => country.code === value);
  const matches = useMemo(() => filterCountries(countries, query).slice(0, 8), [countries, query]);

  return (
    <Field label={label}>
      <input
        className={controlClass}
        value={open ? query : selected ? countryLabel(selected) : ""}
        placeholder="Search countries"
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
      />
      {open ? (
        <ul className="overflow-hidden rounded-2xl border border-border bg-card">
          {matches.length === 0 ? (
            <li className="px-4 py-3 text-muted-foreground">No country matches</li>
          ) : (
            matches.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(country.code);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <CountryMark country={country} />
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </Field>
  );
}

export function CountryMultiField({
  countries,
  value,
  onChange,
}: {
  countries: Country[];
  value: string[];
  onChange: (codes: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const matches = useMemo(
    () => filterCountries(countries, query).filter((country) => !value.includes(country.code)).slice(0, 8),
    [countries, query, value],
  );

  return (
    <div className="grid gap-2">
      <Field label="Countries travelled">
        <input
          className={controlClass}
          value={query}
          placeholder="Search and add"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        />
      </Field>
      {open ? (
        <ul className="overflow-hidden rounded-2xl border border-border bg-card">
          {matches.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">No country matches</li>
          ) : (
            matches.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange([...value, country.code]);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <CountryMark country={country} />
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((code) => (
            <li key={code}>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm"
                onClick={() => onChange(value.filter((item) => item !== code))}
              >
                <CountryMark
                  country={{
                    code,
                    name: countries.find((country) => country.code === code)?.name ?? code,
                  }}
                />
                <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function HobbyField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (hobbies: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const hobby = draft.trim();
    if (!hobby || hobby.length > 24) return;
    if (value.some((item) => item.toLowerCase() === hobby.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, hobby].slice(0, 12));
    setDraft("");
  }

  return (
    <div className="grid gap-2">
      <Field label="Hobbies" hint="Add a short tag, then press Add">
        <span className="flex gap-2">
          <input
            className={controlClass}
            value={draft}
            maxLength={24}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
          />
          <button type="button" className="rounded-2xl border border-border px-4 text-sm" onClick={add}>
            Add
          </button>
        </span>
      </Field>
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((hobby) => (
            <li key={hobby}>
              <button
                type="button"
                className="rounded-full bg-secondary px-3 py-1 text-sm"
                onClick={() => onChange(value.filter((item) => item !== hobby))}
              >
                {hobby} ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SocialEditor({
  value,
  onChange,
}: {
  value: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}) {
  const links =
    value.length > 0
      ? value.map((link) => ({
          ...link,
          platform: platformIds.has(link.platform) ? link.platform : "youtube",
        }))
      : [{ platform: "youtube", url: "" }];

  function update(index: number, patch: Partial<SocialLink>) {
    onChange(links.map((link, item) => (item === index ? { ...link, ...patch } : link)));
  }

  return (
    <div className="grid gap-3">
      <h3 className="text-base font-semibold">Social Links</h3>
      {links.map((link, index) => {
        const platform = (platformIds.has(link.platform) ? link.platform : "youtube") as PlatformId;
        return (
          <div key={index} className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 rounded-xl border border-border bg-background">
              <PlatformPicker
                value={platform}
                onChange={(next) => update(index, { platform: next })}
              />
              <div className="relative min-w-0 flex-1 border-l border-border">
                <input
                  className="w-full rounded-r-xl bg-transparent py-3 pr-10 pl-3 text-sm outline-none"
                  type="url"
                  inputMode="url"
                  placeholder={platformPlaceholders[platform]}
                  value={link.url}
                  aria-label={`${platforms.find(([id]) => id === platform)?.[1] ?? "Social"} URL`}
                  onChange={(event) => update(index, { url: event.target.value })}
                />
                {link.url ? (
                  <button
                    type="button"
                    aria-label="Clear URL"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground"
                    onClick={() => update(index, { url: "" })}
                  >
                    <CircleX className="size-4" strokeWidth={1.75} />
                  </button>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              aria-label="Remove social link"
              className="shrink-0 p-1 text-foreground"
              onClick={() => {
                const next = links.filter((_, item) => item !== index);
                onChange(next.length > 0 ? next : [{ platform: "youtube", url: "" }]);
              }}
            >
              <X className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        );
      })}
      {links.length < platforms.length ? (
        <button
          type="button"
          className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-foreground"
          onClick={() => onChange([...links, { platform: "youtube", url: "" }])}
        >
          + Add social link
        </button>
      ) : null}
    </div>
  );
}

function PlatformPicker({
  value,
  onChange,
}: {
  value: PlatformId;
  onChange: (platform: PlatformId) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const label = platforms.find(([id]) => id === value)?.[1] ?? "Platform";

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-full items-center gap-1.5 rounded-l-xl px-3 py-3 text-foreground"
        onClick={() => setOpen((current) => !current)}
      >
        <SocialIcon platform={value} />
        <ChevronDown className="size-3.5 text-muted-foreground" strokeWidth={2} />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Social platforms"
          className="absolute top-full left-0 z-20 mt-1 grid gap-0.5 rounded-xl border border-border bg-card p-1 shadow-lg"
        >
          {platforms.map(([id, name]) => (
            <li key={id} role="option" aria-selected={id === value}>
              <button
                type="button"
                title={name}
                aria-label={name}
                className={`grid size-9 place-items-center rounded-lg ${
                  id === value ? "bg-secondary text-foreground" : "text-foreground hover:bg-secondary/70"
                }`}
                onClick={() => {
                  onChange(id);
                  setOpen(false);
                }}
              >
                <SocialIcon platform={id} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PhotoField({
  label,
  preview,
  onFile,
}: {
  label: string;
  preview: string;
  onFile: (file: File) => void;
}) {
  return (
    <Field label={label} hint="JPEG, PNG, or WebP under 1 MB">
      <span className="flex items-center gap-3">
        {preview ? (
          <UserPhoto src={preview} className="size-16 rounded-2xl object-cover" />
        ) : (
          <span className="size-16 rounded-2xl bg-secondary" />
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
          }}
        />
      </span>
    </Field>
  );
}

export function readImage(file: File) {
  if (file.size > 1_000_000) return Promise.reject(new Error("Photo must be under 1 MB"));
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that photo"));
    reader.readAsDataURL(file);
  });
}

export function compressImage(file: File, maxEdge: number) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    return Promise.reject(new Error("Use a JPEG, PNG, or WebP"));
  }
  if (file.size > 5_000_000) return Promise.reject(new Error("Photo must be under 5 MB"));
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const longest = Math.max(image.width, image.height);
      const scale = longest > maxEdge ? maxEdge / longest : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Could not read that photo"));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let quality = 0.82;
      let data = canvas.toDataURL("image/jpeg", quality);
      while (data.length > 1_600_000 && quality > 0.5) {
        quality -= 0.12;
        data = canvas.toDataURL("image/jpeg", quality);
      }
      resolve(data);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that photo"));
    };
    image.src = url;
  });
}

function UserPhoto({ src, className }: { src: string; className: string }) {
  return (
    // Uploaded photos are data URLs or API files, which the optimizer does not accept.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} />
  );
}

function filterCountries(countries: Country[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return countries;
  return countries.filter((country) => country.name.toLowerCase().includes(needle));
}

function countryLabel(country: Country) {
  const flag = countryFlag(country.code);
  return flag ? `${flag} ${country.name}` : country.name;
}

function CountryMark({ country }: { country: Country }) {
  const flag = countryFlag(country.code);
  return (
    <>
      {flag ? (
        <span aria-hidden className="text-lg leading-none">
          {flag}
        </span>
      ) : null}
      <span>{country.name}</span>
    </>
  );
}
