"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { DateField } from "@/components/date-field";
import { PageLoader } from "@/components/loader";
import { HobbyChips, OnboardingScreen, onboardingInput } from "@/components/onboarding";
import { CountryField, CountryMultiField, controlClass, useCountries } from "@/components/profile-fields";
import { apiBase, apiMessage } from "@/lib/api";
import { platforms, type SocialLink } from "@/lib/profile";

const total = 8;

export function WaitlistForm() {
  const router = useRouter();
  const countries = useCountries();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [socials, setSocials] = useState<SocialLink[]>([{ platform: "instagram", url: "" }]);
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [countriesTraveled, setCountriesTraveled] = useState<string[]>([]);

  function problem() {
    if (step === 0 && !name.trim()) return "Add your name";
    if (step === 1 && !country) return "Choose your country";
    if (step === 2 && !dateOfBirth) return "Add your date of birth";
    if (step === 3 && !socials.some((link) => webAddress(link.url))) return "Add a link we can open, like instagram.com/you";
    if (step === 4 && (handle.trim().length < 3 || !/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/.test(handle.trim()))) {
      return "Use at least 3 letters, numbers, or single hyphens";
    }
    if (step === 5 && bio.trim().length < 20) return "Write at least a sentence";
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
      try {
        sessionStorage.setItem("th-join-name", name.trim());
      } catch {
        /* the confirmation still works without the name */
      }
      router.replace("/join?received=1");
    } catch {
      setError("Could not reach Travelhues");
    } finally {
      setPending(false);
    }
  }

  const optional = step >= 6;
  const last = step === total - 1;
  const screens = [
    {
      title: "Your name",
      lead: "This is the name travelers see on your page.",
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
      title: "Where you live",
      lead: "We use this to know which country you write from.",
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
      lead: "One public profile is enough. We use it to confirm you make travel stories.",
      body: (
        <div className="grid gap-3">
          <select
            className={controlClass}
            aria-label="Social network"
            value={socials[0]?.platform ?? "instagram"}
            onChange={(event) => setSocials([{ platform: event.target.value, url: socials[0]?.url ?? "" }])}
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
            onChange={(event) => setSocials([{ platform: socials[0]?.platform ?? "instagram", url: event.target.value }])}
            placeholder="instagram.com/you"
            aria-label="Profile link"
            inputMode="url"
          />
        </div>
      ),
    },
    {
      title: "Your handle",
      lead: "This becomes your page, like /u/your-name. Travelers use it to find you.",
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
      title: "A sentence about your trips",
      lead: "Tell travelers what you write about, in your own words.",
      body: (
        <textarea
          className="min-h-32 w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm outline-none"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="I write slow city walks and the meals worth the queue."
          aria-label="Bio"
        />
      ),
    },
    {
      title: "What do you go for",
      lead: "Pick the kinds of stops you like to write about. You can leave this for later.",
      body: <HobbyChips value={hobbies} onChange={setHobbies} />,
    },
    {
      title: "Countries you have been",
      lead: "Add the places you already know. This can wait.",
      body:
        countries.length === 0 ? (
          <PageLoader label="Loading countries" />
        ) : (
          <CountryMultiField countries={countries} value={countriesTraveled} onChange={setCountriesTraveled} />
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
      continueLabel={last ? "Send request" : "Continue"}
      onSkip={optional ? skip : undefined}
      pending={pending}
      error={error}
    >
      {screen.body}
    </OnboardingScreen>
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
