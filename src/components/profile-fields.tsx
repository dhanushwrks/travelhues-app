"use client";

import { useEffect, useMemo, useState } from "react";

import { apiBase } from "@/lib/api";
import { countryFlag } from "@/lib/countries";
import { platforms, type SocialLink } from "@/lib/profile";

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
  const links = value.length > 0 ? value : [{ platform: "instagram", url: "" }];

  function update(index: number, patch: Partial<SocialLink>) {
    onChange(links.map((link, item) => (item === index ? { ...link, ...patch } : link)));
  }

  return (
    <div className="grid gap-3">
      {links.map((link, index) => (
        <div key={index} className="grid gap-2">
          <Field label={index === 0 ? "Social link" : "Another link"}>
            <select
              className={controlClass}
              value={link.platform}
              onChange={(event) => update(index, { platform: event.target.value })}
            >
              {platforms.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <input
            className={controlClass}
            type="url"
            placeholder="instagram.com/you"
            value={link.url}
            onChange={(event) => update(index, { url: event.target.value })}
          />
          {links.length > 1 ? (
            <button
              type="button"
              className="justify-self-start text-sm text-muted-foreground"
              onClick={() => onChange(links.filter((_, item) => item !== index))}
            >
              Remove
            </button>
          ) : null}
        </div>
      ))}
      {links.length < 6 ? (
        <button
          type="button"
          className="rounded-2xl border border-border px-4 py-3 text-sm"
          onClick={() => onChange([...links, { platform: "instagram", url: "" }])}
        >
          Add a link
        </button>
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
