"use client";

import { BackLink } from "@/components/back-link";
import { Loader } from "@/components/loader";
import { ProfileMast } from "@/components/profile-mast";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
import { normalizeSocials } from "@/lib/profile";

const usernamePattern = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/;

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
    person.socials.length ? normalizeSocials(person.socials) : [{ platform: "youtube", url: "" }],
  );
  const [avatar, setAvatar] = useState(mediaUrl(person.avatarUrl));
  const [cover, setCover] = useState(mediaUrl(person.coverUrl));
  const [avatarData, setAvatarData] = useState("");
  const [coverData, setCoverData] = useState("");
  const [clearAvatar, setClearAvatar] = useState(false);
  const [clearCover, setClearCover] = useState(false);
  const [introVideo, setIntroVideo] = useState(mediaUrl(person.introVideoUrl ?? ""));
  const [introVideoData, setIntroVideoData] = useState("");
  const [clearIntroVideo, setClearIntroVideo] = useState(false);
  const [introReading, setIntroReading] = useState(false);
  const creator = person.role === "tcc";
  const canChangeUsername = person.canChangeUsername === true || creator;
  const usernameAvailability = useUsernameAvailability(username, person.username, canChangeUsername);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const usernameChanged = canChangeUsername && username !== person.username;
    if (usernameChanged) {
      if (usernameAvailability.status === "checking" || usernameAvailability.status === "idle") {
        setPending(false);
        setError("Wait for the username check to finish");
        return;
      }
      if (usernameAvailability.status === "invalid") {
        setPending(false);
        setError(usernameAvailability.message);
        return;
      }
      if (usernameAvailability.status === "taken") {
        setPending(false);
        setError("That username is already taken");
        return;
      }
    }
    const response = await fetch(`${apiBase}/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${readCookie("th_access")}`,
      },
      body: JSON.stringify({
        ...(usernameChanged ? { username } : {}),
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
        ...(creator
          ? clearIntroVideo
            ? { introVideoUrl: "" }
            : introVideoData
              ? { introVideoDataUrl: introVideoData }
              : {}
          : {}),
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
        <BackLink href="/account" />
        <h1 className="font-display text-2xl">Edit profile</h1>
        <span className="w-10" />
      </div>
      <UserPhotos
        name={displayName}
        username={canChangeUsername ? undefined : person.username}
        lockUsername={!canChangeUsername}
        avatar={clearAvatar ? "" : avatar}
        cover={clearCover ? "" : cover}
        introVideoUrl={creator && !clearIntroVideo ? introVideo : undefined}
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
      {creator ? (
        <IntroVideoField
          preview={clearIntroVideo ? "" : introVideo}
          reading={introReading}
          onPick={async (file) => {
            setError("");
            setIntroReading(true);
            try {
              const clip = await readIntroClip(file);
              setClearIntroVideo(false);
              setIntroVideo(clip.previewUrl);
              setIntroVideoData(clip.dataUrl);
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : "Could not read that video");
            } finally {
              setIntroReading(false);
            }
          }}
          onRemove={() => {
            setError("");
            setIntroVideo("");
            setIntroVideoData("");
            setClearIntroVideo(true);
          }}
        />
      ) : null}
      {canChangeUsername ? (
        <Field
          label="Username"
          hint={
            creator
              ? "Lowercase, used in your page address"
              : "You can change this once. Lowercase letters, numbers, hyphens or underscores."
          }
        >
          <input
            className={controlClass}
            value={username}
            onChange={(event) => setUsername(event.target.value.toLowerCase())}
            required
            minLength={3}
            maxLength={30}
            autoComplete="username"
          />
          <UsernameStatus current={person.username} value={username} check={usernameAvailability} />
        </Field>
      ) : null}
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
        <button
          type="submit"
          disabled={
            pending ||
            (canChangeUsername &&
              username !== person.username &&
              (usernameAvailability.status === "checking" ||
                usernameAvailability.status === "taken" ||
                usernameAvailability.status === "invalid"))
          }
          className="flex items-center justify-center rounded-2xl bg-primary/15 px-4 py-3 text-sm disabled:opacity-60"
        >
          {pending ? <Loader label="Saving" /> : "Save changes"}
        </button>
      </div>
    </form>
  );
}

type UsernameCheck =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "taken" }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

