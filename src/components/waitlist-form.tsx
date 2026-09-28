"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { DateField } from "@/components/date-field";
import {
  CountryField,
  CountryMultiField,
  Field,
  HobbyField,
  SocialEditor,
  controlClass,
  useCountries,
} from "@/components/profile-fields";
import { apiBase, apiMessage } from "@/lib/api";
import type { SocialLink } from "@/lib/profile";

const steps = ["You", "Link", "Page"] as const;

export function WaitlistForm() {
  const countries = useCountries();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [socials, setSocials] = useState<SocialLink[]>([{ platform: "instagram", url: "" }]);
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [countriesTraveled, setCountriesTraveled] = useState<string[]>([]);

  function next() {
    setError("");
    if (step === 0 && (!name.trim() || !country || !dateOfBirth)) {
      setError("Add your name, country, and date of birth");
      return;
    }
    if (step === 1 && !socials.some((link) => webAddress(link.url))) {
      setError("Add a social link we can open, like instagram.com/you");
      return;
    }
    setStep((current) => Math.min(current + 1, 2));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (handle.trim().length < 3 || bio.trim().length < 20) {
      setError("Add a handle and a bio of at least a sentence");
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`${apiBase}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          country,
          dateOfBirth,
          socials: socials
            .map((link) => ({ ...link, url: webAddress(link.url) }))
            .filter((link) => link.url),
          handle,
          bio,
          hobbies,
          countriesTraveled,
        }),
      });
      if (!response.ok) {
        setError(await apiMessage(response));
        return;
      }
      setSent(true);
    } catch {
      setError("Could not reach Travelhues");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="grid gap-4 px-5 pt-10">
        <h1 className="font-display text-4xl">Request sent</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          We will check the link you shared. If the profile is accepted, the desk sends an invite that expires.
        </p>
        <Link href="/login" className="text-sm">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 px-5 pt-8 pb-10">
      <Image src="/travelhues-logo.png" alt="Travelhues" width={374} height={102} className="h-10 w-fit" />
      <ol className="grid grid-cols-3 gap-3 text-sm">
        {steps.map((label, index) => (
          <li
            key={label}
            className={`border-b-2 pb-2 ${index === step ? "border-primary text-foreground" : "border-border text-muted-foreground"}`}
          >
            {label}
          </li>
        ))}
      </ol>
      {step === 0 ? (
        <div className="grid gap-4">
          <h1 className="font-display text-3xl">Who you are</h1>
          <Field label="Name">
            <input className={controlClass} value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>
          <CountryField countries={countries} label="Country" value={country} onChange={setCountry} />
          <DateField label="Date of birth" value={dateOfBirth} onChange={setDateOfBirth} />
        </div>
      ) : null}
      {step === 1 ? (
        <div className="grid gap-4">
          <h1 className="font-display text-3xl">A link we can check</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            One public profile is enough. We use it to confirm you make travel stories.
          </p>
          <SocialEditor value={socials} onChange={setSocials} />
        </div>
      ) : null}
      {step === 2 ? (
        <div className="grid gap-4">
          <h1 className="font-display text-3xl">The page travelers open</h1>
          <Field label="Handle" hint="This becomes your link, like dhanush_y">
            <input
              className={controlClass}
              value={handle}
              onChange={(event) => setHandle(event.target.value.toLowerCase())}
              required
            />
          </Field>
          <Field label="Bio">
            <textarea
              className={`${controlClass} min-h-32`}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              required
            />
          </Field>
          <HobbyField value={hobbies} onChange={setHobbies} />
          <CountryMultiField
            countries={countries}
            value={countriesTraveled}
            onChange={setCountriesTraveled}
          />
        </div>
      ) : null}
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" className="text-sm" onClick={() => setStep((current) => current - 1)}>
            Back
          </button>
        ) : (
          <Link href="/login/tcc" className="text-sm text-muted-foreground">
            Creator sign in
          </Link>
        )}
        {step < 2 ? (
          <button type="button" className="rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground" onClick={next}>
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-60"
          >
            {pending ? "Please wait" : "Send request"}
          </button>
        )}
      </div>
    </form>
  );
}

function webAddress(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    if (!url.hostname.includes(".")) return "";
    return url.toString();
  } catch {
    return "";
  }
}
