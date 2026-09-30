"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConsentCheckbox, consentRequiredMessage } from "@/components/consent-checkbox";
import { DateField } from "@/components/date-field";
import { PageLoader } from "@/components/loader";
import { HobbyChips, OnboardingScreen, onboardingInput } from "@/components/onboarding";
import {
  CountryField,
  CountryMultiField,
  PhotoField,
  controlClass,
  readImage,
  useCountries,
} from "@/components/profile-fields";
import { apiBase } from "@/lib/api";
import { saveSession, type AccountRole } from "@/lib/browser-session";
import { normalizeSocials, platforms, type SocialLink } from "@/lib/profile";

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

const total = 11;

export function InviteForm({ token, prefill }: { token: string; prefill: InvitePrefill | null }) {
  const router = useRouter();
  const countries = useCountries();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [consent, setConsent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(prefill?.name ?? "");
  const [country, setCountry] = useState(prefill?.country ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(prefill?.dateOfBirth ?? "");
  const [socials, setSocials] = useState<SocialLink[]>(
    prefill?.socials.length ? normalizeSocials(prefill.socials) : [{ platform: "instagram", url: "" }],
  );
  const [handle, setHandle] = useState(prefill?.handle ?? "");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState(prefill?.bio ?? "");
  const [hobbies, setHobbies] = useState<string[]>(prefill?.hobbies ?? []);
  const [countriesTraveled, setCountriesTraveled] = useState<string[]>(prefill?.countriesTraveled ?? []);
  const [avatar, setAvatar] = useState("");
  const [cover, setCover] = useState("");

  function problem() {
    if (step === 0 && (!email.includes("@") || password.length < 6)) return "Add an email and a password of at least 6 characters";
    if (step === 0 && !consent) return consentRequiredMessage;
    if (step === 1 && (handle.trim().length < 3 || !/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/.test(handle.trim()))) {
      return "Use at least 3 letters, numbers, or single hyphens";
    }
    if (step === 2 && !name.trim()) return "Add your name";
    if (step === 3 && bio.trim().length < 20) return "Write at least a sentence";
    if (step === 4 && !country) return "Choose your country";
    if (step === 5 && !dateOfBirth) return "Add your date of birth";
    if (step === 6 && !socials.some((link) => link.url.trim())) return "Add a link we can open";
    return "";
  }

  function back() {
    setError("");
    if (step === 0) {
      router.push("/login/tcc");
      return;
    }
    setStep((current) => current - 1);
  }

  function advance() {
    const message = problem();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    if (step >= total - 1) {
      void submit();
      return;
    }
    setStep((current) => current + 1);
  }

  function skip() {
    setError("");
    if (step >= total - 1) {
      void submit();
      return;
    }
    setStep((current) => current + 1);
  }

  async function submit() {
    if (!consent) {
      setError(consentRequiredMessage);
      setStep(0);
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/invites/${token}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
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
          Array.isArray(payload.message) ? payload.message.join(" ") : payload.message || "Could not create the account",
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

  const optional = step >= 7;
  const last = step === total - 1;
  const screens = [
    {
      title: "Your sign in",
      lead: "This email and password open the creator account. The invite works once.",
      body: (
        <div className="grid gap-3">
          <input
            className={onboardingInput}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            autoComplete="email"
            aria-label="Email"
          />
          <input
            className={onboardingInput}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete="new-password"
            aria-label="Password"
          />
          <ConsentCheckbox
            checked={consent}
            onChange={(checked) => {
              setConsent(checked);
              if (checked) setError("");
            }}
          />
        </div>
      ),
    },
    {
      title: "Your handle",
      lead: "This is the address of your page. Travelers find you here.",
      body: (
        <input
          className={onboardingInput}
          value={handle}
          onChange={(event) => setHandle(event.target.value.toLowerCase().replace(/\s/g, ""))}
          placeholder="your-name"
          aria-label="Handle"
          autoCapitalize="none"
          autoCorrect="off"
        />
      ),
    },
    {
      title: "Your name",
      lead: "This is the name on your page.",
      body: (
        <input
          className={onboardingInput}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          autoComplete="name"
          aria-label="Name"
        />
      ),
    },
    {
      title: "A sentence about your trips",
      lead: "Tell travelers what you write about.",
      body: (
        <textarea
          className="min-h-32 w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm outline-none"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          aria-label="Bio"
        />
      ),
    },
    {
      title: "Where you live",
      lead: "The country you write from.",
      body:
        countries.length === 0 ? (
          <PageLoader label="Loading countries" />
        ) : (
          <CountryField countries={countries} label="" value={country} onChange={setCountry} />
        ),
    },
    {
      title: "When were you born",
      lead: "Creator accounts are for people 13 and older.",
      body: <DateField label="" value={dateOfBirth} onChange={setDateOfBirth} />,
    },
    {
      title: "A link we can check",
      lead: "The public profile the desk already looked at. You can correct it.",
      body: (
        <div className="grid gap-3">
          <select
            className={controlClass}
            aria-label="Social network"
            value={socials[0]?.platform ?? "instagram"}
            onChange={(event) =>
              setSocials((current) => [{ platform: event.target.value, url: current[0]?.url ?? "" }, ...current.slice(1)])
            }
          >
            {platforms.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <input
            className={onboardingInput}
            value={socials[0]?.url ?? ""}
            onChange={(event) =>
              setSocials((current) => [{ platform: current[0]?.platform ?? "instagram", url: event.target.value }, ...current.slice(1)])
            }
            placeholder="instagram.com/you"
            aria-label="Profile link"
            inputMode="url"
          />
        </div>
      ),
    },
    {
      title: "A short headline",
      lead: "One line under your name. You can add it later.",
      body: (
        <input
          className={onboardingInput}
          value={headline}
          maxLength={80}
          onChange={(event) => setHeadline(event.target.value)}
          placeholder="Slow routes through cities"
          aria-label="Headline"
        />
      ),
    },
    {
      title: "What do you go for",
      lead: "The kinds of stops you like to write about.",
      body: <HobbyChips value={hobbies} onChange={setHobbies} />,
    },
    {
      title: "Countries you have been",
      lead: "Add the places you already know.",
      body:
        countries.length === 0 ? (
          <PageLoader label="Loading countries" />
        ) : (
          <CountryMultiField countries={countries} value={countriesTraveled} onChange={setCountriesTraveled} />
        ),
    },
    {
      title: "How you appear",
      lead: "A profile photo and a cover. Both can wait.",
      body: (
        <div className="grid gap-4">
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
        </div>
      ),
    },
  ];
  const screen = screens[step];

  return (
    <OnboardingScreen
      step={step}
      total={total}
      title={screen.title}
      lead={screen.lead}
      onBack={back}
      onContinue={advance}
      continueLabel={last ? "Create account" : "Continue"}
      onSkip={optional ? skip : undefined}
      pending={pending}
      error={error}
    >
      {screen.body}
    </OnboardingScreen>
  );
}
