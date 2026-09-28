"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function CountrySearch({
  countries,
  selected,
}: {
  countries: { code: string; name: string }[];
  selected: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const current = countries.find((country) => country.code === selected);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = needle
      ? countries.filter((country) => country.name.toLowerCase().includes(needle))
      : countries;
    return pool.slice(0, 8);
  }, [countries, query]);

  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-sm">
        <span className="sr-only">Search countries</span>
        <input
          value={open ? query : current?.name ?? ""}
          placeholder={countries.length ? "Search countries" : "No countries are open yet"}
          disabled={countries.length === 0}
          className="rounded-full border border-border bg-background px-4 py-3 outline-none"
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        />
      </label>
      {open && countries.length > 0 ? (
        <ul className="overflow-hidden rounded-2xl border border-border bg-card">
          {matches.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">No country matches</li>
          ) : (
            matches.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(`/?country=${country.code}`);
                  }}
                >
                  {country.name}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
      {current ? (
        <button type="button" className="justify-self-start text-sm" onClick={() => router.push("/")}>
          Clear {current.name}
        </button>
      ) : null}
    </div>
  );
}
