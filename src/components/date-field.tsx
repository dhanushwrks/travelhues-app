"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Field, controlClass } from "@/components/profile-fields";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [limit] = useState(latestBirthDate);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => viewFor(value, latestBirthDate()));

  const [limitYear, limitMonth] = limit.split("-").map(Number);
  const oldestYear = limitYear - 100;
  const cells = monthCells(view.year, view.month);
  const atNewest = view.year > limitYear || (view.year === limitYear && view.month >= limitMonth - 1);
  const atOldest = view.year < oldestYear || (view.year === oldestYear && view.month === 0);

  function shift(delta: number) {
    const date = new Date(view.year, view.month + delta, 1);
    setView(clampView(date.getFullYear(), date.getMonth(), limit));
  }

  return (
    <Field label={label}>
      <button
        type="button"
        className={`${controlClass} text-left ${value ? "" : "text-muted-foreground"}`}
        aria-expanded={open}
        onClick={() => {
          setView(viewFor(value, limit));
          setOpen((current) => !current);
        }}
      >
        {value ? formatDate(value) : "Choose a date"}
      </button>
      {open ? (
        <div className="grid gap-3 rounded-3xl border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid size-9 place-items-center rounded-full disabled:opacity-30"
              aria-label="Previous month"
              disabled={atOldest}
              onClick={() => shift(-1)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="min-w-0 flex-1 text-center text-sm font-medium">{months[view.month]}</p>
            <button
              type="button"
              className="grid size-9 place-items-center rounded-full disabled:opacity-30"
              aria-label="Next month"
              disabled={atNewest}
              onClick={() => shift(1)}
            >
              <ChevronRight className="size-4" />
            </button>
            <select
              className="rounded-2xl border border-border bg-background px-2 py-2 text-sm"
              aria-label="Year"
              value={view.year}
              onChange={(event) =>
                setView(clampView(Number(event.target.value), view.month, limit))
              }
            >
              {years(oldestYear, limitYear).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {weekdays.map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} />;
              const iso = toIso(view.year, view.month, day);
              const disabled = iso > limit;
              const selected = iso === value;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  className={`grid h-9 place-items-center rounded-full text-sm disabled:text-muted-foreground/40 ${
                    selected ? "bg-primary text-primary-foreground" : ""
                  }`}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </Field>
  );
}

function latestBirthDate() {
  const today = new Date();
  return toIso(today.getFullYear() - 13, today.getMonth(), today.getDate());
}

function viewFor(value: string, limit: string) {
  const source = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : limit;
  const [year, month] = source.split("-").map(Number);
  return clampView(year, month - 1, limit);
}

function clampView(year: number, month: number, limit: string) {
  const [limitYear, limitMonth] = limit.split("-").map(Number);
  const oldestYear = limitYear - 100;
  if (year > limitYear || (year === limitYear && month > limitMonth - 1)) {
    return { year: limitYear, month: limitMonth - 1 };
  }
  if (year < oldestYear) return { year: oldestYear, month: 0 };
  if (month < 0) return clampView(year - 1, month + 12, limit);
  if (month > 11) return clampView(year + 1, month - 12, limit);
  return { year, month };
}

function years(oldest: number, newest: number) {
  const list: number[] = [];
  for (let year = newest; year >= oldest; year -= 1) list.push(year);
  return list;
}

function monthCells(year: number, month: number) {
  const count = new Date(year, month + 1, 0).getDate();
  const leading = new Date(year, month, 1).getDay();
  const cells: Array<number | null> = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(day);
  return cells;
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return `${day} ${months[month - 1]} ${year}`;
}
