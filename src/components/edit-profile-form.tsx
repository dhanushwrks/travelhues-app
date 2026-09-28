"use client";

import Link from "next/link";
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
import { apiBase, apiMessage, mediaUrl } from "@/lib/api";
import { readCookie, saveSession } from "@/lib/browser-session";
import type { Person, SocialLink } from "@/lib/profile";

export function EditProfileForm({ person }: { person: Person }) {
  const router = useRouter();
  const countries = useCountries();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [username, setUsername] = useState(person.username);
  const [displayName, setDisplayName] = useState(person.displayName);
  const [headline, setHeadline] = useState(person.headline);
  const [bio, setBio] = useState(person.bio);
  const [country, setCountry] = useState(person.country);
  const [dateOfBirth, setDateOfBirth] = useState(person.dateOfBirth ?? "");
  const [hobbies, setHobbies] = useState(person.hobbies);
  const [countriesTraveled, setCountriesTraveled] = useState(person.countriesTraveled);
  const [socials, setSocials] = useState<SocialLink[]>(
    person.socials.length ? person.socials : [{ platform: "instagram", url: "" }],
  );
  const [avatar, setAvatar] = useState(mediaUrl(person.avatarUrl));
  const [cover, setCover] = useState(mediaUrl(person.coverUrl));
  const [avatarData, setAvatarData] = useState("");
  const [coverData, setCoverData] = useState("");
  const creator = person.role === "tcc";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch(`${apiBase}/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${readCookie("th_access")}`,
      },
      body: JSON.stringify({
        username,
        displayName,
        headline,
        ...(creator || bio.trim() ? { bio } : {}),
        country: country || undefined,
        dateOfBirth: dateOfBirth || undefined,
        hobbies,
        countriesTraveled,
        socials: socials.filter((link) => link.url.trim()),
        avatarDataUrl: avatarData || undefined,
        coverDataUrl: coverData || undefined,
      }),
    });
    setPending(false);
    if (!response.ok) {
      setError(await apiMessage(response));
      return;
    }
    const next = (await response.json()) as Person;
    saveSession({
      accessToken: readCookie("th_access"),
      user: {
        role: next.role,
        username: next.username,
        displayName: next.displayName,
      },
    });
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 px-5 pt-6 pb-12">
      <div className="flex items-center justify-between">
        <Link href="/account" className="text-sm">
          Back
        </Link>
        <h1 className="font-display text-2xl">Edit profile</h1>
        <span className="w-10" />
      </div>
      <PhotoField
        label="Profile photo"
        preview={avatar}
        onFile={(file) => {
          readImage(file)
            .then((value) => {
              setAvatarData(value);
              setAvatar(value);
            })
            .catch((caught: unknown) => {
              setError(caught instanceof Error ? caught.message : "Could not read that photo");
            });
        }}
      />
      <PhotoField
        label="Cover photo"
        preview={cover}
        onFile={(file) => {
          readImage(file)
            .then((value) => {
              setCoverData(value);
              setCover(value);
            })
            .catch((caught: unknown) => {
              setError(caught instanceof Error ? caught.message : "Could not read that photo");
            });
        }}
      />
      <Field label="Username" hint="Lowercase, used in your page address">
        <input className={controlClass} value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} required />
      </Field>
      <Field label="Name">
        <input className={controlClass} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
      </Field>
      <Field label="Headline" hint="Up to 80 characters">
        <input className={controlClass} value={headline} maxLength={80} onChange={(event) => setHeadline(event.target.value)} />
      </Field>
      <Field label="About">
        <textarea className={`${controlClass} min-h-32`} value={bio} onChange={(event) => setBio(event.target.value)} />
      </Field>
      {creator ? (
        <>
          <CountryField countries={countries} label="Country" value={country} onChange={setCountry} />
          <Field label="Date of birth">
            <input className={controlClass} type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
          </Field>
          <CountryMultiField countries={countries} value={countriesTraveled} onChange={setCountriesTraveled} />
          <HobbyField value={hobbies} onChange={setHobbies} />
          <SocialEditor value={socials} onChange={setSocials} />
        </>
      ) : null}
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/account" className="rounded-2xl bg-foreground px-4 py-3 text-center text-sm text-background">
          Cancel
        </Link>
        <button type="submit" disabled={pending} className="rounded-2xl bg-primary/15 px-4 py-3 text-sm disabled:opacity-60">
          {pending ? "Please wait" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
