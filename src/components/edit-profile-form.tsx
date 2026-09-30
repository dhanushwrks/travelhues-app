"use client";

import { Loader } from "@/components/loader";
import { ProfileMast } from "@/components/profile-mast";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  CountryField,
  CountryMultiField,
  Field,
  HobbyField,
  SocialEditor,
  compressImage,
  controlClass,
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
  const [clearAvatar, setClearAvatar] = useState(false);
  const [clearCover, setClearCover] = useState(false);
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
        ...(creator ? { username } : {}),
        displayName,
        headline,
        ...(creator || bio.trim() ? { bio } : {}),
        country: country || undefined,
        dateOfBirth: dateOfBirth || undefined,
        hobbies,
        countriesTraveled,
        socials: socials.filter((link) => link.url.trim()),
        ...(clearAvatar ? { avatarDataUrl: "" } : avatarData ? { avatarDataUrl: avatarData } : {}),
        ...(clearCover ? { coverDataUrl: "" } : coverData ? { coverDataUrl: coverData } : {}),
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
    <form onSubmit={onSubmit} className="grid h-full gap-5 overflow-y-auto px-5 pt-6 pb-12">
      <div className="flex items-center justify-between">
        <Link href="/account" className="text-sm">
          Back
        </Link>
        <h1 className="font-display text-2xl">Edit profile</h1>
        <span className="w-10" />
      </div>
      {creator ? (
        <>
          <UserPhotos
            name={displayName}
            lockUsername={false}
            avatar={clearAvatar ? "" : avatar}
            cover={clearCover ? "" : cover}
            onAvatar={(value) => {
              setError("");
              if (!value) {
                setAvatar("");
                setAvatarData("");
                setClearAvatar(true);
                return;
              }
              setClearAvatar(false);
              setAvatar(value);
              setAvatarData(value);
            }}
            onCover={(value) => {
              setError("");
              if (!value) {
                setCover("");
                setCoverData("");
                setClearCover(true);
                return;
              }
              setClearCover(false);
              setCover(value);
              setCoverData(value);
            }}
            onError={setError}
          />
          <Field label="Username" hint="Lowercase, used in your page address">
            <input className={controlClass} value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} required />
          </Field>
        </>
      ) : (
        <UserPhotos
          name={displayName}
          username={person.username}
          lockUsername
          avatar={clearAvatar ? "" : avatar}
          cover={clearCover ? "" : cover}
          onAvatar={(value) => {
            setError("");
            if (!value) {
              setAvatar("");
              setAvatarData("");
              setClearAvatar(true);
              return;
            }
            setClearAvatar(false);
            setAvatar(value);
            setAvatarData(value);
          }}
          onCover={(value) => {
            setError("");
            if (!value) {
              setCover("");
              setCoverData("");
              setClearCover(true);
              return;
            }
            setClearCover(false);
            setCover(value);
            setCoverData(value);
          }}
          onError={setError}
        />
      )}
      <Field label="Name">
        <input className={controlClass} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
      </Field>
      <Field label="Headline" hint="Up to 80 characters">
        <input className={controlClass} value={headline} maxLength={80} onChange={(event) => setHeadline(event.target.value)} />
      </Field>
      <Field label="About">
        <textarea className={`${controlClass} min-h-32`} value={bio} onChange={(event) => setBio(event.target.value)} />
      </Field>
      {creator ? null : (
        <>
          <CountryField countries={countries} label="Country" value={country} onChange={setCountry} />
          <HobbyField value={hobbies} onChange={setHobbies} />
        </>
      )}
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
        <button type="submit" disabled={pending} className="flex items-center justify-center rounded-2xl bg-primary/15 px-4 py-3 text-sm disabled:opacity-60">
          {pending ? <Loader label="Saving" /> : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function UserPhotos({
  name,
  username,
  lockUsername = false,
  avatar,
  cover,
  onAvatar,
  onCover,
  onError,
}: {
  name: string;
  username?: string;
  lockUsername?: boolean;
  avatar: string;
  cover: string;
  onAvatar: (value: string) => void;
  onCover: (value: string) => void;
  onError: (message: string) => void;
}) {
  return (
    <div className="-mx-4">
      <ProfileMast
        name={name || "?"}
        cover={cover ? <img src={cover} alt="" className="absolute inset-0 size-full object-cover" /> : null}
        avatar={avatar ? <img src={avatar} alt="" className="absolute inset-0 size-full object-cover" /> : null}
        coverSlot={
          <PhotoAction
            label={cover ? "Edit cover photo" : "Add cover photo"}
            hasPhoto={Boolean(cover)}
            className="relative"
            menuClass="right-0"
            maxEdge={1600}
            onPick={onCover}
            onRemove={() => onCover("")}
            onError={onError}
          />
        }
        avatarSlot={
          <PhotoAction
            label={avatar ? "Edit profile photo" : "Add profile photo"}
            hasPhoto={Boolean(avatar)}
            className="absolute -right-1 -bottom-1"
            menuClass="left-0"
            maxEdge={640}
            onPick={onAvatar}
            onRemove={() => onAvatar("")}
            onError={onError}
          />
        }
      />
      {lockUsername ? (
        <div className="px-4">
          <p className="text-sm text-muted-foreground">@{username}</p>
          <p className="text-sm text-muted-foreground">Username cannot be changed</p>
        </div>
      ) : null}
    </div>
  );
}

function PhotoAction({
  label,
  hasPhoto,
  className,
  menuClass,
  maxEdge,
  onPick,
  onRemove,
  onError,
}: {
  label: string;
  hasPhoto: boolean;
  className: string;
  menuClass: string;
  maxEdge: number;
  onPick: (value: string) => void;
  onRemove: () => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  function choose(file: File | undefined) {
    setOpen(false);
    if (!file) return;
    compressImage(file, maxEdge)
      .then(onPick)
      .catch((caught: unknown) => {
        onError(caught instanceof Error ? caught.message : "Could not read that photo");
      });
  }

  return (
    <div className={className}>
      {open ? (
        <button type="button" aria-label="Close" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
      ) : null}
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        className="relative z-20 grid size-8 place-items-center rounded-full bg-card text-foreground shadow-sm ring-1 ring-border"
        onClick={() => setOpen((value) => !value)}
      >
        <Pencil className="size-4" />
      </button>
      {open ? (
        <div className={`absolute z-20 mt-2 w-44 overflow-hidden rounded-2xl bg-card py-1 shadow-lg ring-1 ring-border ${menuClass}`}>
          <button
            type="button"
            className="block w-full px-4 py-2.5 text-left text-sm"
            onClick={() => inputRef.current?.click()}
          >
            {hasPhoto ? "Change photo" : "Add photo"}
          </button>
          {hasPhoto ? (
            <button
              type="button"
              className="block w-full px-4 py-2.5 text-left text-sm text-primary"
              onClick={() => {
                setOpen(false);
                onRemove();
              }}
            >
              Remove photo
            </button>
          ) : null}
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          choose(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
