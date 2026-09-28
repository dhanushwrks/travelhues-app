"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  CountryField,
  CountryMultiField,
  Field,
  HobbyField,
  PhotoField,
  SocialEditor,
  controlClass,
  readImage,
  useCountries,
} from "@/components/profile-fields";
import { apiBase } from "@/lib/api";
import { saveSession, type AccountRole } from "@/lib/browser-session";
import type { SocialLink } from "@/lib/profile";

export type InvitePrefill = {
  name: string;
  country: string;
  dateOfBirth: string;
  socials: SocialLink[];
  handle: string;
  bio: string;
  hobbies: string[];
  countriesTraveled: string[];
};

export function InviteForm({
  token,
  prefill,
}: {
  token: string;
  prefill: InvitePrefill | null;
}) {
  const router = useRouter();
  const countries = useCountries();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(prefill?.name ?? "");
  const [country, setCountry] = useState(prefill?.country ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(prefill?.dateOfBirth ?? "");
  const [socials, setSocials] = useState<SocialLink[]>(
    prefill?.socials.length ? prefill.socials : [{ platform: "instagram", url: "" }],
  );
  const [handle, setHandle] = useState(prefill?.handle ?? "");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState(prefill?.bio ?? "");
  const [hobbies, setHobbies] = useState<string[]>(prefill?.hobbies ?? []);
  const [countriesTraveled, setCountriesTraveled] = useState<string[]>(prefill?.countriesTraveled ?? []);
  const [avatar, setAvatar] = useState("");
  const [cover, setCover] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${apiBase}/invites/${token}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          name,
          country,
          dateOfBirth,
          handle,
          headline,
          bio,
          hobbies,
          countriesTraveled,
          socials: socials.filter((link) => link.url.trim()),
          avatarDataUrl: avatar || undefined,
          coverDataUrl: cover || undefined,
        }),
      });
      const payload = (await response.json()) as {
        message?: string | string[];
        accessToken?: string;
        user?: { role: AccountRole; username: string; displayName: string };
      };
      if (!response.ok || !payload.accessToken || !payload.user) {
        setError(
          Array.isArray(payload.message)
            ? payload.message.join(" ")
            : payload.message || "Could not create the account",
        );
        return;
      }
      saveSession({ accessToken: payload.accessToken, user: payload.user });
      router.push("/account");
      router.refresh();
    } catch {
      setError("Could not reach Travelhues");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 px-5 pt-8 pb-12">
      <h1 className="font-display text-4xl">Open your creator account</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        This link is single use. The handle you choose is the address of your page.
      </p>
      <Field label="Email">
        <input className={controlClass} name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Password" hint="At least 6 characters">
        <input className={controlClass} name="password" type="password" required minLength={6} />
      </Field>
      <Field label="Handle">
        <input
          className={controlClass}
          value={handle}
          onChange={(event) => setHandle(event.target.value.toLowerCase())}
          required
        />
      </Field>
      <Field label="Name">
        <input className={controlClass} value={name} onChange={(event) => setName(event.target.value)} required />
      </Field>
      <Field label="Headline" hint="Up to 80 characters">
        <input
          className={controlClass}
          value={headline}
          maxLength={80}
          onChange={(event) => setHeadline(event.target.value)}
        />
      </Field>
      <Field label="Bio">
        <textarea className={`${controlClass} min-h-32`} value={bio} onChange={(event) => setBio(event.target.value)} required />
      </Field>
      <CountryField countries={countries} label="Country" value={country} onChange={setCountry} />
      <Field label="Date of birth">
        <input className={controlClass} type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} required />
      </Field>
      <CountryMultiField countries={countries} value={countriesTraveled} onChange={setCountriesTraveled} />
      <HobbyField value={hobbies} onChange={setHobbies} />
      <SocialEditor value={socials} onChange={setSocials} />
      <PhotoField
        label="Profile photo"
        preview={avatar}
        onFile={(file) => {
          readImage(file).then(setAvatar).catch((caught: unknown) => {
            setError(caught instanceof Error ? caught.message : "Could not read that photo");
          });
        }}
      />
      <PhotoField
        label="Cover photo"
        preview={cover}
        onFile={(file) => {
          readImage(file).then(setCover).catch((caught: unknown) => {
            setError(caught instanceof Error ? caught.message : "Could not read that photo");
          });
        }}
      />
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Please wait" : "Create creator account"}
      </button>
    </form>
  );
}