function useUsernameAvailability(username: string, current: string, enabled: boolean): UsernameCheck {
  const [check, setCheck] = useState<UsernameCheck>({ status: "idle" });
  const requestId = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setCheck({ status: "idle" });
      return;
    }
    const value = username.trim().toLowerCase();
    if (!value || value === current) {
      setCheck({ status: "idle" });
      return;
    }
    if (value.length < 3 || !usernamePattern.test(value)) {
      setCheck({
        status: "invalid",
        message: "Use lowercase letters, numbers, and single hyphens or underscores",
      });
      return;
    }
    setCheck({ status: "checking" });
    const id = ++requestId.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(
            `${apiBase}/usernames/${encodeURIComponent(value)}/available`,
            { headers: { Authorization: `Bearer ${readCookie("th_access")}` } },
          );
          if (id !== requestId.current) return;
          if (!response.ok) {
            setCheck({ status: "error", message: await apiMessage(response) });
            return;
          }
          const payload = (await response.json()) as { available?: boolean };
          setCheck(payload.available ? { status: "available" } : { status: "taken" });
        } catch {
          if (id !== requestId.current) return;
          setCheck({ status: "error", message: "Could not check that username" });
        }
      })();
    }, 1500);
    return () => {
      window.clearTimeout(timer);
    };
  }, [username, current, enabled]);

  return check;
}

function UsernameStatus({
  current,
  value,
  check,
}: {
  current: string;
  value: string;
  check: UsernameCheck;
}) {
  if (!value || value === current) return null;
  if (check.status === "checking") {
    return <p className="text-sm text-muted-foreground">Checking availability…</p>;
  }
  if (check.status === "available") {
    return <p className="text-sm text-muted-foreground">Username is available</p>;
  }
  if (check.status === "taken") {
    return <p className="text-sm text-primary">That username is already taken</p>;
  }
  if (check.status === "invalid" || check.status === "error") {
    return <p className="text-sm text-primary">{check.message}</p>;
  }
  return null;
}

function UserPhotos({
  name,
  username,
  lockUsername = false,
  avatar,
  cover,
  introVideoUrl,
  onAvatar,
  onCover,
  onError,
}: {
  name: string;
  username?: string;
  lockUsername?: boolean;
  avatar: string;
  cover: string;
  introVideoUrl?: string;
  onAvatar: (value: string) => void;
  onCover: (value: string) => void;
  onError: (message: string) => void;
}) {
  return (
    <div className="-mx-4">
      <ProfileMast
        name={name || "?"}
        introVideoUrl={introVideoUrl}
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

function IntroVideoField({
  preview,
  reading,
  onPick,
  onRemove,
}: {
  preview: string;
  reading: boolean;
  onPick: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Field label="Introduction video" hint="Up to 30 seconds. MP4, MOV, or WebM under 8 MB. Shown as a red ring on your avatar.">
      {preview ? (
        <video src={preview} muted playsInline controls className="aspect-[9/16] max-h-64 w-full rounded-2xl bg-black object-cover" />
      ) : (
        <span className="grid aspect-[9/16] max-h-64 place-items-center rounded-2xl border border-dashed border-foreground/25 text-sm text-muted-foreground">
          {reading ? "Reading…" : "No introduction yet"}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={reading}
          className="rounded-full bg-secondary px-4 py-2 text-sm disabled:opacity-60"
          onClick={() => inputRef.current?.click()}
        >
          {preview ? "Change video" : "Add video"}
        </button>
        {preview ? (
          <button type="button" className="rounded-full px-4 py-2 text-sm text-primary" onClick={onRemove}>
            Remove
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void onPick(file);
        }}
      />
    </Field>
  );
}

const introMaxSeconds = 30;
const introMaxBytes = 8_000_000;

function readIntroClip(file: File) {
  if (!["video/mp4", "video/quicktime", "video/webm"].includes(file.type)) {
    return Promise.reject(new Error("Use an MP4, MOV, or WebM video"));
  }
  if (file.size > introMaxBytes) {
    return Promise.reject(new Error("Intro video must be under 8 MB"));
  }
  const previewUrl = URL.createObjectURL(file);
  return new Promise<{ previewUrl: string; dataUrl: string }>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = previewUrl;
    video.onloadedmetadata = () => {
      if (!Number.isFinite(video.duration) || video.duration > introMaxSeconds) {
        URL.revokeObjectURL(previewUrl);
        reject(new Error("Intro video must be 30 seconds or shorter"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve({ previewUrl, dataUrl: String(reader.result) });
      reader.onerror = () => {
        URL.revokeObjectURL(previewUrl);
        reject(new Error("Could not read that video"));
      };
      reader.readAsDataURL(file);
    };
    video.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error("Could not read that video"));
    };
  });
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
