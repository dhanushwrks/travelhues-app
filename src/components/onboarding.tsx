"use client";

import Image from "next/image";

import { BackLink } from "@/components/back-link";
import { Loader } from "@/components/loader";

export const onboardingInput =
  "h-12 w-full rounded-full border border-border bg-background px-4 text-sm outline-none";

export function OnboardingScreen({
  step,
  total,
  title,
  lead,
  onBack,
  onContinue,
  continueLabel,
  onSkip,
  pending = false,
  error = "",
  children,
}: {
  step: number;
  total: number;
  title: string;
  lead: string;
  onBack: () => void;
  onContinue: () => void;
  continueLabel: string;
  onSkip?: () => void;
  pending?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const progress = Math.round(((step + 1) / total) * 100);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!pending) onContinue();
      }}
      className="flex min-h-full flex-col px-5 pt-6 pb-8 md:mx-auto md:w-full md:max-w-md"
    >
      <Image
        src="/travelhues-logo.png"
        alt="Travelhues"
        width={374}
        height={102}
        priority
        className="mx-auto h-12 w-fit"
      />
      <div className="mt-6 flex items-center gap-3">
        <BackLink onClick={onBack} className="size-9" />
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#d5e3e6]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <h1 className="mt-8 font-display text-[1.75rem] leading-tight">{title}</h1>
      <p className="mt-2 max-w-[38ch] text-sm leading-6 text-muted-foreground">{lead}</p>
      <div className="mt-6">{children}</div>
      {error ? <p className="mt-4 text-sm text-primary">{error}</p> : null}
      <div className="mt-auto grid gap-3 pt-10">
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader label={continueLabel} /> : continueLabel}
        </button>
        {onSkip ? (
          <button
            type="button"
            disabled={pending}
            onClick={onSkip}
            className="h-12 rounded-full bg-[#eef3f2] text-sm font-medium disabled:opacity-60"
          >
            Skip for now
          </button>
        ) : null}
      </div>
    </form>
  );
}

const hobbyChoices = ["Food", "Temples", "Markets", "Walking", "Boats", "Photography", "Hiking", "Cafes"];

export function HobbyChips({ value, onChange }: { value: string[]; onChange: (hobbies: string[]) => void }) {
  function toggle(hobby: string) {
    const exists = value.some((item) => item.toLowerCase() === hobby.toLowerCase());
    onChange(
      exists
        ? value.filter((item) => item.toLowerCase() !== hobby.toLowerCase())
        : [...value, hobby].slice(0, 12),
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {hobbyChoices.map((hobby) => {
        const selected = value.some((item) => item.toLowerCase() === hobby.toLowerCase());
        return (
          <button
            key={hobby}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(hobby)}
            className={
              selected
                ? "rounded-full bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                : "rounded-full border border-border bg-background px-3.5 py-2 text-sm"
            }
          >
            {hobby}
          </button>
        );
      })}
    </div>
  );
}
